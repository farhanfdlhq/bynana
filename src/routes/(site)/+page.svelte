<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import BlokHome from '$lib/themes/blok/Home.svelte';
	import PastelHome from '$lib/themes/pastel/Home.svelte';
	let { data } = $props();

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'ProfilePage',
		name: data.site.seoTitle,
		url: data.origin + '/',
		mainEntity: {
			'@type': 'Person',
			name: data.site.name,
			description: data.site.bio,
			url: data.origin + '/',
			...(data.site.avatar ? { image: `${data.origin}/uploads/${data.site.avatar}.webp` } : {})
		}
	});
</script>

<Seo
	title={data.isFirstPage ? data.site.seoTitle : `Produk sebelumnya · ${data.site.name}`}
	description={data.site.seoDescription}
	origin={data.origin}
	path="/"
	type="profile"
	noindex={!data.isFirstPage}
	jsonLd={data.isFirstPage ? jsonLd : null}
/>

{#if data.theme === 'pastel'}
	<PastelHome site={data.site} accounts={data.accounts} categories={data.categories} cards={data.cards} products={data.products} nextCursor={data.nextCursor} isFirstPage={data.isFirstPage} />
{:else}
	<BlokHome site={data.site} accounts={data.accounts} categories={data.categories} cards={data.cards} products={data.products} nextCursor={data.nextCursor} isFirstPage={data.isFirstPage} />
{/if}
