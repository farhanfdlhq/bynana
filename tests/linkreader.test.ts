import { describe, expect, it } from 'vitest';
import { isPrivateAddress, resolveLink, type Requester } from '../src/lib/server/linkreader';

function fake(map: Record<string, { status: number; location?: string }>): Requester {
	return async (url) => {
		const hop = map[url];
		if (!hop) throw new Error('tidak terduga: ' + url);
		return { status: hop.status, location: hop.location ?? null };
	};
}

describe('isPrivateAddress', () => {
	it('menolak alamat lokal dan privat', () => {
		for (const ip of ['127.0.0.1', '10.1.2.3', '192.168.1.1', '172.16.0.1', '169.254.169.254', '0.0.0.0', '::1', 'fd00::1', '::ffff:127.0.0.1', '100.64.0.1']) {
			expect(isPrivateAddress(ip), ip).toBe(true);
		}
	});
	it('menerima alamat publik', () => {
		expect(isPrivateAddress('103.10.10.10')).toBe(false);
		expect(isPrivateAddress('2606:4700::1111')).toBe(false);
	});
});

describe('resolveLink', () => {
	it('mengikuti link pendek Shopee sampai nama produk', async () => {
		const r = await resolveLink(
			'https://s.shopee.co.id/abc',
			fake({
				'https://s.shopee.co.id/abc': { status: 302, location: 'https://shopee.co.id/Serum-Niacinamide-i.1.2?aff=1' }
			})
		);
		expect(r.name).toBe('Serum Niacinamide');
		expect(r.finalUrl).toContain('shopee.co.id/Serum-Niacinamide-i.1.2');
	});

	it('tanpa nama kalau halaman akhir tidak menaruh nama di alamat', async () => {
		const r = await resolveLink('https://vt.tokopedia.com/t/x/', fake({ 'https://vt.tokopedia.com/t/x/': { status: 200 } }));
		expect(r.name).toBeNull();
	});

	it('menolak redirect ke host asing', async () => {
		await expect(
			resolveLink('https://s.shopee.co.id/abc', fake({ 'https://s.shopee.co.id/abc': { status: 302, location: 'https://evil.example/x' } }))
		).rejects.toThrow('Bukan alamat toko');
	});

	it('menolak alamat IP dan http', async () => {
		await expect(resolveLink('https://127.0.0.1/x', fake({}))).rejects.toThrow();
		await expect(resolveLink('http://s.shopee.co.id/x', fake({}))).rejects.toThrow();
	});

	it('berhenti setelah 5 redirect', async () => {
		const map: Record<string, { status: number; location: string }> = {};
		for (let i = 0; i < 10; i++) map[`https://s.shopee.co.id/${i}`] = { status: 302, location: `https://s.shopee.co.id/${i + 1}` };
		await expect(resolveLink('https://s.shopee.co.id/0', fake(map))).rejects.toThrow('Terlalu banyak');
	});
});
