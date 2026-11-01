<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import BlokListing from '$lib/themes/blok/Listing.svelte';
	import PastelListing from '$lib/themes/pastel/Listing.svelte';
	let { data } = $props();
	const title = $derived(data.products.length ? `${data.products.length} produk cocok dengan "${data.q}"` : `Belum ada yang cocok dengan "${data.q}"`);
	const emptyText = 'Coba kata lain, atau ketik nomornya saja. Nomor ada di video atau caption.';
</script>

<Seo title={`Cari "${data.q}" · ${data.site.name}`} description={data.site.seoDescription} origin={data.origin} path="/cari" noindex />

{#if data.theme === 'pastel'}
	<PastelListing site={data.site} categories={data.categories} {title} products={data.products} query={data.q} {emptyText} />
{:else}
	<BlokListing site={data.site} categories={data.categories} {title} products={data.products} query={data.q} {emptyText} />
{/if}
