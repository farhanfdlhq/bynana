<script lang="ts">
	import Mark from '$lib/components/Mark.svelte';
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

<header class="bar"><a href="/"><Mark size={30} dot="var(--accent)" />{site.name}</a></header>

<main class="page">
	<h1>{title}</h1>
	<Search {categories} value={query} active={activeCategory} />
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
</main>

<Footer name={site.name} note={site.footerNote} />

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
		padding: 8px 16px 0;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	h1 {
		margin: 0;
		font-family: var(--font-display);
		font-size: clamp(26px, 7cqw, 44px);
		line-height: 1.05;
		font-weight: 700;
		letter-spacing: -0.02em;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px;
	}
	.more {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 56px;
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
</style>
