export const STORES = ['shopee', 'tiktok', 'tokopedia', 'lazada', 'lainnya'] as const;
export type Store = (typeof STORES)[number];

export const STORE_LABEL: Record<Store, string> = {
	shopee: 'Shopee',
	tiktok: 'TikTok Shop',
	tokopedia: 'Tokopedia',
	lazada: 'Lazada',
	lainnya: 'Toko lain'
};

/** Host per toko. Subdomain dari host ini ikut dikenali. */
const STORE_HOSTS: Record<Exclude<Store, 'lainnya'>, string[]> = {
	shopee: ['shopee.co.id', 'shp.ee', 'shope.ee'],
	tiktok: ['tiktok.com', 'vt.tokopedia.com'],
	tokopedia: ['tokopedia.com', 'tokopedia.link', 'tkp.me'],
	lazada: ['lazada.co.id', 'lzd.co']
};

export function isStore(value: unknown): value is Store {
	return typeof value === 'string' && (STORES as readonly string[]).includes(value);
}

function hostMatches(host: string, base: string): boolean {
	return host === base || host.endsWith('.' + base);
}

function hostOf(url: string): string | null {
	try {
		const u = new URL(url);
		if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
		return u.hostname.toLowerCase();
	} catch {
		return null;
	}
}

export function detectStore(url: string): Store {
	const host = hostOf(url);
	if (!host) return 'lainnya';
	// vt.tokopedia.com adalah link pendek TikTok Shop, jadi dicek sebelum tokopedia.com.
	if (hostMatches(host, 'vt.tokopedia.com')) return 'tiktok';
	for (const store of ['shopee', 'tiktok', 'tokopedia', 'lazada'] as const) {
		if (STORE_HOSTS[store].some((base) => hostMatches(host, base))) return store;
	}
	return 'lainnya';
}

/** Host yang boleh dibuka oleh pembaca link di server. */
export function isStoreHost(host: string): boolean {
	const h = host.toLowerCase();
	return Object.values(STORE_HOSTS)
		.flat()
		.some((base) => hostMatches(h, base));
}

/** Mengambil URL http(s) pertama dari teks, misalnya teks bagikan dari aplikasi Shopee. */
export function extractUrl(text: string): string | null {
	const match = text.match(/https?:\/\/[^\s<>"'`]+/i);
	if (!match) return null;
	const raw = match[0].replace(/[),.;!?\]]+$/, '');
	try {
		const u = new URL(raw);
		if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
		return u.toString();
	} catch {
		return null;
	}
}

/** URL affiliate yang boleh disimpan: https, atau http yang dinaikkan ke https. */
export function normalizeAffiliateUrl(text: string): string | null {
	const url = extractUrl(text.trim());
	if (!url) return null;
	const u = new URL(url);
	if (u.protocol === 'http:') u.protocol = 'https:';
	if (u.username || u.password) return null;
	return u.toString();
}

export interface BulkRow {
	line: number;
	number: number | null;
	url: string;
	store: Store;
	duplicate: boolean;
}

export interface BulkParseResult {
	rows: BulkRow[];
	invalid: { line: number; text: string }[];
}

const LEADING_NUMBER = /^\s*(?:no\.?|nomor|#)?\s*(\d{1,6})\b[\s.:)\-–]*/i;

/** Satu link per baris. Baris boleh diawali nomor: "459 https://...", "no.459 https://...", "#459 https://...". */
export function parseBulkLines(text: string): BulkParseResult {
	const rows: BulkRow[] = [];
	const invalid: { line: number; text: string }[] = [];
	const seen = new Set<string>();
	text.split(/\r?\n/).forEach((rawLine, index) => {
		const lineText = rawLine.trim();
		if (!lineText) return;
		const url = normalizeAffiliateUrl(lineText);
		if (!url) {
			invalid.push({ line: index + 1, text: lineText.slice(0, 200) });
			return;
		}
		const beforeUrl = lineText.slice(0, lineText.search(/https?:\/\//i));
		const numMatch = beforeUrl.match(LEADING_NUMBER);
		const number = numMatch ? Number(numMatch[1]) : null;
		rows.push({
			line: index + 1,
			number: number && number > 0 ? number : null,
			url,
			store: detectStore(url),
			duplicate: seen.has(url)
		});
		seen.add(url);
	});
	return { rows, invalid };
}

function titleCase(words: string): string {
	return words
		.split(/\s+/)
		.filter(Boolean)
		.map((w) => (/^\d/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
		.join(' ');
}

function cleanSlug(slug: string): string | null {
	let decoded = slug;
	try {
		decoded = decodeURIComponent(slug);
	} catch {
		/* biarkan apa adanya */
	}
	const text = decoded
		.replace(/[-_+]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	if (text.length < 3 || !/[a-z]/i.test(text)) return null;
	return titleCase(text).slice(0, 160);
}

/** Membaca nama produk dari alamat produk lengkap, kalau tokonya menaruh nama di alamat. */
export function nameFromUrl(url: string): string | null {
	let u: URL;
	try {
		u = new URL(url);
	} catch {
		return null;
	}
	const store = detectStore(url);
	const path = u.pathname;
	if (store === 'shopee') {
		// /Nama-Produk-i.123.456
		const m = path.match(/^\/(.+)-i\.\d+\.\d+\/?$/);
		return m ? cleanSlug(m[1]) : null;
	}
	if (store === 'lazada') {
		// /products/nama-produk-i123-s456.html
		const m = path.match(/^\/products\/(.+?)-i\d+(?:-s\d+)?\.html$/);
		return m ? cleanSlug(m[1]) : null;
	}
	if (store === 'tokopedia' && !u.hostname.startsWith('vt.')) {
		// /nama-toko/nama-produk
		const parts = path.split('/').filter(Boolean);
		if (parts.length === 2 && !['discovery', 'search', 'p', 'promo'].includes(parts[0])) return cleanSlug(parts[1]);
		return null;
	}
	return null;
}
