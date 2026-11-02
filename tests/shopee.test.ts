import { createHash, randomBytes } from 'node:crypto';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { enrichLink } from '../src/lib/server/enrich';
import { downloadImage, isImageHost, RemoteImageError, type Getter } from '../src/lib/server/remote-image';
import { fetchShopeeOffer, parseShopeeIds, shopeeConfig, ShopeeApiError, signature, type Poster } from '../src/lib/server/shopee-api';

// Nilai acak untuk tes, bukan kredensial asli.
const config = { appId: '123456', secret: randomBytes(16).toString('hex'), endpoint: 'https://open-api.affiliate.shopee.co.id/graphql' };

describe('parseShopeeIds', () => {
	it('membaca ID dari berbagai bentuk alamat Shopee', () => {
		expect(parseShopeeIds('https://shopee.co.id/product/95959099/3749336878?gads_t_sig=abc')).toEqual({ shopId: '95959099', itemId: '3749336878' });
		expect(parseShopeeIds('https://shopee.co.id/Serum-Niacinamide-i.111.222')).toEqual({ shopId: '111', itemId: '222' });
		expect(parseShopeeIds('https://shopee.co.id/universal-link/product/5/6')).toEqual({ shopId: '5', itemId: '6' });
	});
	it('null untuk link pendek, toko lain, atau alamat aneh', () => {
		expect(parseShopeeIds('https://s.shopee.co.id/abc')).toBeNull();
		expect(parseShopeeIds('https://tokopedia.com/product/1/2')).toBeNull();
		expect(parseShopeeIds('https://shopee.co.id.evil.com/product/1/2')).toBeNull();
	});
});

describe('shopeeConfig', () => {
	it('mati kalau App ID atau Secret kosong', () => {
		expect(shopeeConfig({})).toBeNull();
		expect(shopeeConfig({ SHOPEE_AFFILIATE_APP_ID: '1' })).toBeNull();
	});
	it('menolak endpoint di luar shopee.co.id', () => {
		expect(() => shopeeConfig({ SHOPEE_AFFILIATE_APP_ID: '1', SHOPEE_AFFILIATE_SECRET: 'x', SHOPEE_AFFILIATE_ENDPOINT: 'https://evil.example/graphql' })).toThrow(ShopeeApiError);
	});
});

describe('fetchShopeeOffer', () => {
	it('mengirim tanda tangan sesuai format dan membaca jawaban', async () => {
		let seen: { headers: Record<string, string>; body: string } | null = null;
		const poster: Poster = async (_url, headers, body) => {
			seen = { headers, body };
			return {
				status: 200,
				text: JSON.stringify({
					data: { productOfferV2: { nodes: [{ productName: 'Serum Niacinamide 10%', imageUrl: 'https://down-id.img.susercontent.com/file/abc', priceMin: '49900.00', offerLink: 'https://s.shopee.co.id/xyz' }] } }
				})
			};
		};
		const offer = await fetchShopeeOffer({ shopId: '1', itemId: '2' }, { config, poster, now: () => 1_700_000_000_000 });
		expect(offer).toEqual({ name: 'Serum Niacinamide 10%', price: 49900, imageUrl: 'https://down-id.img.susercontent.com/file/abc', offerLink: 'https://s.shopee.co.id/xyz' });
		const expected = createHash('sha256').update(`${config.appId}1700000000${seen!.body}${config.secret}`).digest('hex');
		expect(seen!.headers.Authorization).toBe(`SHA256 Credential=${config.appId}, Timestamp=1700000000, Signature=${expected}`);
		expect(signature(config.appId, 1700000000, seen!.body, config.secret)).toBe(expected);
		expect(seen!.body).toContain('productOfferV2(shopId: 1, itemId: 2');
	});

	it('null kalau produk tidak ada, error kalau Shopee menolak', async () => {
		const empty: Poster = async () => ({ status: 200, text: JSON.stringify({ data: { productOfferV2: { nodes: [] } } }) });
		expect(await fetchShopeeOffer({ shopId: '1', itemId: '2' }, { config, poster: empty })).toBeNull();
		const denied: Poster = async () => ({ status: 200, text: JSON.stringify({ errors: [{ message: 'Invalid Signature' }] }) });
		await expect(fetchShopeeOffer({ shopId: '1', itemId: '2' }, { config, poster: denied })).rejects.toThrow('Invalid Signature');
	});

	it('tidak menghubungi Shopee kalau belum dikonfigurasi', async () => {
		const poster: Poster = async () => {
			throw new Error('tidak boleh dipanggil');
		};
		expect(await fetchShopeeOffer({ shopId: '1', itemId: '2' }, { config: null, poster })).toBeNull();
	});
});

describe('downloadImage', () => {
	it('hanya dari server gambar toko', async () => {
		expect(isImageHost('down-id.img.susercontent.com')).toBe(true);
		expect(isImageHost('evil.example')).toBe(false);
		await expect(downloadImage('https://evil.example/a.jpg')).rejects.toThrow(RemoteImageError);
		await expect(downloadImage('http://down-id.img.susercontent.com/a')).rejects.toThrow(RemoteImageError);
	});

	it('menyimpan foto yang diunduh dan menolak redirect ke host lain', async () => {
		const jpg = await sharp({ create: { width: 900, height: 900, channels: 3, background: '#ffd3e6' } }).jpeg().toBuffer();
		const dir = mkdtempSync(join(tmpdir(), 'bynana-remote-'));
		const ok: Getter = async () => ({ status: 200, location: null, body: jpg });
		expect(await downloadImage('https://down-id.img.susercontent.com/file/abc', ok, dir)).toMatch(/^[a-f0-9]{16}$/);
		const bounce: Getter = async () => ({ status: 302, location: 'https://evil.example/x.jpg', body: Buffer.alloc(0) });
		await expect(downloadImage('https://down-id.img.susercontent.com/file/abc', bounce, dir)).rejects.toThrow('server gambar toko');
	});
});

describe('enrichLink', () => {
	it('tanpa Open API: hanya nama dari alamat, tanpa menghubungi Shopee', async () => {
		const r = await enrichLink('https://shopee.co.id/Sisir-Kayu-i.9.9', {
			config: () => null,
			offer: async () => {
				throw new Error('tidak boleh dipanggil');
			}
		});
		expect(r).toMatchObject({ store: 'shopee', name: 'Sisir Kayu', image: null, fromApi: false });
	});

	it('dengan Open API: nama, harga, dan foto dari Shopee', async () => {
		const r = await enrichLink('https://s.shopee.co.id/abc', {
			config: () => config,
			resolve: async () => ({ finalUrl: 'https://shopee.co.id/product/95959099/3749336878', name: null }),
			offer: async (ids) => {
				expect(ids).toEqual({ shopId: '95959099', itemId: '3749336878' });
				return { name: 'Masker Wajah', price: 25000, imageUrl: 'https://down-id.img.susercontent.com/file/x', offerLink: null };
			},
			download: async () => '0123456789abcdef'
		});
		expect(r).toEqual({ store: 'shopee', name: 'Masker Wajah', price: 25000, image: '0123456789abcdef', fromApi: true, message: null });
	});

	it('Open API gagal: tetap jalan dengan pesan yang jelas', async () => {
		const r = await enrichLink('https://shopee.co.id/product/1/2', {
			config: () => config,
			resolve: async (u) => ({ finalUrl: u, name: null }),
			offer: async () => {
				throw new ShopeeApiError('Shopee menolak: Invalid Signature');
			}
		});
		expect(r.fromApi).toBe(false);
		expect(r.message).toContain('Invalid Signature');
	});
});
