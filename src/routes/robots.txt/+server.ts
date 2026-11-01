import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) =>
	new Response(
		['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /go/', 'Disallow: /k/', 'Disallow: /a/', 'Disallow: /cari', '', `Sitemap: ${url.origin}/sitemap.xml`, ''].join('\n'),
		{ headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } }
	);
