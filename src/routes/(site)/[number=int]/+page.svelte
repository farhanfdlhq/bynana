<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { rupiah, storeName } from '$lib/format';
	import BlokProduct from '$lib/themes/blok/ProductPage.svelte';
	import PastelProduct from '$lib/themes/pastel/ProductPage.svelte';
	let { data } = $props();
	const p = $derived(data.product);

	const stores = $derived(p.links.map((l) => storeName(l.store)).join(', '));
	const description = $derived(
		`Produk nomor ${p.number} dari ${data.site.name}: ${p.name}${p.price != null ? `, sekitar ${rupiah(p.price)}` : ''}. Beli di ${stores || 'toko'}.`
	);
	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: p.name,
		sku: String(p.number),
		url: `${data.origin}/${p.number}`,
		...(p.image ? { image: `${data.origin}/uploads/${p.image}.webp` } : {}),
		...(p.categoryName ? { category: p.categoryName } : {})
	});
</script>

<Seo
	title={`${p.number} · ${p.name} · ${data.site.name}`}
	{description}
	origin={data.origin}
	path={`/${p.number}`}
	type="product"
	image={`/og/${p.number}.png`}
	imageAlt={p.name}
	{jsonLd}
/>

{#if data.theme === 'pastel'}
	<PastelProduct site={data.site} categories={data.categories} product={p} />
{:else}
	<BlokProduct site={data.site} categories={data.categories} product={p} />
{/if}
