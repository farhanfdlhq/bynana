import { fail } from '@sveltejs/kit';
import {
	CARD_KINDS,
	CardInputError,
	createCard,
	deleteAccount,
	deleteCard,
	getCard,
	listAccounts,
	listCards,
	moveAccount,
	moveCard,
	PLATFORMS,
	saveAccount,
	updateCard,
	type CardKind
} from '$lib/server/cards';
import { listCategories } from '$lib/server/categories';
import { getDb } from '$lib/server/db';
import { readPhoto, str } from '$lib/server/forms';
import { ImageError, removeImage } from '$lib/server/images';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const db = getDb();
	return {
		cards: listCards(db),
		accounts: listAccounts(db),
		categories: listCategories(db).map((c) => ({ id: c.id, name: c.name })),
		kinds: CARD_KINDS,
		platforms: PLATFORMS
	};
};

const id = (form: FormData) => Number(str(form, 'id', 12)) || 0;
const dir = (form: FormData): -1 | 1 => (str(form, 'arah', 4) === 'naik' ? -1 : 1);

export const actions: Actions = {
	simpanKartu: async ({ request }) => {
		const form = await request.formData();
		const db = getDb();
		const cardId = id(form);
		let image: string | null = null;
		try {
			image = await readPhoto(form, 'gambar');
			const current = cardId ? getCard(db, cardId) : undefined;
			const drop = form.get('hapus_gambar') === '1';
			const target = str(form, 'target', 10);
			const kind = str(form, 'kind', 10) as CardKind;
			const categoryId = target === 'kategori' ? Number(str(form, 'category', 12)) || null : null;
			if (target === 'kategori' && !categoryId) throw new CardInputError('Pilih kategori tujuan tombol, atau pilih Tanpa tombol.');
			const input = {
				kind,
				title: str(form, 'title', 120),
				body: str(form, 'body', 400),
				buttonLabel: target === 'none' ? '' : str(form, 'button_label', 60),
				url: target === 'link' ? str(form, 'url', 2000) : '',
				categoryId,
				visible: form.get('visible') === '1',
				startsAt: str(form, 'starts_at', 10) || null,
				endsAt: str(form, 'ends_at', 10) || null,
				image: image ?? (drop ? null : current?.image ?? null)
			};
			if (cardId) {
				updateCard(db, cardId, input);
				if (current?.image && current.image !== input.image) removeImage(current.image);
			} else createCard(db, input);
			return { ok: cardId ? 'Kartu disimpan.' : 'Kartu baru ditambahkan.' };
		} catch (err) {
			removeImage(image);
			if (err instanceof CardInputError || err instanceof ImageError) return fail(400, { cardId, cardError: err.message });
			throw err;
		}
	},
	hapusKartu: async ({ request }) => {
		const form = await request.formData();
		removeImage(deleteCard(getDb(), id(form)));
		return { ok: 'Kartu dihapus.' };
	},
	geserKartu: async ({ request }) => {
		const form = await request.formData();
		moveCard(getDb(), id(form), dir(form));
		return {};
	},
	simpanAkun: async ({ request }) => {
		const form = await request.formData();
		try {
			saveAccount(getDb(), {
				id: id(form) || undefined,
				platform: str(form, 'platform', 20),
				label: str(form, 'label', 60),
				url: str(form, 'url', 2000),
				visible: form.get('visible') === '1'
			});
			return { ok: 'Akun disimpan.' };
		} catch (err) {
			if (err instanceof CardInputError) return fail(400, { accountId: id(form), accountError: err.message });
			throw err;
		}
	},
	hapusAkun: async ({ request }) => {
		const form = await request.formData();
		deleteAccount(getDb(), id(form));
		return { ok: 'Akun dihapus.' };
	},
	geserAkun: async ({ request }) => {
		const form = await request.formData();
		moveAccount(getDb(), id(form), dir(form));
		return {};
	}
};
