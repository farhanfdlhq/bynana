/**
 * Melengkapi data produk dari sebuah link: nama dari alamat produk, lalu (khusus Shopee, kalau Open API aktif)
 * nama, harga, dan foto dari Shopee Affiliate Open API.
 */
import { LinkReadError, resolveLink } from './linkreader.ts';
import { downloadImage, RemoteImageError } from './remote-image.ts';
import { fetchShopeeOffer, parseShopeeIds, shopeeConfig, ShopeeApiError, type ShopeeConfig } from './shopee-api.ts';
import { detectStore, nameFromUrl, type Store } from './stores.ts';

export interface Enriched {
	store: Store;
	name: string | null;
	price: number | null;
	/** Nama file foto yang sudah tersimpan, atau null. */
	image: string | null;
	fromApi: boolean;
	message: string | null;
}

export interface EnrichDeps {
	resolve?: typeof resolveLink;
	offer?: typeof fetchShopeeOffer;
	download?: typeof downloadImage;
	config?: () => ShopeeConfig | null;
}

export async function enrichLink(url: string, deps: EnrichDeps = {}): Promise<Enriched> {
	const resolve = deps.resolve ?? resolveLink;
	const offer = deps.offer ?? fetchShopeeOffer;
	const download = deps.download ?? downloadImage;
	const store = detectStore(url);
	const out: Enriched = { store, name: nameFromUrl(url), price: null, image: null, fromApi: false, message: null };

	let config: ShopeeConfig | null = null;
	if (store === 'shopee') {
		try {
			config = (deps.config ?? shopeeConfig)();
		} catch (err) {
			out.message = err instanceof Error ? err.message : 'Pengaturan Shopee Open API salah';
		}
	}

	let finalUrl = url;
	if (!out.name || config) {
		try {
			const r = await resolve(url);
			finalUrl = r.finalUrl;
			out.name ??= r.name;
		} catch (err) {
			if (!config) out.message = err instanceof LinkReadError ? err.message : 'Link tidak bisa dibuka';
		}
	}

	if (config) {
		const ids = parseShopeeIds(finalUrl) ?? parseShopeeIds(url);
		if (!ids) {
			out.message = 'ID produk Shopee tidak terbaca dari link ini, jadi foto tidak bisa diambil otomatis.';
		} else {
			try {
				const o = await offer(ids, { config });
				if (o) {
					out.fromApi = true;
					out.name = o.name ?? out.name;
					out.price = o.price;
					if (o.imageUrl) {
						try {
							out.image = await download(o.imageUrl);
						} catch (err) {
							out.message = err instanceof RemoteImageError ? `${err.message}. Pilih foto sendiri.` : 'Foto tidak bisa diunduh. Pilih foto sendiri.';
						}
					}
				} else {
					out.message = 'Produk ini tidak ditemukan di Shopee Open API. Isi foto dan nama sendiri.';
				}
			} catch (err) {
				out.message = err instanceof ShopeeApiError ? `${err.message}. Isi foto dan nama sendiri.` : 'Shopee Open API gagal dihubungi. Isi foto dan nama sendiri.';
			}
		}
	}
	return out;
}
