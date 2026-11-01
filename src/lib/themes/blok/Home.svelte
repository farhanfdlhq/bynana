<script lang="ts">
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
</script>

<header class="hero">
	<div class="wrap hero-grid">
		<div class="who">
			{#if site.avatar}
				<img class="avatar" src={imageSrc(site.avatar, 400)} alt="" width="72" height="72" fetchpriority="high" />
			{/if}
			<h1>{site.name}</h1>
		</div>
		<div class="about">
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
		</div>
	</div>
</header>

<main class="wrap">
	<Search {categories} />

	{#if cards.length}
		<div class="cards">
			{#each cards as c (c.id)}
				<section class="card {c.kind}" aria-labelledby="kartu-{c.id}">
					{#if c.image}
						<img class="card-img" src={imageSrc(c.image, 400)} alt="" width="400" height="400" loading="lazy" />
					{/if}
					<div class="card-text">
						<h2 id="kartu-{c.id}">{c.title}</h2>
						{#if c.body}<p>{c.body}</p>{/if}
						{#if c.href}
							<a class="card-btn" href={c.href} rel={c.href.startsWith('/k/') ? 'nofollow noopener' : undefined}>
								{c.buttonLabel || (c.kind === 'video' ? 'Tonton videonya' : 'Lihat')}
							</a>
						{/if}
					</div>
				</section>
			{/each}
		</div>
	{/if}

	<section class="products" id="produk" aria-labelledby="judul-produk">
		<h2 id="judul-produk">{isFirstPage ? 'Terbaru' : 'Produk sebelumnya'}</h2>
		{#if products.length}
			<div class="grid">
				{#each products as p, i (p.number)}
					<Tile {p} eager={i < 4} />
				{/each}
			</div>
			{#if nextCursor}
				<a class="more" href="/?setelah={nextCursor}#produk">Muat produk sebelumnya</a>
			{/if}
		{:else}
			<p class="empty">Belum ada produk di sini. Produk yang aku tambahkan akan muncul paling atas.</p>
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
	.hero {
		background: var(--primary);
		padding: 28px 0 24px;
	}
	.hero-grid {
		display: grid;
		gap: 16px;
	}
	.who {
		display: flex;
		align-items: center;
		gap: 14px;
	}
	.avatar {
		width: 72px;
		height: 72px;
		border-radius: 999px;
		object-fit: cover;
		flex-shrink: 0;
	}
	h1 {
		margin: 0;
		font-family: var(--font-display);
		font-size: clamp(56px, 16vw, 132px);
		line-height: 0.88;
		letter-spacing: -0.045em;
		font-weight: 800;
	}
	.bio {
		margin: 0 0 16px;
		font-size: 18px;
		line-height: 1.4;
		max-width: 520px;
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
		padding: 0 16px;
		border-radius: 999px;
		background: var(--bg);
		text-decoration: none;
		font-weight: 600;
		font-size: 15px;
		transition: transform 0.15s ease;
	}
	nav a.first {
		background: var(--ink);
		color: var(--on-ink);
	}
	nav a:active {
		transform: scale(0.96);
	}
	.cards {
		display: grid;
		gap: 12px;
		margin-top: 8px;
	}
	.card {
		border-radius: 28px;
		padding: 22px 20px;
		display: flex;
		gap: 16px;
		align-items: center;
		background: var(--field);
	}
	.card.promo {
		background: var(--accent);
	}
	.card.link {
		background: var(--primary-soft);
	}
	.card.video {
		background: var(--ink);
		color: var(--on-ink);
	}
	.card-img {
		width: 96px;
		height: 96px;
		border-radius: 18px;
		object-fit: cover;
		flex-shrink: 0;
	}
	.card-text {
		display: flex;
		flex-direction: column;
		gap: 10px;
		align-items: flex-start;
		min-width: 0;
	}
	.card h2 {
		margin: 0;
		font-family: var(--font-display);
		font-size: 30px;
		line-height: 1;
		letter-spacing: -0.03em;
		font-weight: 800;
	}
	.card p {
		margin: 0;
		font-size: 16px;
		line-height: 1.45;
	}
	.card-btn {
		display: inline-flex;
		align-items: center;
		min-height: 48px;
		padding: 0 20px;
		border-radius: 999px;
		background: var(--ink);
		color: var(--accent);
		text-decoration: none;
		font-weight: 600;
		transition: transform 0.15s ease;
	}
	.card.link .card-btn {
		color: var(--on-ink);
	}
	.card.video .card-btn {
		background: var(--primary);
		color: var(--ink);
	}
	.card.teks .card-btn {
		color: var(--on-ink);
	}
	.card-btn:active {
		transform: scale(0.97);
	}
	.products {
		margin-top: 40px;
	}
	.products h2 {
		margin: 0 0 16px;
		font-family: var(--font-display);
		font-size: 28px;
		font-weight: 800;
		letter-spacing: -0.03em;
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
		font-size: 17px;
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
		.hero {
			padding: 48px 0 40px;
		}
		.hero-grid {
			grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
			align-items: end;
			gap: 32px;
		}
		.cards {
			grid-template-columns: repeat(2, minmax(0, 1fr));
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
