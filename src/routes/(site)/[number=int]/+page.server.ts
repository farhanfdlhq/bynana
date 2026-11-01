import { error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { getByNumber } from '$lib/server/products';
import { toPublic } from '$lib/server/public';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const number = Number(params.number);
	const p = getByNumber(getDb(), number);
	if (!p) throw error(404, { message: `Nomor ${number} belum ada atau sudah tidak tersedia`, number });
	return { product: toPublic(p) };
};
