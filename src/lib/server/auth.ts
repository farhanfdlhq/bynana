import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from 'node:crypto';
import type { DB } from './db.ts';

const scrypt = (password: string, salt: Buffer, keylen: number, opts: ScryptOptions) =>
	new Promise<Buffer>((resolve, reject) => scryptCb(password, salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key))));

const N = 2 ** 15;
const R = 8;
const P = 1;
const KEYLEN = 32;
const MAXMEM = 64 * 1024 * 1024;

export const SESSION_COOKIE = 'bynana_sesi';
export const SESSION_DAYS = 30;
export const MAX_ATTEMPTS = 5;
export const WINDOW_MS = 15 * 60 * 1000;
export const MIN_PASSWORD = 10;

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16);
	const key = await scrypt(password.normalize('NFKC'), salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM });
	return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const parts = stored.split('$');
	if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
	const [, n, r, p, saltB64, keyB64] = parts;
	const expected = Buffer.from(keyB64, 'base64');
	const key = await scrypt(password.normalize('NFKC'), Buffer.from(saltB64, 'base64'), expected.length, {
		N: Number(n),
		r: Number(r),
		p: Number(p),
		maxmem: MAXMEM
	});
	return key.length === expected.length && timingSafeEqual(key, expected);
}

export function validatePassword(password: string): string | null {
	if (password.length < MIN_PASSWORD) return `Password minimal ${MIN_PASSWORD} karakter`;
	if (password.length > 200) return 'Password terlalu panjang';
	return null;
}

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

export interface AdminUser {
	id: number;
	email: string;
}

export function createSession(db: DB, userId: number, now = Date.now()): string {
	const token = randomBytes(32).toString('base64url');
	db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').run(
		sha256(token),
		userId,
		now + SESSION_DAYS * 86400 * 1000,
		now
	);
	db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now);
	return token;
}

export function getSessionUser(db: DB, token: string | undefined, now = Date.now()): AdminUser | null {
	if (!token || token.length > 100) return null;
	const row = db
		.prepare('SELECT u.id, u.email, s.expires_at FROM sessions s JOIN admin_user u ON u.id = s.user_id WHERE s.token_hash = ?')
		.get(sha256(token)) as { id: number; email: string; expires_at: number } | undefined;
	if (!row || row.expires_at < now) return null;
	return { id: row.id, email: row.email };
}

export function destroySession(db: DB, token: string | undefined): void {
	if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
}

export function destroyAllSessions(db: DB, userId: number): void {
	db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
}

export function loginKeys(ip: string, email: string): string[] {
	return [`ip:${ip}`, `email:${email.trim().toLowerCase()}`];
}

export function checkLoginAllowed(db: DB, keys: string[], now = Date.now()): boolean {
	db.prepare('DELETE FROM login_attempts WHERE at < ?').run(now - WINDOW_MS);
	const count = db.prepare('SELECT COUNT(*) AS n FROM login_attempts WHERE key = ? AND at >= ?');
	return keys.every((k) => (count.get(k, now - WINDOW_MS) as { n: number }).n < MAX_ATTEMPTS);
}

export function recordLoginFailure(db: DB, keys: string[], now = Date.now()): void {
	const insert = db.prepare('INSERT INTO login_attempts (key, at) VALUES (?, ?)');
	for (const k of keys) insert.run(k, now);
}

export function clearLoginFailures(db: DB, keys: string[]): void {
	const del = db.prepare('DELETE FROM login_attempts WHERE key = ?');
	for (const k of keys) del.run(k);
}

/** Hash tiruan supaya waktu proses sama saat email tidak terdaftar. */
let dummyHash: Promise<string> | undefined;

export async function authenticate(db: DB, email: string, password: string): Promise<AdminUser | null> {
	const row = db.prepare('SELECT id, email, password_hash FROM admin_user WHERE email = ?').get(email.trim().toLowerCase()) as
		| { id: number; email: string; password_hash: string }
		| undefined;
	if (!row) {
		dummyHash ??= hashPassword(randomBytes(12).toString('hex'));
		await verifyPassword(password, await dummyHash);
		return null;
	}
	return (await verifyPassword(password, row.password_hash)) ? { id: row.id, email: row.email } : null;
}

export async function createAdmin(db: DB, email: string, password: string): Promise<void> {
	const e = email.trim().toLowerCase();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new Error('Email tidak valid');
	const err = validatePassword(password);
	if (err) throw new Error(err);
	db.prepare('INSERT INTO admin_user (email, password_hash) VALUES (?, ?)').run(e, await hashPassword(password));
}

export async function setAdminPassword(db: DB, userId: number, password: string): Promise<void> {
	const err = validatePassword(password);
	if (err) throw new Error(err);
	db.prepare('UPDATE admin_user SET password_hash = ? WHERE id = ?').run(await hashPassword(password), userId);
	destroyAllSessions(db, userId);
}
