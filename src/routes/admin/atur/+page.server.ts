import { fail } from '@sveltejs/kit';
import { authenticate, setAdminPassword } from '$lib/server/auth';
import { createCategory, deleteCategory, listCategories, moveCategory, renameCategory } from '$lib/server/categories';
import { getDb } from '$lib/server/db';
import { readPhoto, str } from '$lib/server/forms';
import { ImageError, removeImage } from '$lib/server/images';
import { getSettings, isTheme, setSetting } from '$lib/server/settings';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	const db = getDb();
	return {
		settings: getSettings(db),
		categories: listCategories(db).map((c) => ({
			...c,
			count: (db.prepare("SELECT COUNT(*) AS n FROM products WHERE category_id = ? AND status = 'published'").get(c.id) as { n: number }).n
		})),
		email: locals.user?.email ?? ''
	};
};

export const actions: Actions = {
	tema: async ({ request }) => {
		const form = await request.formData();
		const theme = str(form, 'theme', 10);
		if (!isTheme(theme)) return fail(400, { section: 'tema', error: 'Pilih salah satu tema' });
		setSetting(getDb(), 'theme', theme);
		return { section: 'tema', ok: theme === 'pastel' ? 'Tema Kartu pastel dipakai sekarang.' : 'Tema Blok warna dipakai sekarang.' };
	},
	profil: async ({ request }) => {
		const form = await request.formData();
		const db = getDb();
		const name = str(form, 'name', 40).replace(/\s+/g, ' ').trim();
		const bio = str(form, 'bio', 200).replace(/\s+/g, ' ').trim();
		if (!name) return fail(400, { section: 'profil', error: 'Nama wajib diisi' });
		let avatar: string | null = null;
		try {
			avatar = await readPhoto(form, 'avatar');
		} catch (err) {
			if (err instanceof ImageError) return fail(400, { section: 'profil', error: err.message });
			throw err;
		}
		const current = getSettings(db).avatar;
		setSetting(db, 'name', name);
		setSetting(db, 'bio', bio);
		if (avatar || form.get('hapus_avatar') === '1') {
			setSetting(db, 'avatar', avatar);
			removeImage(current);
		}
		return { section: 'profil', ok: 'Profil disimpan.' };
	},
	seo: async ({ request }) => {
		const form = await request.formData();
		const db = getDb();
		setSetting(db, 'seoTitle', str(form, 'seo_title', 70).trim());
		setSetting(db, 'seoDescription', str(form, 'seo_description', 170).trim());
		return { section: 'seo', ok: 'Teks pencarian disimpan.' };
	},
	kategoriBaru: async ({ request }) => {
		const form = await request.formData();
		try {
			createCategory(getDb(), str(form, 'name', 60));
			return { section: 'kategori', ok: 'Kategori ditambahkan.' };
		} catch (err) {
			return fail(400, { section: 'kategori', error: err instanceof Error ? err.message : 'Gagal' });
		}
	},
	kategoriUbah: async ({ request }) => {
		const form = await request.formData();
		try {
			renameCategory(getDb(), Number(str(form, 'id', 12)), str(form, 'name', 60));
			return { section: 'kategori', ok: 'Kategori disimpan.' };
		} catch (err) {
			return fail(400, { section: 'kategori', error: err instanceof Error ? err.message : 'Gagal' });
		}
	},
	kategoriHapus: async ({ request }) => {
		const form = await request.formData();
		deleteCategory(getDb(), Number(str(form, 'id', 12)));
		return { section: 'kategori', ok: 'Kategori dihapus. Produknya tetap ada, tanpa kategori.' };
	},
	kategoriGeser: async ({ request }) => {
		const form = await request.formData();
		moveCategory(getDb(), Number(str(form, 'id', 12)), str(form, 'arah', 4) === 'naik' ? -1 : 1);
		return { section: 'kategori' };
	},
	password: async ({ request, locals }) => {
		const form = await request.formData();
		const db = getDb();
		if (!locals.user) return fail(401, { section: 'password', error: 'Perlu masuk lagi' });
		const ok = await authenticate(db, locals.user.email, str(form, 'current', 200));
		if (!ok) return fail(400, { section: 'password', error: 'Password sekarang salah' });
		const next = str(form, 'next', 200);
		if (next !== str(form, 'repeat', 200)) return fail(400, { section: 'password', error: 'Password baru tidak sama' });
		try {
			await setAdminPassword(db, locals.user.id, next);
		} catch (err) {
			return fail(400, { section: 'password', error: err instanceof Error ? err.message : 'Gagal' });
		}
		return { section: 'password', ok: 'Password diganti. Silakan masuk lagi dengan password baru.' };
	}
};
