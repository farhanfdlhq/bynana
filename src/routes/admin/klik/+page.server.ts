import { clickStats, type Range } from '$lib/server/clicks';
import { getDb } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const r = url.searchParams.get('rentang');
	const range: Range = r === '30' ? 30 : r === 'semua' ? 'semua' : 7;
	return { range, stats: clickStats(getDb(), range) };
};
