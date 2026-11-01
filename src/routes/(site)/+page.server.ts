import { activeCards } from '$lib/server/cards';
import { todayWib } from '$lib/server/clicks';
import { getDb } from '$lib/server/db';
import { listPublished } from '$lib/server/products';
import { toPublic, toPublicCard } from '$lib/server/public';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	const db = getDb();
	const before = Number(url.searchParams.get('setelah')) || undefined;
	const page = listPublished(db, { before, limit: 24 });
	return {
		cards: before ? [] : activeCards(db, todayWib()).map(toPublicCard),
		products: page.products.map(toPublic),
		nextCursor: page.nextCursor,
		isFirstPage: !before
	};
};
