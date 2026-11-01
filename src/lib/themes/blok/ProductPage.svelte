<script lang="ts">
	import Mark from '$lib/components/Mark.svelte';
	import { goHref, imageSrc, rupiah, storeName, type PublicProduct } from '$lib/format';
	import type { CategoryData, SiteData } from '$lib/types';
	import Footer from './Footer.svelte';
	import Search from './Search.svelte';

	let { site, categories, product: p }: { site: SiteData; categories: CategoryData[]; product: PublicProduct } = $props();
</script>

<header class="bar">
	<div class="wrap"><a class="home" href="/"><Mark size={34} dot="var(--accent)" />{site.name}</a></div>
</header>

<main class="wrap">
	<article class="product">
		<div class="pic" class:empty={!p.image}>
			{#if p.image}
				<img
					src={imageSrc(p.image, 800)}
					srcset="{imageSrc(p.image, 400)} 400w, {imageSrc(p.image, 800)} 800w"
					sizes="(min-width: 900px) 520px, 100vw"
					alt={p.name}
					width="800"
					height="800"
					fetchpriority="high"
				/>
			{/if}
			<span class="num"><span class="visually-hidden">Nomor </span>{p.number}</span>
		</div>
		<div class="info">
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
	<Search {categories} />
</main>

<Footer name={site.name} />

<style>
	.wrap {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 16px;
	}
	.bar {
		background: var(--primary);
	}
	.home {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		min-height: 60px;
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 30px;
		letter-spacing: -0.045em;
		text-decoration: none;
	}
	.product {
		display: grid;
		gap: 20px;
		padding-top: 16px;
	}
	.pic {
		position: relative;
		aspect-ratio: 1;
		border-radius: 28px;
		overflow: hidden;
		background: var(--primary-soft);
	}
	.pic img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.pic.empty {
		background: var(--accent-soft);
	}
	.num {
		position: absolute;
		left: 14px;
		bottom: 14px;
		background: var(--ink);
		color: var(--on-ink);
		font-weight: 800;
		font-size: 32px;
		line-height: 1;
		padding: 10px 16px;
		border-radius: 999px;
		font-variant-numeric: tabular-nums;
	}
	.info {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	h1 {
		margin: 0;
		font-family: var(--font-display);
		font-size: clamp(32px, 8vw, 52px);
		line-height: 1;
		letter-spacing: -0.035em;
		font-weight: 800;
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
		background: var(--field);
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
	@media (min-width: 720px) {
		.wrap {
			padding: 0 32px;
		}
		.product {
			grid-template-columns: minmax(0, 520px) minmax(0, 1fr);
			gap: 40px;
			align-items: start;
			padding-top: 32px;
		}
	}
</style>
