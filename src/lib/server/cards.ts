import type { DB } from './db.ts';
import { normalizeAffiliateUrl } from './stores.ts';

export const CARD_KINDS = ['promo', 'link', 'video', 'teks'] as const;
export type CardKind = (typeof CARD_KINDS)[number];

export const CARD_KIND_LABEL: Record<CardKind, string> = {
	promo: 'Promo',
	link: 'Link',
	video: 'Video',
	teks: 'Teks'
};

export interface Card {
	id: number;
	kind: CardKind;
	title: string;
	body: string;
	buttonLabel: string;
	url: string;
	categoryId: number | null;
	categorySlug: string | null;
	image: string | null;
	sort: number;
	visible: boolean;
	startsAt: string | null;
	endsAt: string | null;
}

export interface CardInput {
	kind: CardKind;
	title: string;
	body?: string;
	buttonLabel?: string;
	url?: string;
	categoryId?: number | null;
	image?: string | null;
	visible?: boolean;
	startsAt?: string | null;
	endsAt?: string | null;
}

export class CardInputError extends Error {}

const SELECT = `SELECT k.id, k.kind, k.title, k.body, k.button_label, k.url, k.category_id, c.slug AS category_slug, k.image, k.sort, k.visible,
  k.starts_at, k.ends_at FROM cards k LEFT JOIN categories c ON c.id = k.category_id`;

type Row = {
	id: number;
	kind: CardKind;
	title: string;
	body: string;
	button_label: string;
	url: string;
	category_id: number | null;
	category_slug: string | null;
	image: string | null;
	sort: number;
	visible: number;
	starts_at: string | null;
	ends_at: string | null;
};

const map = (r: Row): Card => ({
	id: r.id,
	kind: r.kind,
	title: r.title,
	body: r.body,
	buttonLabel: r.button_label,
	url: r.url,
	categoryId: r.category_id,
	categorySlug: r.category_slug,
	image: r.image,
	sort: r.sort,
	visible: !!r.visible,
	startsAt: r.starts_at,
	endsAt: r.ends_at
});

export function listCards(db: DB): Card[] {
	return (db.prepare(`${SELECT} ORDER BY k.sort, k.id`).all() as Row[]).map(map);
}

/** Kartu yang tampil sekarang: terlihat dan dalam rentang tanggal (YYYY-MM-DD, WIB). */
export function activeCards(db: DB, today: string): Card[] {
	return listCards(db).filter((c) => c.visible && (!c.startsAt || c.startsAt <= today) && (!c.endsAt || c.endsAt >= today));
}

