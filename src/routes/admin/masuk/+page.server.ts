import { fail, redirect } from '@sveltejs/kit';
import { authenticate, BusyError, checkLoginAllowed, clearLoginFailures, createSession, loginKeys, recordLoginFailure, SESSION_COOKIE, SESSION_DAYS } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import type { Actions, PageServerLoad } from './$types';

/** Hanya alamat di dalam /admin yang boleh jadi tujuan setelah masuk. */
function safeNext(raw: string | null): string {
	if (raw && /^\/admin(?:\/[A-Za-z0-9\-_/]*)?(?:\?[A-Za-z0-9=&\-_.%]*)?$/.test(raw) && !raw.startsWith('//')) return raw;
	return '/admin/produk';
}

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) throw redirect(303, safeNext(url.searchParams.get('lanjut')));
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress, url }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').slice(0, 200);
		const password = String(form.get('password') ?? '').slice(0, 200);
		const db = getDb();
		const keys = loginKeys(getClientAddress(), email);
		if (!checkLoginAllowed(db, keys)) {
			return fail(429, { email, message: 'Terlalu banyak percobaan. Tunggu 15 menit, lalu coba lagi.' });
		}
		let user = null;
		try {
			user = email && password ? await authenticate(db, email, password) : null;
		} catch (err) {
			if (err instanceof BusyError) return fail(503, { email, message: err.message });
			throw err;
		}
		if (!user) {
			recordLoginFailure(db, keys);
			return fail(400, { email, message: 'Email atau password salah.' });
		}
		clearLoginFailures(db, keys);
		const token = createSession(db, user.id);
		cookies.set(SESSION_COOKIE, token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: url.protocol === 'https:',
			maxAge: SESSION_DAYS * 86400
		});
		throw redirect(303, safeNext(url.searchParams.get('lanjut')));
	}
};
