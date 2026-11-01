import { listCategories } from '$lib/server/categories';
import { getDb } from '$lib/server/db';
import type { RequestHandler } from './$types';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: RequestHandler = ({ url }) => {
	const db = getDb();
	const products = db
		.prepare("SELECT number, COALESCE(updated_at, published_at) AS mod FROM products WHERE status = 'published' ORDER BY number DESC LIMIT 45000")
		.all() as { number: number; mod: string }[];
	const latest = products.reduce((m, p) => (p.mod > m ? p.mod : m), '');
	const entries = [
		`<url><loc>${esc(url.origin)}/</loc>${latest ? `<lastmod>${latest.slice(0, 10)}</lastmod>` : ''}</url>`,
		...listCategories(db).map((c) => `<url><loc>${esc(`${url.origin}/kategori/${c.slug}`)}</loc></url>`),
		...products.map((p) => `<url><loc>${esc(`${url.origin}/${p.number}`)}</loc><lastmod>${p.mod.slice(0, 10)}</lastmod></url>`)
	];
	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
	return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=600' } });
};
