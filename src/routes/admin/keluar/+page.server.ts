import { redirect } from '@sveltejs/kit';
import { destroySession, SESSION_COOKIE } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	throw redirect(303, '/admin/atur');
};

export const actions: Actions = {
	default: ({ cookies }) => {
		destroySession(getDb(), cookies.get(SESSION_COOKIE));
		cookies.delete(SESSION_COOKIE, { path: '/' });
		throw redirect(303, '/admin/masuk');
	}
};
