import type { Card } from './cards.ts';
import type { Product } from './products.ts';
import type { PublicCard, PublicProduct } from '../types.ts';

/** Data produk untuk halaman publik. URL affiliate tidak ikut dikirim; tombol lewat /go/. */
export function toPublic(p: Product): PublicProduct {
	return {
		number: p.number,
		name: p.name,
		price: p.price,
		image: p.image,
		categoryName: p.categoryName,
		categorySlug: p.categorySlug,
		links: p.links.map((l) => ({ store: l.store }))
	};
}

export function toPublicCard(c: Card): PublicCard {
	let href: string | null = null;
	if (c.categorySlug) href = `/kategori/${c.categorySlug}`;
	else if (c.url) href = `/k/${c.id}`;
	return { id: c.id, kind: c.kind, title: c.title, body: c.body, buttonLabel: c.buttonLabel, href, image: c.image };
}
