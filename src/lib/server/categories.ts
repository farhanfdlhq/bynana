import type { DB } from './db.ts';

export interface Category {
	id: number;
	name: string;
	slug: string;
	sort: number;
}

export function slugify(text: string): string {
	return (
		text
			.normalize('NFKD')
			.replace(/[̀-ͯ]/g, '')
			.toLowerCase()
			.replace(/&/g, ' dan ')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 60) || 'kategori'
	);
}

export function listCategories(db: DB): Category[] {
	return db.prepare('SELECT id, name, slug, sort FROM categories ORDER BY sort, name').all() as Category[];
}

export function getCategoryBySlug(db: DB, slug: string): Category | undefined {
	return db.prepare('SELECT id, name, slug, sort FROM categories WHERE slug = ?').get(slug) as Category | undefined;
}

function uniqueSlug(db: DB, base: string, exceptId?: number): string {
	let slug = base;
	for (let i = 2; ; i++) {
		const row = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug) as { id: number } | undefined;
		if (!row || row.id === exceptId) return slug;
		slug = `${base}-${i}`;
	}
}

function cleanName(name: string): string {
	const n = name.replace(/\s+/g, ' ').trim().slice(0, 40);
	if (!n) throw new Error('Nama kategori wajib diisi');
	return n;
}

export function createCategory(db: DB, name: string): Category {
	const n = cleanName(name);
	const slug = uniqueSlug(db, slugify(n));
	const sort = (db.prepare('SELECT COALESCE(MAX(sort), 0) + 1 AS s FROM categories').get() as { s: number }).s;
	const info = db.prepare('INSERT INTO categories (name, slug, sort) VALUES (?, ?, ?)').run(n, slug, sort);
	return { id: Number(info.lastInsertRowid), name: n, slug, sort };
}

export function renameCategory(db: DB, id: number, name: string): void {
	const n = cleanName(name);
	db.prepare('UPDATE categories SET name = ?, slug = ? WHERE id = ?').run(n, uniqueSlug(db, slugify(n), id), id);
}

export function deleteCategory(db: DB, id: number): void {
	db.prepare('DELETE FROM categories WHERE id = ?').run(id);
}

export function moveCategory(db: DB, id: number, direction: -1 | 1): void {
	const list = listCategories(db);
	const i = list.findIndex((c) => c.id === id);
	const j = i + direction;
	if (i < 0 || j < 0 || j >= list.length) return;
	[list[i], list[j]] = [list[j], list[i]];
	const update = db.prepare('UPDATE categories SET sort = ? WHERE id = ?');
	db.transaction(() => list.forEach((c, index) => update.run(index + 1, c.id)))();
}
