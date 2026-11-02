import type { DB } from './db.ts';
import { detectStore, isStore, normalizeAffiliateUrl, type Store } from './stores.ts';

export type ProductStatus = 'draft' | 'published' | 'archived';

export interface ProductLink {
	id: number;
	store: Store;
	url: string;
	sort: number;
}

export interface Product {
	id: number;
	number: number;
	name: string;
	price: number | null;
	image: string | null;
	categoryId: number | null;
	categoryName: string | null;
	categorySlug: string | null;
	status: ProductStatus;
	createdAt: string;
	publishedAt: string | null;
	links: ProductLink[];
}

export interface ProductInput {
	number?: number | null;
	name: string;
	price?: number | null;
	image?: string | null;
	categoryId?: number | null;
	status?: ProductStatus;
	links: { store?: Store; url: string }[];
}

export class NumberTakenError extends Error {
	number: number;
	constructor(number: number) {
		super(`Nomor ${number} sudah dipakai`);
		this.number = number;
	}
}

export class ProductInputError extends Error {}

export const MAX_NUMBER = 999999;
const MAX_LINKS = 6;

interface Row {
	id: number;
	number: number;
	name: string;
	price: number | null;
	image: string | null;
	category_id: number | null;
	category_name: string | null;
	category_slug: string | null;
	status: ProductStatus;
	created_at: string;
	published_at: string | null;
}

const SELECT = `SELECT p.id, p.number, p.name, p.price, p.image, p.category_id, c.name AS category_name, c.slug AS category_slug,
  p.status, p.created_at, p.published_at
  FROM products p LEFT JOIN categories c ON c.id = p.category_id`;

function attachLinks(db: DB, rows: Row[]): Product[] {
	if (!rows.length) return [];
	const ids = rows.map((r) => r.id);
	const links = db
		.prepare(`SELECT id, product_id, store, url, sort FROM product_links WHERE product_id IN (${ids.map(() => '?').join(',')}) ORDER BY sort, id`)
		.all(...ids) as (ProductLink & { product_id: number })[];
	const byProduct = new Map<number, ProductLink[]>();
	for (const l of links) {
		const list = byProduct.get(l.product_id) ?? [];
		list.push({ id: l.id, store: l.store, url: l.url, sort: l.sort });
		byProduct.set(l.product_id, list);
	}
	return rows.map((r) => ({
		id: r.id,
		number: r.number,
		name: r.name,
		price: r.price,
		image: r.image,
		categoryId: r.category_id,
		categoryName: r.category_name,
		categorySlug: r.category_slug,
		status: r.status,
		createdAt: r.created_at,
		publishedAt: r.published_at,
		links: byProduct.get(r.id) ?? []
	}));
}

export function nextNumber(db: DB): number {
	const row = db
		.prepare('SELECT MAX(COALESCE((SELECT max_number FROM number_counter WHERE id = 1), 0), COALESCE((SELECT MAX(number) FROM products), 0)) AS n')
		.get() as { n: number };
	return row.n + 1;
}

function bumpCounter(db: DB, n: number): void {
	db.prepare('UPDATE number_counter SET max_number = MAX(max_number, ?) WHERE id = 1').run(n);
}

function validNumber(n: unknown): number {
	const num = Number(n);
	if (!Number.isInteger(num) || num < 1 || num > MAX_NUMBER) throw new ProductInputError('Nomor hanya boleh angka 1 sampai 999999.');
	return num;
}

function cleanLinks(links: ProductInput['links']): { store: Store; url: string }[] {
	const out: { store: Store; url: string }[] = [];
	const seen = new Set<string>();
	for (const l of links) {
		if (!l.url || !l.url.trim()) continue;
		const url = normalizeAffiliateUrl(l.url);
		if (!url) throw new ProductInputError('Link ini tidak bisa dipakai. Tempel link lengkap yang diawali https://');
		if (url.length > 2000) throw new ProductInputError('Link terlalu panjang. Pakai link pendek dari tombol Bagikan di aplikasi toko.');
		if (seen.has(url)) continue;
		seen.add(url);
		out.push({ store: l.store && isStore(l.store) ? l.store : detectStore(url), url });
	}
	if (out.length > MAX_LINKS) throw new ProductInputError(`Satu produk paling banyak ${MAX_LINKS} link.`);
	return out;
}

function cleanName(name: string): string {
	return name.replace(/\s+/g, ' ').trim().slice(0, 160);
}

function cleanPrice(price: unknown): number | null {
	if (price === null || price === undefined || price === '') return null;
	const n = Number(price);
	if (!Number.isInteger(n) || n < 0 || n > 1_000_000_000) throw new ProductInputError('Harga hanya boleh angka, misalnya 49900.');
	return n;
}

function writeLinks(db: DB, productId: number, links: { store: Store; url: string }[]): void {
	db.prepare('DELETE FROM product_links WHERE product_id = ?').run(productId);
	const insert = db.prepare('INSERT INTO product_links (product_id, store, url, sort) VALUES (?, ?, ?, ?)');
	links.forEach((l, i) => insert.run(productId, l.store, l.url, i));
}

