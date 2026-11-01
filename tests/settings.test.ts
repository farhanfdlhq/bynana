import { describe, expect, it } from 'vitest';
import { openDb } from '../src/lib/server/db';
import { getSettings, setSetting } from '../src/lib/server/settings';

describe('pengaturan', () => {
	it('memakai bawaan', () => {
		const s = getSettings(openDb(':memory:'));
		expect(s.theme).toBe('blok');
		expect(s.name).toBe('bynana');
	});

	it('menyimpan tema yang dikenal', () => {
		const db = openDb(':memory:');
		setSetting(db, 'theme', 'pastel');
		expect(getSettings(db).theme).toBe('pastel');
	});

	it('menolak tema yang tidak dikenal', () => {
		const db = openDb(':memory:');
		// @ts-expect-error nilai sengaja salah
		expect(() => setSetting(db, 'theme', 'gelap')).toThrow();
	});
});
