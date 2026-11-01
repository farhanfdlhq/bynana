import type { DB } from './db.ts';

export type ClickTarget = 'link' | 'card' | 'account';

const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|skype|embedly|vkshare|pinterest|curl|wget|python|httpclient|go-http|headless|lighthouse|monitor|uptime/i;

export function isBot(ua: string | null | undefined): boolean {
	if (!ua || ua.length < 10) return true;
	return BOT_UA.test(ua);
}

/** Tanggal hari ini di WIB (UTC+7), format YYYY-MM-DD. */
export function todayWib(now = new Date()): string {
	return new Date(now.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

export function recordClick(db: DB, type: ClickTarget, id: number, ua: string | null, now = new Date()): boolean {
	if (isBot(ua)) return false;
	db.prepare(
		`INSERT INTO click_daily (target_type, target_id, day, count) VALUES (?, ?, ?, 1)
     ON CONFLICT(target_type, target_id, day) DO UPDATE SET count = count + 1`
	).run(type, id, todayWib(now));
	return true;
}

export type Range = 7 | 30 | 'semua';

function since(range: Range, now = new Date()): string {
	if (range === 'semua') return '0000-00-00';
	return todayWib(new Date(now.getTime() - (range - 1) * 86400 * 1000));
}

export interface ClickStats {
	total: number;
	products: { id: number; number: number; name: string; image: string | null; clicks: number; stores: { store: string; clicks: number }[] }[];
	cards: { id: number; title: string; clicks: number }[];
	accounts: { id: number; label: string; platform: string; clicks: number }[];
	days: { day: string; clicks: number }[];
}

export function clickStats(db: DB, range: Range, now = new Date()): ClickStats {
	const from = since(range, now);
	const perLink = db
		.prepare(
			`SELECT p.id, p.number, p.name, p.image, l.store, SUM(c.count) AS clicks
       FROM click_daily c JOIN product_links l ON c.target_type = 'link' AND c.target_id = l.id
       JOIN products p ON p.id = l.product_id
       WHERE c.day >= ? GROUP BY l.id ORDER BY clicks DESC`
		)
		.all(from) as { id: number; number: number; name: string; image: string | null; store: string; clicks: number }[];
	const byProduct = new Map<number, ClickStats['products'][number]>();
	for (const r of perLink) {
		const p = byProduct.get(r.id) ?? { id: r.id, number: r.number, name: r.name, image: r.image, clicks: 0, stores: [] };
		p.clicks += r.clicks;
		p.stores.push({ store: r.store, clicks: r.clicks });
		byProduct.set(r.id, p);
	}
	const products = [...byProduct.values()].sort((a, b) => b.clicks - a.clicks || b.number - a.number).slice(0, 50);
	const cards = db
		.prepare(
			`SELECT k.id, k.title, SUM(c.count) AS clicks FROM click_daily c JOIN cards k ON c.target_type = 'card' AND c.target_id = k.id
       WHERE c.day >= ? GROUP BY k.id ORDER BY clicks DESC`
		)
		.all(from) as ClickStats['cards'];
	const accounts = db
		.prepare(
			`SELECT a.id, a.label, a.platform, SUM(c.count) AS clicks FROM click_daily c JOIN social_accounts a ON c.target_type = 'account' AND c.target_id = a.id
       WHERE c.day >= ? GROUP BY a.id ORDER BY clicks DESC`
		)
		.all(from) as ClickStats['accounts'];
	const days = db
		.prepare('SELECT day, SUM(count) AS clicks FROM click_daily WHERE day >= ? GROUP BY day ORDER BY day DESC LIMIT 30')
		.all(from) as ClickStats['days'];
	const total = (db.prepare('SELECT COALESCE(SUM(count), 0) AS n FROM click_daily WHERE day >= ?').get(from) as { n: number }).n;
	return { total, products, cards, accounts, days };
}