function checkPublishable(name: string, links: unknown[], status: ProductStatus): void {
	if (status !== 'published') return;
	if (!name) throw new ProductInputError('Isi nama produk dulu supaya bisa tayang.');
	if (!links.length) throw new ProductInputError('Tempel minimal satu link toko supaya bisa tayang.');
}

export function createProduct(db: DB, input: ProductInput): Product {
	return db.transaction(() => {
		const number = input.number == null ? nextNumber(db) : validNumber(input.number);
		if (db.prepare('SELECT 1 FROM products WHERE number = ?').get(number)) throw new NumberTakenError(number);
		const name = cleanName(input.name);
		const links = cleanLinks(input.links);
		const status = input.status ?? 'draft';
		checkPublishable(name, links, status);
		const info = db
			.prepare(
				`INSERT INTO products (number, name, price, image, category_id, status, published_at)
         VALUES (?, ?, ?, ?, ?, ?, CASE WHEN ? = 'published' THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now') END)`
			)
			.run(number, name, cleanPrice(input.price), input.image ?? null, input.categoryId ?? null, status, status);
		const id = Number(info.lastInsertRowid);
		writeLinks(db, id, links);
		bumpCounter(db, number);
		return getProduct(db, id)!;
	})();
}

export function updateProduct(db: DB, id: number, input: ProductInput): Product {
	return db.transaction(() => {
		const current = getProduct(db, id);
		if (!current) throw new ProductInputError('Produk tidak ditemukan');
		const number = input.number == null ? current.number : validNumber(input.number);
		if (number !== current.number && db.prepare('SELECT 1 FROM products WHERE number = ?').get(number)) {
			throw new NumberTakenError(number);
		}
		const name = cleanName(input.name);
		const links = cleanLinks(input.links);
		const status = input.status ?? current.status;
		checkPublishable(name, links, status);
		db.prepare(
			`UPDATE products SET number = ?, name = ?, price = ?, image = ?, category_id = ?, status = ?,
       published_at = CASE WHEN ? = 'published' AND published_at IS NULL THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now') ELSE published_at END,
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`
		).run(number, name, cleanPrice(input.price), input.image === undefined ? current.image : input.image, input.categoryId ?? null, status, status, id);
		writeLinks(db, id, links);
		bumpCounter(db, number);
		return getProduct(db, id)!;
	})();
}

export function setStatus(db: DB, id: number, status: ProductStatus): void {
	const p = getProduct(db, id);
	if (!p) throw new ProductInputError('Produk tidak ditemukan');
	checkPublishable(p.name, p.links, status);
	db.prepare(
		`UPDATE products SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
     published_at = CASE WHEN ? = 'published' AND published_at IS NULL THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now') ELSE published_at END
     WHERE id = ?`
	).run(status, status, id);
}

/** Menghapus permanen. Nomornya tetap tidak dipakai ulang. */
export function deleteProduct(db: DB, id: number): string | null {
	const p = getProduct(db, id);
	if (!p) return null;
	db.prepare('DELETE FROM products WHERE id = ?').run(id);
	return p.image;
}

export function getProduct(db: DB, id: number): Product | undefined {
	return attachLinks(db, db.prepare(`${SELECT} WHERE p.id = ?`).all(id) as Row[])[0];
}

export function getByNumber(db: DB, number: number, opts: { includeHidden?: boolean } = {}): Product | undefined {
	const where = opts.includeHidden ? 'p.number = ?' : "p.number = ? AND p.status = 'published'";
	return attachLinks(db, db.prepare(`${SELECT} WHERE ${where}`).all(number) as Row[])[0];
}

export function getLink(db: DB, productNumber: number, store: string): ProductLink | undefined {
	return db
		.prepare(
			`SELECT l.id, l.store, l.url, l.sort FROM product_links l JOIN products p ON p.id = l.product_id
       WHERE p.number = ? AND p.status = 'published' AND l.store = ? ORDER BY l.sort, l.id LIMIT 1`
		)
		.get(productNumber, store) as ProductLink | undefined;
}

export interface Page {
	products: Product[];
	nextCursor: number | null;
}

/** Produk tayang, nomor terbesar dulu. `before` adalah nomor terakhir dari halaman sebelumnya. */
export function listPublished(db: DB, opts: { categoryId?: number; before?: number; limit?: number } = {}): Page {
	const limit = Math.min(Math.max(opts.limit ?? 24, 1), 60);
	const where = ["p.status = 'published'"];
	const params: (number | string)[] = [];
	if (opts.categoryId) {
		where.push('p.category_id = ?');
		params.push(opts.categoryId);
	}
	if (opts.before) {
		where.push('p.number < ?');
		params.push(opts.before);
	}
	const rows = db.prepare(`${SELECT} WHERE ${where.join(' AND ')} ORDER BY p.number DESC LIMIT ?`).all(...params, limit + 1) as Row[];
	const hasMore = rows.length > limit;
	const products = attachLinks(db, rows.slice(0, limit));
	return { products, nextCursor: hasMore ? products[products.length - 1].number : null };
}

