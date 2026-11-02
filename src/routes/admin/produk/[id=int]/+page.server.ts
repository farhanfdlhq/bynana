import { error, fail, redirect } from '@sveltejs/kit';
import { listCategories } from '$lib/server/categories';
import { getDb } from '$lib/server/db';
import { productFormValues, productInputFrom, readAutoPhoto, readPhoto } from '$lib/server/forms';
import { ImageError, removeImage } from '$lib/server/images';
import { deleteProduct, getProduct, nextNumber, NumberTakenError, ProductInputError, setStatus, updateProduct, type ProductStatus } from '$lib/server/products';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, url }) => {
	const db = getDb();
	const p = getProduct(db, Number(params.id));
	if (!p) throw error(404, { message: 'Produk tidak ditemukan' });
	const clicks = (
		db
			.prepare(
				`SELECT COALESCE(SUM(c.count), 0) AS n FROM click_daily c JOIN product_links l ON c.target_type = 'link' AND c.target_id = l.id WHERE l.product_id = ?`
			)
			.get(p.id) as { n: number }
	).n;
	return {
		saved: url.searchParams.get('tersimpan') === '1',
		product: {
			id: p.id,
			number: p.number,
			status: p.status,
			image: p.image,
			values: {
				number: String(p.number),
				name: p.name,
				price: p.price == null ? '' : String(p.price),
				categoryId: p.categoryId == null ? '' : String(p.categoryId),
				links: p.links.map((l) => ({ store: l.store, url: l.url }))
			}
		},
		clicks,
		nextNumber: nextNumber(db),
		categories: listCategories(db).map((c) => ({ id: c.id, name: c.name }))
	};
};

async function save(id: number, request: Request, status?: ProductStatus) {
	const db = getDb();
	const current = getProduct(db, id);
	if (!current) throw error(404, { message: 'Produk tidak ditemukan' });
	const form = await request.formData();
	const values = productFormValues(form);
	let newImage: string | null = null;
	try {
		newImage = await readPhoto(form);
		const auto = newImage ? null : readAutoPhoto(form);
		const drop = form.get('hapus_foto') === '1';
		const image = newImage ?? auto ?? (drop ? null : current.image);
		updateProduct(db, id, productInputFrom(values, status ?? current.status, image));
		if (image !== current.image) removeImage(current.image);
		return null;
	} catch (err) {
		removeImage(newImage);
		if (err instanceof NumberTakenError) return fail(400, { values, message: `${err.message}. Pakai nomor lain.`, field: 'number' });
		if (err instanceof ImageError) return fail(400, { values, message: err.message, field: 'foto' });
		if (err instanceof ProductInputError) {
			const field = /nama/i.test(err.message) ? 'name' : /link/i.test(err.message) ? 'links' : /nomor/i.test(err.message) ? 'number' : /harga/i.test(err.message) ? 'price' : null;
			return fail(400, { values, message: err.message, field });
		}
		throw err;
	}
}

export const actions: Actions = {
	simpan: async ({ params, request }) => {
		const r = await save(Number(params.id), request);
		if (r) return r;
		throw redirect(303, `/admin/produk/${params.id}?tersimpan=1`);
	},
	tayang: async ({ params, request }) => {
		const r = await save(Number(params.id), request, 'published');
		if (r) return r;
		throw redirect(303, `/admin/produk/${params.id}?tersimpan=1`);
	},
	draf: ({ params }) => {
		setStatus(getDb(), Number(params.id), 'draft');
		throw redirect(303, `/admin/produk/${params.id}?tersimpan=1`);
	},
	arsip: ({ params }) => {
		setStatus(getDb(), Number(params.id), 'archived');
		throw redirect(303, `/admin/produk/${params.id}?tersimpan=1`);
	},
	hapus: ({ params }) => {
		const image = deleteProduct(getDb(), Number(params.id));
		removeImage(image);
		throw redirect(303, '/admin/produk');
	}
};
