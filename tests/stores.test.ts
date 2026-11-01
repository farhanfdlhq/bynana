import { describe, expect, it } from 'vitest';
import { detectStore, extractUrl, nameFromUrl, normalizeAffiliateUrl, parseBulkLines } from '../src/lib/server/stores';

describe('detectStore', () => {
	it('mengenali toko', () => {
		expect(detectStore('https://s.shopee.co.id/AbC123')).toBe('shopee');
		expect(detectStore('https://shopee.co.id/Serum-i.1.2')).toBe('shopee');
		expect(detectStore('https://vt.tokopedia.com/t/ZSabc/')).toBe('tiktok');
		expect(detectStore('https://www.tiktok.com/view/product/123')).toBe('tiktok');
		expect(detectStore('https://www.tokopedia.com/toko/barang')).toBe('tokopedia');
		expect(detectStore('https://s.lazada.co.id/s.abc')).toBe('lazada');
		expect(detectStore('https://contoh.com/x')).toBe('lainnya');
		expect(detectStore('bukan url')).toBe('lainnya');
	});

	it('tidak tertipu host yang mirip', () => {
		expect(detectStore('https://shopee.co.id.evil.com/x')).toBe('lainnya');
		expect(detectStore('https://notshopee.co.id/x')).toBe('lainnya');
	});
});

describe('extractUrl', () => {
	it('mengambil URL dari teks bagikan Shopee', () => {
		expect(extractUrl('Cek Serum Niacinamide dengan harga Rp49.900. Dapatkan di Shopee sekarang! https://s.shopee.co.id/9zXyZ')).toBe(
			'https://s.shopee.co.id/9zXyZ'
		);
	});
	it('membuang tanda baca di ujung', () => {
		expect(extractUrl('lihat (https://s.shopee.co.id/abc).')).toBe('https://s.shopee.co.id/abc');
	});
	it('null kalau tidak ada URL', () => {
		expect(extractUrl('tidak ada link')).toBeNull();
		expect(extractUrl('javascript:alert(1)')).toBeNull();
	});
	it('menaikkan http ke https dan menolak kredensial', () => {
		expect(normalizeAffiliateUrl('http://s.shopee.co.id/abc')).toBe('https://s.shopee.co.id/abc');
		expect(normalizeAffiliateUrl('https://user:pw@shopee.co.id/x')).toBeNull();
	});
});

describe('parseBulkLines', () => {
	it('membaca nomor di depan, baris kosong, duplikat, dan baris salah', () => {
		const text = [
			'459 https://s.shopee.co.id/aaa',
			'',
			'no.460 https://vt.tokopedia.com/t/bbb/',
			'#461 https://s.lazada.co.id/s.ccc',
			'https://s.shopee.co.id/ddd',
			'https://s.shopee.co.id/aaa',
			'ini bukan link'
		].join('\n');
		const { rows, invalid } = parseBulkLines(text);
		expect(rows.map((r) => r.number)).toEqual([459, 460, 461, null, null]);
		expect(rows.map((r) => r.store)).toEqual(['shopee', 'tiktok', 'lazada', 'shopee', 'shopee']);
		expect(rows.map((r) => r.duplicate)).toEqual([false, false, false, false, true]);
		expect(invalid).toEqual([{ line: 7, text: 'ini bukan link' }]);
	});

	it('teks bagikan dengan angka harga tidak dianggap nomor', () => {
		const { rows } = parseBulkLines('Cek Serum Rp49.900 https://s.shopee.co.id/x');
		expect(rows[0].number).toBeNull();
	});
});

describe('nameFromUrl', () => {
	it('Shopee', () => {
		expect(nameFromUrl('https://shopee.co.id/Serum-Niacinamide-10%25-30ml-i.123.456')).toBe('Serum Niacinamide 10% 30ml');
	});
	it('Lazada', () => {
		expect(nameFromUrl('https://www.lazada.co.id/products/rak-sepatu-susun-5-i1234-s5678.html')).toBe('Rak Sepatu Susun 5');
	});
	it('Tokopedia', () => {
		expect(nameFromUrl('https://www.tokopedia.com/tokoku/kemeja-linen-oversize')).toBe('Kemeja Linen Oversize');
	});
	it('null untuk link pendek', () => {
		expect(nameFromUrl('https://s.shopee.co.id/abc')).toBeNull();
		expect(nameFromUrl('https://vt.tokopedia.com/t/abc/')).toBeNull();
	});
});