function likeTerms(q: string): string[] {
	return q
		.toLowerCase()
		.replace(/[%_\\]/g, ' ')
		.split(/\s+/)
		.filter((t) => t.length > 0)
		.slice(0, 6);
}

export function search(db: DB, q: string, limit = 48): Product[] {
	const terms = likeTerms(q);
	if (!terms.length) return [];
	const where = terms.map(() => 'LOWER(p.name) LIKE ?').join(' AND ');
	const rows = db
		.prepare(`${SELECT} WHERE p.status = 'published' AND ${where} ORDER BY p.number DESC LIMIT ?`)
		.all(...terms.map((t) => `%${t}%`), limit) as Row[];
	return attachLinks(db, rows);
}

export type AdminFilter = 'semua' | 'draf' | 'arsip' | 'klik';

export function listAdmin(db: DB, opts: { filter?: AdminFilter; q?: string; offset?: number; limit?: number } = {}): { products: (Product & { clicks: number })[]; total: number } {
	const filter = opts.filter ?? 'semua';
	const limit = Math.min(opts.limit ?? 30, 100);
	const where: string[] = [];
	const params: (string | number)[] = [];
	if (filter === 'draf') where.push("p.status = 'draft'");
	else if (filter === 'arsip') where.push("p.status = 'archived'");
	else where.push("p.status != 'archived'");
	const q = (opts.q ?? '').trim();
	const num = q.match(/^(?:no\.?\s*|#)?(\d{1,6})$/i);
	if (num) {
		where.push('p.number = ?');
		params.push(Number(num[1]));
	} else {
		for (const t of likeTerms(q)) {
			where.push('LOWER(p.name) LIKE ?');
			params.push(`%${t}%`);
		}
	}
	const whereSql = where.join(' AND ');
	const total = (db.prepare(`SELECT COUNT(*) AS n FROM products p WHERE ${whereSql}`).get(...params) as { n: number }).n;
	const clicksSql = `(SELECT COALESCE(SUM(cd.count), 0) FROM click_daily cd JOIN product_links pl ON cd.target_type = 'link' AND cd.target_id = pl.id
     WHERE pl.product_id = p.id AND cd.day >= date('now', '-29 days'))`;
	const order = filter === 'klik' ? 'clicks DESC, p.number DESC' : filter === 'draf' ? 'p.number ASC' : 'p.number DESC';
	const rows = db
		.prepare(`${SELECT.replace('p.published_at', `p.published_at, ${clicksSql} AS clicks`)} WHERE ${whereSql} ORDER BY ${order} LIMIT ? OFFSET ?`)
		.all(...params, limit, opts.offset ?? 0) as (Row & { clicks: number })[];
	const products = attachLinks(db, rows);
	return { products: products.map((p, i) => ({ ...p, clicks: rows[i].clicks })), total };
}

export function countByStatus(db: DB): Record<ProductStatus, number> {
	const rows = db.prepare('SELECT status, COUNT(*) AS n FROM products GROUP BY status').all() as { status: ProductStatus; n: number }[];
	const out: Record<ProductStatus, number> = { draft: 0, published: 0, archived: 0 };
	for (const r of rows) out[r.status] = r.n;
	return out;
}

export function findProductByUrl(db: DB, url: string): { id: number; number: number } | undefined {
	return db
		.prepare('SELECT p.id, p.number FROM product_links l JOIN products p ON p.id = l.product_id WHERE l.url = ? LIMIT 1')
		.get(url) as { id: number; number: number } | undefined;
}

export interface BulkDraftInput {
	line: number;
	number: number | null;
	url: string;
	store: Store;
	name: string | null;
	price?: number | null;
	image?: string | null;
}

export type BulkOutcome =
	| { line: number; ok: true; id: number; number: number; name: string }
	| { line: number; ok: false; reason: string; number?: number };

/** Membuat draf dari daftar link. Link yang sudah tersimpan dan nomor yang sudah dipakai dilewati dengan alasan. */
export function createDraftsFromBulk(db: DB, rows: BulkDraftInput[]): BulkOutcome[] {
	const out: BulkOutcome[] = [];
	for (const row of rows) {
		const existing = findProductByUrl(db, row.url);
		if (existing) {
			out.push({ line: row.line, ok: false, reason: `Link ini sudah ada di produk nomor ${existing.number}`, number: existing.number });
			continue;
		}
		try {
			const p = createProduct(db, {
				number: row.number,
				name: row.name ?? '',
				price: row.price ?? null,
				image: row.image ?? null,
				status: 'draft',
				links: [{ store: row.store, url: row.url }]
			});
			out.push({ line: row.line, ok: true, id: p.id, number: p.number, name: p.name });
		} catch (err) {
			if (err instanceof NumberTakenError) out.push({ line: row.line, ok: false, reason: err.message, number: err.number });
			else if (err instanceof ProductInputError) out.push({ line: row.line, ok: false, reason: err.message });
			else throw err;
		}
	}
	return out;
}
