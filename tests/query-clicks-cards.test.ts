import { describe, expect, it } from 'vitest';
import { activeCards, CardInputError, createCard, listAccounts, saveAccount } from '../src/lib/server/cards';
import { clickStats, isBot, recordClick, todayWib } from '../src/lib/server/clicks';
import { openDb } from '../src/lib/server/db';
import { createProduct } from '../src/lib/server/products';
import { parseQuery } from '../src/lib/server/query';

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 musical_ly_34.0';

describe('parseQuery', () => {
	it('mengenali bentuk nomor', () => {
		for (const q of ['459', 'no.459', 'No 459', '#459', ' 459 ', 'nomor 459', 'NO.459']) expect(parseQuery(q), q).toEqual({ number: 459 });
	});
	it('teks biasa', () => {
		expect(parseQuery('sunscreen')).toEqual({ text: 'sunscreen' });
		expect(parseQuery('serum 10%')).toEqual({ text: 'serum 10%' });
		expect(parseQuery('   ')).toBeNull();
		expect(parseQuery('0')).toEqual({ text: '0' });
	});
});

describe('klik', () => {
	it('bot tidak dihitung', () => {
		expect(isBot('facebookexternalhit/1.1')).toBe(true);
		expect(isBot('WhatsApp/2.23')).toBe(true);
		expect(isBot(null)).toBe(true);
		expect(isBot(UA)).toBe(false);
	});

	it('menjumlahkan klik per hari dan per produk', () => {
		const db = openDb(':memory:');
		const p = createProduct(db, { name: 'Serum', status: 'published', links: [{ url: 'https://s.shopee.co.id/a' }, { url: 'https://vt.tokopedia.com/t/b/' }] });
		const now = new Date('2026-11-01T10:00:00Z');
		recordClick(db, 'link', p.links[0].id, UA, now);
		recordClick(db, 'link', p.links[0].id, UA, now);
		recordClick(db, 'link', p.links[1].id, UA, now);
		recordClick(db, 'link', p.links[1].id, 'Googlebot/2.1', now);
		const s = clickStats(db, 7, now);
		expect(s.total).toBe(3);
		expect(s.products[0]).toMatchObject({ number: p.number, clicks: 3 });
		expect(s.products[0].stores).toEqual([
			{ store: 'shopee', clicks: 2 },
			{ store: 'tiktok', clicks: 1 }
		]);
	});

	it('hari dihitung dalam WIB', () => {
		expect(todayWib(new Date('2026-11-01T18:00:00Z'))).toBe('2026-11-02');
	});
});

describe('kartu dan akun', () => {
	it('kartu dengan tanggal hanya tampil di rentangnya', () => {
		const db = openDb(':memory:');
		createCard(db, { kind: 'promo', title: 'Diskon 11.11', startsAt: '2026-11-10', endsAt: '2026-11-12' });
		createCard(db, { kind: 'teks', title: 'Halo' });
		createCard(db, { kind: 'teks', title: 'Tersembunyi', visible: false });
		expect(activeCards(db, '2026-11-01').map((c) => c.title)).toEqual(['Halo']);
		expect(activeCards(db, '2026-11-11').map((c) => c.title)).toEqual(['Diskon 11.11', 'Halo']);
	});

	it('kartu link wajib punya URL https', () => {
		const db = openDb(':memory:');
		expect(() => createCard(db, { kind: 'link', title: 'X' })).toThrow(CardInputError);
		expect(() => createCard(db, { kind: 'link', title: 'X', url: 'javascript:alert(1)' })).toThrow(CardInputError);
	});

	it('banyak akun di satu platform', () => {
		const db = openDb(':memory:');
		saveAccount(db, { platform: 'tiktok', label: '@bynana', url: 'https://www.tiktok.com/@bynana' });
		saveAccount(db, { platform: 'tiktok', label: '@bynana.home', url: 'https://www.tiktok.com/@bynana.home' });
		expect(listAccounts(db).map((a) => a.label)).toEqual(['@bynana', '@bynana.home']);
	});
});
