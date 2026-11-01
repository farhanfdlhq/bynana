<script lang="ts">
	import { page } from '$app/state';
	import BlokListing from '$lib/themes/blok/Listing.svelte';
	import PastelListing from '$lib/themes/pastel/Listing.svelte';

	const data = $derived(page.data);
	const title = $derived(page.status === 404 ? page.error?.message || 'Halaman tidak ditemukan' : 'Ada yang salah');
	const emptyText = $derived(
		page.error?.number
			? 'Nomornya mungkin salah ketik, atau produknya sudah tidak tersedia. Cari pakai nama produknya di atas.'
			: page.status === 404
				? 'Alamat ini tidak ada. Cari produk pakai nomor atau namanya di atas.'
				: 'Coba muat ulang halaman ini sebentar lagi.'
	);
	const site = $derived(data.site ?? { name: 'bynana', bio: '', avatar: null, seoTitle: 'bynana', seoDescription: '', footerNote: '' });
</script>

<svelte:head>
	<title>{title} · bynana</title>
	<meta name="robots" content="noindex" />
</svelte:head>

{#if data.theme === 'pastel'}
	<PastelListing {site} categories={data.categories ?? []} {title} products={[]} {emptyText} />
{:else}
	<BlokListing {site} categories={data.categories ?? []} {title} products={[]} {emptyText} />
{/if}
