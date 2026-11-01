import { redirect } from '@sveltejs/kit';
import { getAccount } from '$lib/server/cards';
import { recordClick } from '$lib/server/clicks';
import { getDb } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, request, setHeaders }) => {
	const db = getDb();
	const account = getAccount(db, Number(params.id));
	if (!account || !account.visible) throw redirect(303, '/');
	recordClick(db, 'account', account.id, request.headers.get('user-agent'));
	setHeaders({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' });
	throw redirect(302, account.url);
};
