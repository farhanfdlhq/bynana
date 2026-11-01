import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { MIGRATIONS } from './migrations.ts';

export type DB = Database.Database;

/** Folder data (database dan gambar). Diatur lewat DATA_DIR, bawaannya ./data. */
export function dataDir(): string {
	return resolve(process.env.DATA_DIR || './data');
}

export function migrate(db: DB): void {
	db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY)');
	const done = new Set(
		(db.prepare('SELECT version FROM schema_migrations').all() as { version: string }[]).map((r) => r.version)
	);
	for (const m of MIGRATIONS) {
		if (done.has(m.version)) continue;
		db.transaction(() => {
			db.exec(m.sql);
			db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(m.version);
		})();
	}
}

export function openDb(file?: string): DB {
	const path = file ?? join(dataDir(), 'bynana.sqlite');
	if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
	const db = new Database(path);
	db.pragma('journal_mode = WAL');
	db.pragma('foreign_keys = ON');
	db.pragma('busy_timeout = 5000');
	db.pragma('synchronous = NORMAL');
	migrate(db);
	return db;
}

let shared: DB | undefined;

export function getDb(): DB {
	if (!shared) shared = openDb();
	return shared;
}
