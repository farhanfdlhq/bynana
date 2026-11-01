import { describe, expect, it } from 'vitest';
import { createCategory, deleteCategory, slugify } from '../src/lib/server/categories';
import { openDb } from '../src/lib/server/db';
import {
	createDraftsFromBulk,
	createProduct,
	deleteProduct,
	getByNumber,
	getLink,
	listAdmin,
	listPublished,
	nextNumber,
	NumberTakenError,
	ProductInputError,
	search,
	setStatus,
	updateProduct
} from '../src/lib/server/products';

const shopee = (s: string) => ({ url: `https://s.shopee.co.id/${s}` });

describe('nomor produk', () => {
	it('mulai dari 1, lalu melanjutkan nomor terbesar', () => {
		const db = openDb(':memory:');
		expect(nextNumber(db)).toBe(1);
		createProduct(db, { number: 459, name: 'Serum', links: [shopee('a')] });
		expect(nextNumber(db)).toBe(460);
		const p = createProduct(db, { name: 'Rak', links: [shopee('b')] });
		expect(p.number).toBe(460);
	});

	it('nomor yang dipakai ditolak', () => {
		const db = openDb(':memory:');
		createProduct(db, { number: 459, name: 'A', links: [] });
		expect(() => createProduct(db, { number: 459, name: 'B', links: [] })).toThrow(NumberTakenError);
	});

	it('nomor yang dihapus tidak dipakai ulang', () => {
		const db = openDb(':memory:');
		const p = createProduct(db, { number: 20, name: 'A', links: [] });
		deleteProduct(db, p.id);
		expect(nextNumber(db)).toBe(21);
	});

	it('nomor tidak valid ditolak', () => {
		const db = openDb(':memory:');
		expect(() => createProduct(db, { number: 0, name: 'A', links: [] })).toThrow(ProductInputError);
		expect(() => createProduct(db, { number: 1.5, name: 'A', links: [] })).toThrow(ProductInputError);
	});
});

describe('tayang dan draf', () => {
	it('draf tidak tampil di publik, yang tayang tampil', () => {
		const db = openDb(':memory:');
		const d = createProduct(db, { name: 'Draf', links: [shopee('a')] });
		createProduct(db, { name: 'Tayang', status: 'published', links: [shopee('b')] });
		expect(listPublished(db).products.map((p) => p.name)).toEqual(['Tayang']);
		expect(getByNumber(db, d.number)).toBeUndefined();
		expect(getByNumber(db, d.number, { includeHidden: true })?.name).toBe('Draf');
	});

	it('tayang wajib punya nama dan link', () => {
		const db = openDb(':memory:');
		expect(() => createProduct(db, { name: '', status: 'published', links: [shopee('a')] })).toThrow(ProductInputError);
		const p = createProduct(db, { name: 'Tanpa link', links: [] });
		expect(() => setStatus(db, p.id, 'published')).toThrow(ProductInputError);
	});

	it('halaman berikutnya memakai nomor terakhir', () => {
		const db = openDb(':memory:');
		for (let i = 1; i <= 5; i++) createProduct(db, { name: `P${i}`, status: 'published', links: [shopee(String(i))] });
		const first = listPublished(db, { limit: 2 });
		expect(first.products.map((p) => p.number)).toEqual([5, 4]);
		expect(first.nextCursor).toBe(4);
		const second = listPublished(db, { limit: 2, before: 4 });
		expect(second.products.map((p) => p.number)).toEqual([3, 2]);
		const last = listPublished(db, { limit: 2, before: 2 });
		expect(last.nextCursor).toBeNull();
	});
});

describe('link dan toko', () => {
	it('mengenali toko, membuang duplikat, menolak link aneh', () => {
		const db = openDb(':memory:');
		const p = createProduct(db, {
			name: 'Serum',
			status: 'published',
			links: [shopee('a'), { url: 'https://vt.tokopedia.com/t/x/' }, shopee('a')]
		});
		expect(p.links.map((l) => l.store)).toEqual(['shopee', 'tiktok']);
		expect(getLink(db, p.number, 'tiktok')?.url).toBe('https://vt.tokopedia.com/t/x/');
		expect(() => createProduct(db, { name: 'X', links: [{ url: 'javascript:alert(1)' }] })).toThrow(ProductInputError);
	});

	it('ubah nomor ke nomor yang dipakai ditolak', () => {
		const db = openDb(':memory:');
		createProduct(db, { number: 1, name: 'A', links: [] });
		const b = createProduct(db, { number: 2, name: 'B', links: [] });
		expect(() => updateProduct(db, b.id, { number: 1, name: 'B', links: [] })).toThrow(NumberTakenError);
	});
});

describe('pencarian', () => {
	it('mencari semua kata di nama produk yang tayang', () => {
		const db = openDb(':memory:');
		createProduct(db, { name: 'Serum Niacinamide 10%', status: 'published', links: [shopee('a')] });
		createProduct(db, { name: 'Sunscreen Gel', status: 'published', links: [shopee('b')] });
		createProduct(db, { name: 'Serum draf', links: [shopee('c')] });
		expect(search(db, 'serum').map((p) => p.name)).toEqual(['Serum Niacinamide 10%']);
		expect(search(db, 'gel sun').map((p) => p.name)).toEqual(['Sunscreen Gel']);
		expect(search(db, '%')).toEqual([]);
	});

	it('admin mencari nomor', () => {
		const db = openDb(':memory:');
		createProduct(db, { number: 459, name: 'A', links: [] });
		createProduct(db, { number: 460, name: 'B', links: [] });
		expect(listAdmin(db, { q: 'no.459' }).products.map((p) => p.number)).toEqual([459]);
	});
});

describe('tempel banyak', () => {
	it('membuat draf, melewati link yang sudah ada dan nomor yang dipakai', () => {
		const db = openDb(':memory:');
		createProduct(db, { number: 459, name: 'Lama', links: [shopee('lama')] });
		const out = createDraftsFromBulk(db, [
			{ line: 1, number: 459, url: 'https://s.shopee.co.id/baru', store: 'shopee', name: null },
			{ line: 2, number: null, url: 'https://s.shopee.co.id/lama', store: 'shopee', name: null },
			{ line: 3, number: null, url: 'https://s.shopee.co.id/x', store: 'shopee', name: 'Rak Sepatu' },
			{ line: 4, number: 600, url: 'https://s.shopee.co.id/y', store: 'shopee', name: null }
		]);
		expect(out[0]).toMatchObject({ ok: false, number: 459 });
		expect(out[1]).toMatchObject({ ok: false, number: 459 });
		expect(out[2]).toMatchObject({ ok: true, number: 460, name: 'Rak Sepatu' });
		expect(out[3]).toMatchObject({ ok: true, number: 600 });
	});
});

describe('kategori', () => {
	it('slug dan hapus kategori melepas produk', () => {
		const db = openDb(':memory:');
		expect(slugify('Skincare & Makeup')).toBe('skincare-dan-makeup');
		const c = createCategory(db, 'Rumah');
		const c2 = createCategory(db, 'Rumah');
		expect(c2.slug).toBe('rumah-2');
		const p = createProduct(db, { name: 'Rak', categoryId: c.id, status: 'published', links: [shopee('a')] });
		deleteCategory(db, c.id);
		expect(getByNumber(db, p.number)?.categoryId).toBeNull();
	});
});
