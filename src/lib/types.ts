import type { PublicProduct } from './format';

export type { PublicProduct };

export interface PublicCard {
	id: number;
	kind: 'promo' | 'link' | 'video' | 'teks';
	title: string;
	body: string;
	buttonLabel: string;
	href: string | null;
	image: string | null;
}

export interface SiteData {
	name: string;
	bio: string;
	avatar: string | null;
	seoTitle: string;
	seoDescription: string;
	footerNote: string;
}

export interface AccountData {
	id: number;
	platform: string;
	label: string;
}

export interface CategoryData {
	name: string;
	slug: string;
}
