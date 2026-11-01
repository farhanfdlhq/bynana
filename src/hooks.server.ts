import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit';
import { getSessionUser, SESSION_COOKIE } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { getSettings, isTheme } from '$lib/server/settings';

const PUBLIC_ADMIN = new Set(['/admin/masuk']);

export const handle: Handle = async ({ event, resolve }) => {
	const db = getDb();
	const path = event.url.pathname;
	const isAdminArea = path === '/admin' || path.startsWith('/admin/');

	// Sesi hanya dibaca di area admin dan saat pratinjau tema, supaya halaman publik tetap ringan.
	const preview = event.url.searchParams.get('pratinjau');
	const needsUser = isAdminArea || preview !== null;
	event.locals.user = needsUser ? getSessionUser(db, event.cookies.get(SESSION_COOKIE)) : null;

	const settings = getSettings(db);
	event.locals.theme = event.locals.user && isTheme(preview) ? preview : settings.theme;

	if (isAdminArea && !event.locals.user && !PUBLIC_ADMIN.has(path)) {
		const next = path + event.url.search;
		throw redirect(303, `/admin/masuk?lanjut=${encodeURIComponent(next)}`);
	}

	const theme = event.locals.theme;
	const response = await resolve(event, {
		preload: ({ type }) => type === 'font' || type === 'css' || type === 'js',
		transformPageChunk: ({ html }) => html.replace('%bynana.theme%', theme)
	});

	const h = response.headers;
	h.set('X-Content-Type-Options', 'nosniff');
	h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	h.set('X-Frame-Options', 'DENY');
	h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
	h.set('Cross-Origin-Opener-Policy', 'same-origin');
	if (event.url.protocol === 'https:') h.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

	const type = h.get('content-type') ?? '';
	if (isAdminArea || event.locals.user) {
		h.set('Cache-Control', 'no-store');
		h.set('X-Robots-Tag', 'noindex, nofollow');
	} else if (type.startsWith('text/html') && !h.has('Cache-Control')) {
		// Selalu cek ulang supaya ganti tema dan produk baru langsung terlihat.
		h.set('Cache-Control', 'public, max-age=0, must-revalidate');
	}
	return response;
};

export const handleError: HandleServerError = ({ error, status }) => {
	if (status !== 404) console.error('[bynana]', error);
	return { message: status === 404 ? 'Halaman tidak ditemukan' : 'Ada yang salah di server. Coba lagi sebentar.' };
};
