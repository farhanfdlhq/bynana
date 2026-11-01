import { getDb } from '$lib/server/db';
import { countByStatus, listAdmin, type AdminFilter } from '$lib/server/products';
import type { PageServerLoad } from './$types';

const FILTERS: AdminFilter[] = ['semua', 'draf', 'klik', 'arsip'];

export const load: PageServerLoad = ({ url }) => {
	const db = getDb();
	const f = url.searchParams.get('f') as AdminFilter;
	const filter = FILTERS.includes(f) ? f : 'semua';
	const q = (url.searchParams.get('q') ?? '').slice(0, 80);
	const pageNum = Math.max(1, Number(url.searchParams.get('hal')) || 1);
	const limit = 30;
	const { products, total } = listAdmin(db, { filter, q, limit, offset: (pageNum - 1) * limit });
	return {
		filter,
		q,
		page: pageNum,
		pages: Math.max(1, Math.ceil(total / limit)),
		total,
		counts: countByStatus(db),
		products: products.map((p) => ({
			id: p.id,
			number: p.number,
			name: p.name,
			image: p.image,
			status: p.status,
			stores: p.links.map((l) => l.store),
			clicks: p.clicks
		}))
	};
};
