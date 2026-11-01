import { describe, expect, it } from 'vitest';
import {
	authenticate,
	checkLoginAllowed,
	createAdmin,
	createSession,
	getSessionUser,
	hashPassword,
	loginKeys,
	recordLoginFailure,
	setAdminPassword,
	verifyPassword,
	WINDOW_MS
} from '../src/lib/server/auth';
import { openDb } from '../src/lib/server/db';

describe('password', () => {
	it('hash dan verifikasi', async () => {
		const h = await hashPassword('rahasia-panjang-sekali');
		expect(h.startsWith('scrypt$')).toBe(true);
		expect(await verifyPassword('rahasia-panjang-sekali', h)).toBe(true);
		expect(await verifyPassword('salah', h)).toBe(false);
	});

	it('akun admin dan login', async () => {
		const db = openDb(':memory:');
		await expect(createAdmin(db, 'nana@contoh.id', 'pendek')).rejects.toThrow();
		await createAdmin(db, 'Nana@Contoh.id', 'password-yang-cukup');
		expect(await authenticate(db, 'nana@contoh.id', 'password-yang-cukup')).toMatchObject({ email: 'nana@contoh.id' });
		expect(await authenticate(db, 'nana@contoh.id', 'salah-sekali-ya')).toBeNull();
		expect(await authenticate(db, 'orang@lain.id', 'password-yang-cukup')).toBeNull();
	});
});

describe('sesi', () => {
	it('berlaku sampai kedaluwarsa, dan hilang saat password diganti', async () => {
		const db = openDb(':memory:');
		await createAdmin(db, 'nana@contoh.id', 'password-yang-cukup');
		const now = Date.now();
		const token = createSession(db, 1, now);
		expect(getSessionUser(db, token, now)?.email).toBe('nana@contoh.id');
		expect(getSessionUser(db, token, now + 31 * 86400 * 1000)).toBeNull();
		expect(getSessionUser(db, 'token-palsu', now)).toBeNull();
		await setAdminPassword(db, 1, 'password-baru-yang-cukup');
		expect(getSessionUser(db, token, now)).toBeNull();
	});
});

describe('batas login', () => {
	it('email dikunci setelah 20 kali gagal dari banyak IP', () => {
		const db = openDb(':memory:');
		const now = Date.now();
		for (let i = 0; i < 20; i++) recordLoginFailure(db, loginKeys(`10.0.0.${i}`, 'nana@contoh.id'), now);
		expect(checkLoginAllowed(db, loginKeys('9.9.9.9', 'nana@contoh.id'), now)).toBe(false);
	});

	it('pengecekan password dibatasi yang berjalan bersamaan', async () => {
		const db = openDb(':memory:');
		await createAdmin(db, 'nana@contoh.id', 'password-yang-cukup');
		const results = await Promise.allSettled(Array.from({ length: 30 }, () => authenticate(db, 'nana@contoh.id', 'salah-salah-salah')));
		const busy = results.filter((r) => r.status === 'rejected');
		expect(busy.length).toBeGreaterThan(0);
		expect(results.filter((r) => r.status === 'fulfilled').length).toBeGreaterThanOrEqual(18);
	});

	it('percobaan ke-6 dalam 15 menit diblokir, lalu dibuka lagi', () => {
		const db = openDb(':memory:');
		const keys = loginKeys('1.2.3.4', 'nana@contoh.id');
		const now = Date.now();
		for (let i = 0; i < 5; i++) {
			expect(checkLoginAllowed(db, keys, now)).toBe(true);
			recordLoginFailure(db, keys, now);
		}
		expect(checkLoginAllowed(db, keys, now)).toBe(false);
		// IP lain dengan email yang sama masih boleh, supaya pemilik tidak mudah dikunci orang lain.
		expect(checkLoginAllowed(db, loginKeys('5.6.7.8', 'nana@contoh.id'), now)).toBe(true);
		expect(checkLoginAllowed(db, keys, now + WINDOW_MS + 1)).toBe(true);
	});
});
