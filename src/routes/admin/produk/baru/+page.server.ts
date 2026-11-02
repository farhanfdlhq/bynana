import { fail, redirect } from '@sveltejs/kit';
import { listCategories } from '$lib/server/categories';
import { getDb } from '$lib/server/db';
import { productFormValues, productInputFrom, readAutoPhoto, readPhoto } from '$lib/server/forms';
import { ImageError, removeImage } from '$lib/server/images';
import { enrichLink } from '$lib/server/enrich';
import { createDraftsFromBulk, createProduct, findProductByUrl, nextNumber, NumberTakenError, ProductInputError, type ProductStatus } from '$lib/server/products';
import { parseBulkLines } from '$lib/server/stores';
import type { Actions, PageServerLoad } from './$types';

const MAX_BULK = 50;

export const load: PageServerLoad = ({ url }) => {
	const db = getDb();
	return {
		cara: url.searchParams.get('cara') === 'banyak' ? 'banyak' : 'satu',
		saved: Number(url.searchParams.get('tersimpan')) || null,
		nextNumber: nextNumber(db),
		categories: listCategories(db).map((c) => ({ id: c.id, name: c.name }))
	};
};

async function saveOne(request: Request, status: ProductStatus) {
	const form = await request.formData();
	const values = productFormValues(form);
	let image: string | null = null;
	let uploaded = false;
	try {
		image = await readPhoto(form);
		uploaded = !!image;
		image ??= readAutoPhoto(form);
		const p = createProduct(getDb(), productInputFrom(values, status, image));
		return { ok: true as const, product: p };
	} catch (err) {
		// Foto otomatis dibiarkan supaya tetap terpakai saat form dikirim ulang.
		if (uploaded) removeImage(image);
		if (err instanceof NumberTakenError) return { ok: false as const, res: fail(400, { values, message: `${err.message}. Pakai nomor lain, atau kosongkan supaya dapat nomor otomatis.`, field: 'number' }) };
		if (err instanceof ImageError) return { ok: false as const, res: fail(400, { values, message: err.message, field: 'foto' }) };
		if (err instanceof ProductInputError) {
			const field = /nama/i.test(err.message) ? 'name' : /link/i.test(err.message) ? 'links' : /nomor/i.test(err.message) ? 'number' : /harga/i.test(err.message) ? 'price' : null;
			return { ok: false as const, res: fail(400, { values, message: err.message, field }) };
		}
		throw err;
	}
}

/** Menjalankan pekerjaan dengan batas jumlah yang berjalan bersamaan. */
async function pool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
	const out: R[] = new Array(items.length);
	let next = 0;
	await Promise.all(
		Array.from({ length: Math.min(size, items.length) }, async () => {
			while (next < items.length) {
				const i = next++;
				out[i] = await fn(items[i]);
			}
		})
	);
	return out;
}

export const actions: Actions = {
	simpan: async ({ request }) => {
		const r = await saveOne(request, 'published');
		if (!r.ok) return r.res;
		throw redirect(303, `/admin/produk/${r.product.id}?tersimpan=1`);
	},
	lagi: async ({ request }) => {
		const r = await saveOne(request, 'published');
		if (!r.ok) return r.res;
		throw redirect(303, `/admin/produk/baru?tersimpan=${r.product.number}`);
	},
	draf: async ({ request }) => {
		const r = await saveOne(request, 'draft');
		if (!r.ok) return r.res;
		throw redirect(303, `/admin/produk/${r.product.id}?tersimpan=1`);
	},
	banyak: async ({ request }) => {
		const form = await request.formData();
		const text = String(form.get('daftar') ?? '').slice(0, 60000);
		const { rows, invalid } = parseBulkLines(text);
		if (!rows.length) return fail(400, { bulkText: text, message: 'Belum ada link yang terbaca. Tempel satu link per baris.' });
		if (rows.length > MAX_BULK) return fail(400, { bulkText: text, message: `Maksimal ${MAX_BULK} link sekali tempel. Sekarang ada ${rows.length}.` });
		const unique = rows.filter((r) => !r.duplicate);
		// Link yang sudah tersimpan tidak perlu dibaca lagi (dan fotonya tidak perlu diunduh).
		const db = getDb();
		const enriched = await pool(unique, 3, async (r) => (findProductByUrl(db, r.url) ? null : enrichLink(r.url)));
		const outcomes = createDraftsFromBulk(
			db,
			unique.map((r, i) => ({
				line: r.line,
				number: r.number,
				url: r.url,
				store: r.store,
				name: enriched[i]?.name ?? null,
				price: enriched[i]?.price ?? null,
				image: enriched[i]?.image ?? null
			}))
		);
		// Foto yang sudah diunduh untuk baris yang gagal dibuang lagi.
		outcomes.forEach((o, i) => {
			if (!o.ok) removeImage(enriched[i]?.image ?? null);
		});
		return {
			bulk: {
				outcomes,
				invalid,
				duplicates: rows.filter((r) => r.duplicate).map((r) => r.line)
			}
		};
	}
};
