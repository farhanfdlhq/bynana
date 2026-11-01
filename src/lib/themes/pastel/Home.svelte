<script lang="ts">
	import Mark from '$lib/components/Mark.svelte';
	import { accountText, imageSrc } from '$lib/format';
	import type { AccountData, CategoryData, PublicCard, PublicProduct, SiteData } from '$lib/types';
	import Footer from './Footer.svelte';
	import Search from './Search.svelte';
	import Tile from './Tile.svelte';

	interface Props {
		site: SiteData;
		accounts: AccountData[];
		categories: CategoryData[];
		cards: PublicCard[];
		products: PublicProduct[];
		nextCursor: number | null;
		isFirstPage: boolean;
	}
	let { site, accounts, categories, cards, products, nextCursor, isFirstPage }: Props = $props();
	const fills = ['var(--accent)', 'var(--apricot)', 'var(--primary-soft)'];
</script>

{#if isFirstPage}
	<section class="deck" aria-label="Kartu {site.name}">
		<div class="track">
			<article class="card profile rise">
				{#if site.avatar}
					<img class="avatar" src={imageSrc(site.avatar, 400)} alt="" width="88" height="88" fetchpriority="high" />
				{/if}
				<h1>{site.name}</h1>
				<p class="bio">{site.bio}</p>
				{#if accounts.length}
					<nav aria-label="Akun {site.name}">
						<ul>
							{#each accounts as a, i (a.id)}
								<li><a class:first={i === 0} href="/a/{a.id}" rel="me noopener">{accountText(a.platform, a.label)}</a></li>
							{/each}
						</ul>
					</nav>
				{/if}
			</article>
			{#each cards as c, i (c.id)}
				<section class="card {c.kind} rise" style:background={fills[i % 3]} style:--d="{120 + i * 90}ms" aria-labelledby="kartu-{c.id}">
					{#if c.image}
						<img class="card-img" src={imageSrc(c.image, 400)} alt="" width="400" height="400" loading="lazy" />
					{/if}
					<h2 id="kartu-{c.id}">{c.title}</h2>
					{#if c.body}<p>{c.body}</p>{/if}
					{#if c.href}
						<a class="card-btn" href={c.href} rel={c.href.startsWith('/k/') ? 'nofollow noopener' : undefined}>
							{c.buttonLabel || (c.kind === 'video' ? 'Tonton videonya' : 'Lihat')}
						</a>
					{/if}
				</section>
			{/each}
		</div>
	</section>
{:else}
	<header class="bar"><a href="/"><Mark size={30} dot="var(--accent)" />{site.name}</a></header>
{/if}

<main class="catalog" id="produk">
	<h2 class="title" class:visually-hidden={isFirstPage}>{isFirstPage ? 'Semua produk' : 'Produk sebelumnya'}</h2>
	<Search {categories} />
	{#if products.length}
		<div class="grid">
			{#each products as p, i (p.number)}
				<Tile {p} eager={i < 2} index={i} />
			{/each}
		</div>
		{#if nextCursor}
			<a class="more" href="/?setelah={nextCursor}#produk">Muat produk sebelumnya</a>
		{/if}
	{:else}
		<p class="empty">Belum ada produk di sini. Produk yang aku tambahkan akan muncul paling atas.</p>
	{/if}
</main>

<Footer name={site.name} />

<style>
	.deck {
		padding: 16px 0 8px;
	}
	.track {
		display: flex;
		gap: 12px;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scroll-padding-inline: 16px;
		padding: 0 16px 8px;
		scrollbar-width: none;
		max-width: 1200px;
		margin: 0 auto;
	}
	.card {
		scroll-snap-align: start;
		flex: 0 0 calc(100vw - 48px);
		min-height: 440px;
		border-radius: 32px;
		padding: 24px 22px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.card.profile {
		background: var(--primary);
	}
	.avatar {
		width: 88px;
		height: 88px;
		border-radius: 999px;
		object-fit: cover;
	}
	h1 {
		margin: 0;
		font-family: var(--font-display);
		font-size: clamp(40px, 12vw, 56px);
		line-height: 1;
		letter-spacing: -0.03em;
		font-weight: 700;
		overflow-wrap: anywhere;
	}
	.bio {
		margin: 0;
		font-size: 17px;
		line-height: 1.45;
	}
	nav {
		margin-top: auto;
	}
	nav ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	nav a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding: 0 15px;
		border-radius: 999px;
		background: var(--bg);
		text-decoration: none;
		font-size: 14px;
		font-weight: 600;
		transition: transform 0.15s ease;
	}
	nav a.first {
		background: var(--ink);
		color: var(--on-ink);
	}
	nav a:active {
		transform: scale(0.96);
	}
	.card h2 {
		margin: 0;
		font-family: var(--font-display);
		font-size: 24px;
		line-height: 1.05;
		font-weight: 700;
		letter-spacing: -0.02em;
	}
	.card p {
		margin: 0;
		font-size: 16px;
		line-height: 1.45;
	}
	.card-img {
		width: 100%;
		aspect-ratio: 4 / 3;
		height: auto;
		border-radius: 20px;
		object-fit: cover;
	}
	.card-btn {
		margin-top: auto;
		align-self: flex-start;
		display: inline-flex;
		align-items: center;
		min-height: 48px;
		padding: 0 20px;
		border-radius: 999px;
		background: var(--ink);
		color: var(--on-ink);
		text-decoration: none;
		font-weight: 600;
		transition: transform 0.15s ease;
	}
	.card-btn:active {
		transform: scale(0.97);
	}
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
	.catalog {
		max-width: 1200px;
		margin: 0 auto;
		padding: 24px 16px 0;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.title {
		margin: 0;
		font-family: var(--font-display);
		font-size: 26px;
		font-weight: 700;
		letter-spacing: -0.02em;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px;
		margin-top: 4px;
	}
	.more {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 56px;
		margin-top: 12px;
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
		.track {
			padding: 0 32px 8px;
			scroll-padding-inline: 32px;
		}
		/* Di layar lebar kartu disusun rapi tanpa geser. */
		.track {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			overflow: visible;
		}
		.card {
			min-height: 340px;
		}
		.card.profile {
			grid-column: 1 / -1;
		}
		h1 {
			font-size: clamp(64px, 8vw, 104px);
		}
		.catalog {
			padding: 40px 32px 0;
		}
		.grid {
			grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
			gap: 14px;
		}
		.more {
			width: 360px;
			align-self: center;
		}
	}
	@media (min-width: 1100px) {
		.track {
			grid-template-columns: 2fr 1fr 1fr;
		}
		.card.profile {
			grid-column: auto;
		}
	}
</style>
