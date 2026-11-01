/** Fungsi kecil yang dipakai di server dan di halaman. */

export const STORE_NAMES: Record<string, string> = {
	shopee: 'Shopee',
	tiktok: 'TikTok',
	tokopedia: 'Tokopedia',
	lazada: 'Lazada',
	lainnya: 'Toko lain'
};

export function storeName(store: string): string {
	return STORE_NAMES[store] ?? 'Toko';
}

export function rupiah(n: number | null | undefined): string {
	if (n == null) return '';
	return 'Rp' + n.toLocaleString('id-ID');
}

export function goHref(number: number, store: string): string {
	return `/go/${number}/${store}`;
}

export function imageSrc(name: string | null, size: 400 | 800 = 800): string | null {
	if (!name) return null;
	return size === 400 ? `/uploads/${name}-400.webp` : `/uploads/${name}.webp`;
}

export interface PublicLink {
	store: string;
}

export interface PublicProduct {
	number: number;
	name: string;
	price: number | null;
	image: string | null;
	categoryName: string | null;
	categorySlug: string | null;
	links: PublicLink[];
}

/** Tujuan tombol beli utama: langsung ke toko kalau hanya satu, ke halaman produk kalau lebih. */
export function buyHref(p: PublicProduct): string {
	if (p.links.length === 1) return goHref(p.number, p.links[0].store);
	return `/${p.number}`;
}

export const PLATFORM_NAMES: Record<string, string> = {
	tiktok: 'TikTok',
	instagram: 'Instagram',
	shopee: 'Shopee',
	threads: 'Threads',
	facebook: 'Facebook',
	youtube: 'YouTube',
	whatsapp: 'WhatsApp',
	lainnya: ''
};

/** "TikTok @bynana" dari platform dan label. Label yang sudah memuat nama platform dipakai apa adanya. */
export function accountText(platform: string, label: string): string {
	const p = PLATFORM_NAMES[platform] ?? '';
	if (!p || label.toLowerCase().includes(p.toLowerCase())) return label;
	return `${p} ${label}`;
}

/** Tebakan toko dari alamat, untuk tampilan di form. Penentuan akhir tetap di server. */
export function guessStore(url: string): string | null {
	const m = url.match(/^https?:\/\/([^/?#]+)/i);
	if (!m) return null;
	const h = m[1].toLowerCase();
	const is = (base: string) => h === base || h.endsWith('.' + base);
	if (is('vt.tokopedia.com') || is('tiktok.com')) return 'tiktok';
	if (is('shopee.co.id') || is('shp.ee') || is('shope.ee')) return 'shopee';
	if (is('tokopedia.com') || is('tokopedia.link') || is('tkp.me')) return 'tokopedia';
	if (is('lazada.co.id') || is('lzd.co')) return 'lazada';
	return 'lainnya';
}
