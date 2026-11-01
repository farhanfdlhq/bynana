import { redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { search } from '$lib/server/products';
import { toPublic } from '$lib/server/public';
import { parseQuery } from '$lib/server/query';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const parsed = parseQuery(url.searchParams.get('q'));
	if (!parsed) throw redirect(303, '/');
	if ('number' in parsed) throw redirect(303, `/${parsed.number}`);
	return { q: parsed.text, products: search(getDb(), parsed.text).map(toPublic) };
};
