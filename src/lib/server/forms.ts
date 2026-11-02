import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { IMAGE_NAME, ImageError, MAX_IMAGE_BYTES, saveImage, uploadsDir } from './images.ts';
import type { ProductInput, ProductStatus } from './products.ts';
import { isStore } from './stores.ts';

export function str(form: FormData, key: string, max = 500): string {
	const v = form.get(key);
	return typeof v === 'string' ? v.slice(0, max) : '';
}

export function intOrNull(form: FormData, key: string): number | null {
	const raw = str(form, key, 20).replace(/[.\s]/g, '').replace(/^rp/i, '');
	if (!raw) return null;
	const n = Number(raw);
	return Number.isFinite(n) ? n : NaN;
}

/** Foto dari form. Null kalau tidak ada file. Melempar ImageError kalau file tidak bisa dipakai. */
export async function readPhoto(form: FormData, key = 'foto'): Promise<string | null> {
	const file = form.get(key);
	if (!(file instanceof File) || file.size === 0) return null;
	if (file.size > MAX_IMAGE_BYTES) throw new ImageError('Foto terlalu besar. Maksimal 15 MB');
	return saveImage(Buffer.from(await file.arrayBuffer()));
}

/** Foto yang sudah diambil otomatis dari toko dan tersimpan di server (nama file dari form). */
export function readAutoPhoto(form: FormData): string | null {
	const name = str(form, 'foto_auto', 40);
	if (!IMAGE_NAME.test(name) || !existsSync(join(uploadsDir(), `${name}.webp`))) return null;
	return name;
}

export interface ProductFormValues {
	number: string;
	name: string;
	price: string;
	categoryId: string;
	links: { store: string; url: string }[];
	fotoAuto: string;
}

export function productFormValues(form: FormData): ProductFormValues {
	const urls = form.getAll('link_url').map((v) => (typeof v === 'string' ? v.slice(0, 2000) : ''));
	const stores = form.getAll('link_store').map((v) => (typeof v === 'string' ? v : ''));
	return {
		number: str(form, 'number', 12),
		name: str(form, 'name', 200),
		price: str(form, 'price', 20),
		categoryId: str(form, 'category', 12),
		links: urls.map((url, i) => ({ url, store: stores[i] ?? '' })).filter((l) => l.url.trim()),
		fotoAuto: IMAGE_NAME.test(str(form, 'foto_auto', 40)) ? str(form, 'foto_auto', 40) : ''
	};
}

export function productInputFrom(values: ProductFormValues, status: ProductStatus, image?: string | null): ProductInput {
	const num = values.number.trim() ? Number(values.number.trim()) : null;
	const price = values.price.replace(/[.\s]/g, '').replace(/^rp/i, '');
	return {
		number: num,
		name: values.name,
		price: price ? Number(price) : null,
		categoryId: values.categoryId ? Number(values.categoryId) || null : null,
		status,
		image,
		links: values.links.map((l) => ({ url: l.url, store: isStore(l.store) ? l.store : undefined }))
	};
}
