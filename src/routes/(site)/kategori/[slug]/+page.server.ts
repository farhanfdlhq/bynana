import { error } from '@sveltejs/kit';
import { getCategoryBySlug } from '$lib/server/categories';
import { getDb } from '$lib/server/db';
import { listPublished } from '$lib/server/products';
import { toPublic } from '$lib/server/public';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, url }) => {
	const db = getDb();
	const category = getCategoryBySlug(db, params.slug);
	if (!category) throw error(404, { message: 'Kategori ini tidak ada' });
	const before = Number(url.searchParams.get('setelah')) || undefined;
	const page = listPublished(db, { categoryId: category.id, before, limit: 24 });
	return { category: { name: category.name, slug: category.slug }, products: page.products.map(toPublic), nextCursor: page.nextCursor };
};
