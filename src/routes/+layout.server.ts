import { listAccounts } from '$lib/server/cards';
import { listCategories } from '$lib/server/categories';
import { getDb } from '$lib/server/db';
import { getSettings } from '$lib/server/settings';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, url }) => {
	const db = getDb();
	const s = getSettings(db);
	return {
		theme: locals.theme,
		previewing: locals.theme !== s.theme ? locals.theme : null,
		origin: url.origin,
		site: {
			name: s.name,
			bio: s.bio,
			avatar: s.avatar,
			seoTitle: s.seoTitle,
			seoDescription: s.seoDescription,
			footerNote: s.footerNote
		},
		accounts: listAccounts(db, true).map((a) => ({ id: a.id, platform: a.platform, label: a.label })),
		categories: listCategories(db).map((c) => ({ name: c.name, slug: c.slug }))
	};
};
