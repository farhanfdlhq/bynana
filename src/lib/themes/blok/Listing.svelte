<script lang="ts">
	import type { CategoryData, PublicProduct, SiteData } from '$lib/types';
	import Footer from './Footer.svelte';
	import Search from './Search.svelte';
	import Tile from './Tile.svelte';

	interface Props {
		site: SiteData;
		categories: CategoryData[];
		title: string;
		products: PublicProduct[];
		query?: string;
		activeCategory?: string | null;
		moreHref?: string | null;
		emptyText: string;
	}
	let { site, categories, title, products, query = '', activeCategory = null, moreHref = null, emptyText }: Props = $props();
</script>

<header class="bar">
	<div class="wrap"><a class="home" href="/">{site.name}</a></div>
</header>

<main class="wrap">
	<Search {categories} value={query} active={activeCategory} />
	<section aria-labelledby="judul">
		<h1 id="judul">{title}</h1>
		{#if products.length}
			<div class="grid">
				{#each products as p (p.number)}
					<Tile {p} />
				{/each}
			</div>
			{#if moreHref}<a class="more" href={moreHref}>Muat produk sebelumnya</a>{/if}
		{:else}
			<p class="empty">{emptyText}</p>
		{/if}
	</section>
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
		min-height: 60px;
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 30px;
		letter-spacing: -0.045em;
		text-decoration: none;
	}
	h1 {
		margin: 16px 0;
		font-family: var(--font-display);
		font-size: clamp(30px, 7vw, 48px);
		line-height: 1;
		letter-spacing: -0.035em;
		font-weight: 800;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 20px 12px;
	}
	.more {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 56px;
		margin-top: 28px;
		border-radius: 999px;
		background: var(--ink);
		color: var(--on-ink);
		text-decoration: none;
		font-weight: 600;
	}
	.empty {
		margin: 0;
		padding: 28px 20px;
		border-radius: 24px;
		background: var(--field);
		font-size: 17px;
	}
	@media (min-width: 720px) {
		.wrap {
			padding: 0 32px;
		}
		.grid {
			grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
			gap: 28px 16px;
		}
		.more {
			max-width: 360px;
			margin-left: auto;
			margin-right: auto;
		}
	}
</style>
