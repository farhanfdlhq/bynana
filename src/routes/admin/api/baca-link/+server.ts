import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { LinkReadError, resolveLink } from '$lib/server/linkreader';
import { findProductByUrl } from '$lib/server/products';
import { detectStore, nameFromUrl, normalizeAffiliateUrl } from '$lib/server/stores';
import type { RequestHandler } from './$types';

/** Dipakai form tambah produk untuk mengisi nama dari link. Hanya untuk admin (dijaga hooks). */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ message: 'Perlu masuk' }, { status: 401 });
	const body = (await request.json().catch(() => null)) as { url?: unknown } | null;
	const url = typeof body?.url === 'string' ? normalizeAffiliateUrl(body.url.slice(0, 2000)) : null;
	if (!url) return json({ name: null, message: 'Link tidak valid' }, { status: 400 });
	const existing = findProductByUrl(getDb(), url);
	if (existing) return json({ name: null, store: detectStore(url), message: `Link ini sudah ada di produk nomor ${existing.number}` });
	const direct = nameFromUrl(url);
	if (direct) return json({ name: direct, store: detectStore(url) });
	try {
		const r = await resolveLink(url);
		return json({ name: r.name, store: detectStore(url), message: r.name ? undefined : 'Nama tidak terbaca dari link ini. Isi sendiri.' });
	} catch (err) {
		const message = err instanceof LinkReadError ? `${err.message}. Isi nama sendiri.` : 'Nama tidak terbaca dari link ini. Isi sendiri.';
		return json({ name: null, store: detectStore(url), message });
	}
};
