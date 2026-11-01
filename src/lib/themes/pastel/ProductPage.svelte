<script lang="ts">
	import Mark from '$lib/components/Mark.svelte';
	import { goHref, imageSrc, rupiah, storeName, type PublicProduct } from '$lib/format';
	import type { CategoryData, SiteData } from '$lib/types';
	import Footer from './Footer.svelte';
	import Search from './Search.svelte';

	let { site, categories, product: p }: { site: SiteData; categories: CategoryData[]; product: PublicProduct } = $props();
</script>

<header class="bar"><a href="/"><Mark size={30} dot="var(--accent)" />{site.name}</a></header>

<main class="page">
	<article class="product">
		<div class="pic">
			{#if p.image}
				<img
					src={imageSrc(p.image, 800)}
					srcset="{imageSrc(p.image, 400)} 400w, {imageSrc(p.image, 800)} 800w"
					sizes="(min-width: 480px) 480px, 100vw"
					alt={p.name}
					width="800"
					height="800"
					fetchpriority="high"
				/>
			{/if}
		</div>
		<div class="info">
			<p class="num"><span class="visually-hidden">Nomor </span>{p.number}</p>
			<h1>{p.name}</h1>
			{#if p.price != null}<p class="price">{rupiah(p.price)}</p>{/if}
			<div class="buy">
				{#each p.links as l, i (l.store + i)}
					<a class:main={i === 0} href={goHref(p.number, l.store)} rel="nofollow sponsored">Beli di {storeName(l.store)}</a>
				{/each}
			</div>
			{#if p.price != null}<p class="hint">Harga bisa berubah. Cek harga terbaru di toko.</p>{/if}
			{#if p.categoryName && p.categorySlug}
				<a class="cat" href="/kategori/{p.categorySlug}">Produk {p.categoryName} lainnya</a>
			{/if}
		</div>
	</article>
	<section class="again" aria-label="Cari produk lain">
		<Search {categories} />
	</section>
</main>

<Footer name={site.name} />

<style>
	.bar {
		max-width: 1200px;
		margin: 0 auto;
		padding: 16px;
	}
	.bar a {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 26px;
		text-decoration: none;
	}
	.page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 16px;
	}
	.product {
		background: var(--tile);
		border-radius: 32px;
		padding: 10px 10px 22px;
		display: grid;
		gap: 18px;
	}
	.pic {
		aspect-ratio: 1;
		border-radius: 24px;
		overflow: hidden;
		background: var(--primary);
	}
	.pic img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.info {
		padding: 0 10px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.num {
		margin: 0;
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 34px;
		line-height: 1;
	}
	h1 {
		margin: 0;
		font-size: clamp(26px, 6.5cqw, 40px);
		line-height: 1.1;
		font-weight: 700;
		letter-spacing: -0.01em;
	}
	.price {
		margin: 0;
		font-size: 22px;
		font-weight: 600;
	}
	.buy {
		display: grid;
		gap: 10px;
		margin-top: 6px;
	}
	.buy a {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 58px;
		border-radius: 999px;
		background: var(--bg);
		text-decoration: none;
		font-weight: 600;
		font-size: 18px;
		transition: transform 0.15s ease;
	}
	.buy a.main {
		background: var(--ink);
		color: var(--on-ink);
	}
	.buy a:active {
		transform: scale(0.98);
	}
	.hint {
		margin: 0;
		font-size: 15px;
		color: var(--ink-soft);
	}
	.cat {
		align-self: flex-start;
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding: 0 18px;
		border-radius: 999px;
		background: var(--accent);
		text-decoration: none;
		font-weight: 600;
	}
	.again {
		margin-top: 32px;
	}
</style>