export function getCard(db: DB, id: number): Card | undefined {
	const r = db.prepare(`${SELECT} WHERE k.id = ?`).get(id) as Row | undefined;
	return r ? map(r) : undefined;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function clean(input: CardInput): Required<Omit<CardInput, 'image'>> & { image: string | null } {
	if (!CARD_KINDS.includes(input.kind)) throw new CardInputError('Jenis kartu tidak dikenal');
	const title = input.title.replace(/\s+/g, ' ').trim().slice(0, 80);
	if (!title) throw new CardInputError('Judul kartu wajib diisi');
	let url = '';
	if (input.url && input.url.trim()) {
		const u = normalizeAffiliateUrl(input.url);
		if (!u) throw new CardInputError('Link kartu harus diawali https://');
		url = u;
	}
	if ((input.kind === 'link' || input.kind === 'video') && !url) throw new CardInputError('Kartu ini butuh link');
	const startsAt = input.startsAt && DATE.test(input.startsAt) ? input.startsAt : null;
	const endsAt = input.endsAt && DATE.test(input.endsAt) ? input.endsAt : null;
	if (startsAt && endsAt && endsAt < startsAt) throw new CardInputError('Tanggal selesai harus setelah tanggal mulai');
	return {
		kind: input.kind,
		title,
		body: (input.body ?? '').trim().slice(0, 280),
		buttonLabel: (input.buttonLabel ?? '').replace(/\s+/g, ' ').trim().slice(0, 40),
		url,
		categoryId: input.categoryId ?? null,
		image: input.image ?? null,
		visible: input.visible ?? true,
		startsAt,
		endsAt
	};
}

export function createCard(db: DB, input: CardInput): Card {
	const c = clean(input);
	const sort = (db.prepare('SELECT COALESCE(MAX(sort), 0) + 1 AS s FROM cards').get() as { s: number }).s;
	const info = db
		.prepare(
			`INSERT INTO cards (kind, title, body, button_label, url, category_id, image, sort, visible, starts_at, ends_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.run(c.kind, c.title, c.body, c.buttonLabel, c.url, c.categoryId, c.image, sort, c.visible ? 1 : 0, c.startsAt, c.endsAt);
	return getCard(db, Number(info.lastInsertRowid))!;
}

export function updateCard(db: DB, id: number, input: CardInput): Card {
	const current = getCard(db, id);
	if (!current) throw new CardInputError('Kartu tidak ditemukan');
	const c = clean({ ...input, image: input.image === undefined ? current.image : input.image });
	db.prepare(
		`UPDATE cards SET kind = ?, title = ?, body = ?, button_label = ?, url = ?, category_id = ?, image = ?, visible = ?, starts_at = ?, ends_at = ?
     WHERE id = ?`
	).run(c.kind, c.title, c.body, c.buttonLabel, c.url, c.categoryId, c.image, c.visible ? 1 : 0, c.startsAt, c.endsAt, id);
	return getCard(db, id)!;
}

export function deleteCard(db: DB, id: number): string | null {
	const c = getCard(db, id);
	db.prepare('DELETE FROM cards WHERE id = ?').run(id);
	return c?.image ?? null;
}

function move(db: DB, table: 'cards' | 'social_accounts', id: number, direction: -1 | 1): void {
	const ids = (db.prepare(`SELECT id FROM ${table} ORDER BY sort, id`).all() as { id: number }[]).map((r) => r.id);
	const i = ids.indexOf(id);
	const j = i + direction;
	if (i < 0 || j < 0 || j >= ids.length) return;
	[ids[i], ids[j]] = [ids[j], ids[i]];
	const update = db.prepare(`UPDATE ${table} SET sort = ? WHERE id = ?`);
	db.transaction(() => ids.forEach((x, index) => update.run(index + 1, x)))();
}

export const moveCard = (db: DB, id: number, direction: -1 | 1) => move(db, 'cards', id, direction);

/* Akun sosmed */

export const PLATFORMS = ['tiktok', 'instagram', 'shopee', 'threads', 'facebook', 'youtube', 'whatsapp', 'lainnya'] as const;
export type Platform = (typeof PLATFORMS)[number];
export const PLATFORM_LABEL: Record<Platform, string> = {
	tiktok: 'TikTok',
	instagram: 'Instagram',
	shopee: 'Shopee',
	threads: 'Threads',
	facebook: 'Facebook',
	youtube: 'YouTube',
	whatsapp: 'WhatsApp',
	lainnya: 'Lainnya'
};

export interface SocialAccount {
	id: number;
	platform: Platform;
	label: string;
	url: string;
	sort: number;
	visible: boolean;
}

export function listAccounts(db: DB, onlyVisible = false): SocialAccount[] {
	const rows = db
		.prepare(`SELECT id, platform, label, url, sort, visible FROM social_accounts ${onlyVisible ? 'WHERE visible = 1' : ''} ORDER BY sort, id`)
		.all() as (Omit<SocialAccount, 'visible'> & { visible: number })[];
	return rows.map((r) => ({ ...r, visible: !!r.visible }));
}

export function getAccount(db: DB, id: number): SocialAccount | undefined {
	return listAccounts(db).find((a) => a.id === id);
}

export function saveAccount(db: DB, input: { id?: number; platform: string; label: string; url: string; visible?: boolean }): void {
	if (!(PLATFORMS as readonly string[]).includes(input.platform)) throw new CardInputError('Platform tidak dikenal');
	const url = normalizeAffiliateUrl(input.url);
	if (!url) throw new CardInputError('Link akun harus diawali https://');
	const label = input.label.replace(/\s+/g, ' ').trim().slice(0, 40) || PLATFORM_LABEL[input.platform as Platform];
	const visible = input.visible === false ? 0 : 1;
	if (input.id) {
		db.prepare('UPDATE social_accounts SET platform = ?, label = ?, url = ?, visible = ? WHERE id = ?').run(input.platform, label, url, visible, input.id);
	} else {
		const sort = (db.prepare('SELECT COALESCE(MAX(sort), 0) + 1 AS s FROM social_accounts').get() as { s: number }).s;
		db.prepare('INSERT INTO social_accounts (platform, label, url, sort, visible) VALUES (?, ?, ?, ?, ?)').run(input.platform, label, url, sort, visible);
	}
}

export function deleteAccount(db: DB, id: number): void {
	db.prepare('DELETE FROM social_accounts WHERE id = ?').run(id);
}

export const moveAccount = (db: DB, id: number, direction: -1 | 1) => move(db, 'social_accounts', id, direction);
