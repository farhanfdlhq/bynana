import { error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { productOgImage } from '$lib/server/og';
import { getByNumber } from '$lib/server/products';
import { getSettings } from '$lib/server/settings';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const db = getDb();
	const p = getByNumber(db, Number(params.number));
	if (!p) throw error(404, { message: 'Gambar tidak ditemukan' });
	const s = getSettings(db);
	const png = await productOgImage(p, s.theme, s.name);
	return new Response(new Uint8Array(png), {
		headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' }
	});
};
