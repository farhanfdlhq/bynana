import { redirect } from '@sveltejs/kit';
import { recordClick } from '$lib/server/clicks';
import { getDb } from '$lib/server/db';
import { getLink } from '$lib/server/products';
import type { RequestHandler } from './$types';

/** Mencatat klik lalu meneruskan ke link affiliate yang tersimpan. Tidak pernah meneruskan ke alamat dari URL. */
export const GET: RequestHandler = ({ params, request, setHeaders }) => {
	const db = getDb();
	const link = getLink(db, Number(params.number), params.store);
	// Toko atau produk tidak ada: arahkan ke halaman nomornya, yang menjelaskan dengan ramah.
	if (!link) throw redirect(303, `/${params.number}`);
	recordClick(db, 'link', link.id, request.headers.get('user-agent'));
	setHeaders({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer' });
	throw redirect(302, link.url);
};
