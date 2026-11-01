import type { DB } from './db.ts';

export const THEMES = ['blok', 'pastel'] as const;
export type Theme = (typeof THEMES)[number];

export interface SiteSettings {
	theme: Theme;
	name: string;
	bio: string;
	avatar: string | null;
	seoTitle: string;
	seoDescription: string;
	footerNote: string;
}

const DEFAULTS: SiteSettings = {
	theme: 'blok',
	name: 'bynana',
	bio: 'Barang yang aku pakai dan suka. Lihat nomornya di video, cari di sini.',
	avatar: null,
	seoTitle: 'bynana: rekomendasi barang dengan nomor dari video',
	seoDescription:
		'Kumpulan link produk yang bynana bahas di TikTok, Instagram, Threads, dan Facebook. Cari nomor dari video untuk langsung ke tokonya.',
	footerNote: 'Harga dan stok mengikuti toko.'
};

const KEYS: Record<keyof SiteSettings, string> = {
	theme: 'theme',
	name: 'name',
	bio: 'bio',
	avatar: 'avatar',
	seoTitle: 'seo_title',
	seoDescription: 'seo_description',
	footerNote: 'footer_note'
};

export function isTheme(value: unknown): value is Theme {
	return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

export function getSettings(db: DB): SiteSettings {
	const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
	const map = new Map(rows.map((r) => [r.key, r.value]));
	const theme = map.get(KEYS.theme);
	return {
		theme: isTheme(theme) ? theme : DEFAULTS.theme,
		name: map.get(KEYS.name) || DEFAULTS.name,
		bio: map.get(KEYS.bio) ?? DEFAULTS.bio,
		avatar: map.get(KEYS.avatar) || null,
		seoTitle: map.get(KEYS.seoTitle) || DEFAULTS.seoTitle,
		seoDescription: map.get(KEYS.seoDescription) || DEFAULTS.seoDescription,
		footerNote: map.get(KEYS.footerNote) ?? DEFAULTS.footerNote
	};
}

export function setSetting<K extends keyof SiteSettings>(db: DB, key: K, value: SiteSettings[K]): void {
	if (key === 'theme' && !isTheme(value)) throw new Error('Tema tidak dikenal');
	const stored = value === null ? '' : String(value);
	db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(
		KEYS[key],
		stored
	);
}
