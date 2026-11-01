<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import BlokListing from '$lib/themes/blok/Listing.svelte';
	import PastelListing from '$lib/themes/pastel/Listing.svelte';
	let { data } = $props();
	const moreHref = $derived(data.nextCursor ? `/kategori/${data.category.slug}?setelah=${data.nextCursor}` : null);
	const emptyText = 'Belum ada produk di kategori ini.';
</script>

<Seo
	title={`${data.category.name} · ${data.site.name}`}
	description={`Produk ${data.category.name} yang ${data.site.name} rekomendasikan, lengkap dengan nomor dari video dan link ke tokonya.`}
	origin={data.origin}
	path={`/kategori/${data.category.slug}`}
/>

{#if data.theme === 'pastel'}
	<PastelListing site={data.site} categories={data.categories} title={data.category.name} products={data.products} activeCategory={data.category.slug} {moreHref} {emptyText} />
{:else}
	<BlokListing site={data.site} categories={data.categories} title={data.category.name} products={data.products} activeCategory={data.category.slug} {moreHref} {emptyText} />
{/if}
