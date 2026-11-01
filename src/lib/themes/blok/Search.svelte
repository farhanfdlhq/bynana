<script lang="ts">
	import type { CategoryData } from '$lib/types';
	let { categories, value = '', active = null }: { categories: CategoryData[]; value?: string; active?: string | null } = $props();
</script>

<section class="find rise" style="--d: 120ms" aria-label="Cari produk">
	<form action="/cari" method="get" role="search">
		<label for="cari">Nomor berapa di video?</label>
		<div class="row">
			<input id="cari" name="q" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" placeholder="459 atau sunscreen" {value} maxlength="80" />
			<button type="submit">Cari</button>
		</div>
	</form>
	{#if categories.length}
		<nav aria-label="Kategori">
			<ul>
				<li><a href="/" aria-current={active === null ? 'page' : undefined}>Semua</a></li>
				{#each categories as c (c.slug)}
					<li><a href="/kategori/{c.slug}" aria-current={active === c.slug ? 'page' : undefined}>{c.name}</a></li>
				{/each}
			</ul>
		</nav>
	{/if}
</section>

<style>
	.find {
		padding: 24px 0 16px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	label {
		font-family: var(--font-display);
		font-size: 28px;
		font-weight: 800;
		letter-spacing: -0.03em;
		line-height: 1.05;
	}
	.row {
		display: flex;
		gap: 8px;
	}
	input {
		flex: 1;
		min-width: 0;
		height: 58px;
		border: 0;
		border-radius: 999px;
		background: var(--field);
		padding: 0 22px;
		font: inherit;
		font-size: 20px;
		color: var(--ink);
	}
	input::placeholder {
		color: #6b6b6b;
	}
	button {
		flex-shrink: 0;
		height: 58px;
		padding: 0 22px;
		border: 0;
		border-radius: 999px;
		background: var(--ink);
		color: var(--on-ink);
		font: inherit;
		font-weight: 600;
		font-size: 16px;
		cursor: pointer;
		transition: transform 0.15s ease;
	}
	button:active {
		transform: scale(0.96);
	}
	nav ul {
		list-style: none;
		margin: 0;
		padding: 0 0 4px;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	nav a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding: 0 18px;
		border-radius: 999px;
		background: var(--field);
		text-decoration: none;
		white-space: nowrap;
		font-size: 15px;
	}
	nav a[aria-current='page'] {
		background: var(--ink);
		color: var(--on-ink);
		font-weight: 600;
	}
	@media (min-width: 720px) {
		form {
			max-width: 720px;
		}
	}
</style>
