import { redirect } from '@sveltejs/kit';
import { getCard } from '$lib/server/cards';
import { recordClick } from '$lib/server/clicks';
import { getDb } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, request, setHeaders }) => {
	const db = getDb();
	const card = getCard(db, Number(params.id));
	if (!card || !card.visible || !card.url) throw redirect(303, '/');
	recordClick(db, 'card', card.id, request.headers.get('user-agent'));
	setHeaders({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' });
	throw redirect(302, card.url);
};
