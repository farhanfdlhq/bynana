import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { enrichLink } from '$lib/server/enrich';
import { findProductByUrl } from '$lib/server/products';
import { detectStore, normalizeAffiliateUrl } from '$lib/server/stores';
import type { RequestHandler } from './$types';

/**
 * Dipakai form tambah produk: membaca nama dari link, dan (kalau Shopee Open API aktif) foto dan harga.
 * Hanya untuk admin (dijaga hooks).
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ message: 'Perlu masuk' }, { status: 401 });
	const body = (await request.json().catch(() => null)) as { url?: unknown } | null;
	const url = typeof body?.url === 'string' ? normalizeAffiliateUrl(body.url.slice(0, 2000)) : null;
	if (!url) return json({ name: null, message: 'Link tidak valid' }, { status: 400 });
	const existing = findProductByUrl(getDb(), url);
	if (existing) return json({ name: null, store: detectStore(url), message: `Link ini sudah ada di produk nomor ${existing.number}` });
	const r = await enrichLink(url);
	return json({
		store: r.store,
		name: r.name,
		price: r.price,
		image: r.image,
		fromApi: r.fromApi,
		message: r.message ?? (r.name ? undefined : 'Nama tidak terbaca dari link ini. Isi sendiri.')
	});
};
