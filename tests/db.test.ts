import { describe, expect, it } from 'vitest';
import { migrate, openDb } from '../src/lib/server/db';

describe('database', () => {
	it('membuat semua tabel', () => {
		const db = openDb(':memory:');
		const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[]).map(
			(t) => t.name
		);
		for (const t of [
			'settings',
			'social_accounts',
			'categories',
			'cards',
			'products',
			'product_links',
			'number_counter',
			'click_daily',
			'admin_user',
			'sessions',
			'login_attempts'
		]) {
			expect(tables).toContain(t);
		}
	});

	it('migrasi aman dijalankan dua kali', () => {
		const db = openDb(':memory:');
		expect(() => migrate(db)).not.toThrow();
	});

	it('nomor produk unik', () => {
		const db = openDb(':memory:');
		db.prepare('INSERT INTO products (number, name) VALUES (?, ?)').run(459, 'A');
		expect(() => db.prepare('INSERT INTO products (number, name) VALUES (?, ?)').run(459, 'B')).toThrow();
	});
});
