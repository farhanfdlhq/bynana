<script lang="ts">
	import { accountText, imageSrc, storeName } from '$lib/format';
	let { data } = $props();
	const ranges = [
		{ id: 7, label: '7 hari' },
		{ id: 30, label: '30 hari' },
		{ id: 'semua', label: 'Semua' }
	] as const;
	const s = $derived(data.stats);
	const maxDay = $derived(Math.max(1, ...s.days.map((d) => d.clicks)));
	const dayLabel = (d: string) => new Date(d + 'T00:00:00Z').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'UTC' });
</script>

<svelte:head><title>Klik · admin bynana</title></svelte:head>

<main class="admin-wrap">
	<h1>Klik</h1>
	<nav class="chips" aria-label="Rentang waktu">
		{#each ranges as r (r.id)}
			<a class="chip" href="/admin/klik?rentang={r.id}" aria-current={data.range === r.id ? 'page' : undefined}>{r.label}</a>
		{/each}
	</nav>

	<p class="total"><strong>{s.total}</strong> klik ke toko, kartu, dan akun</p>
	<p class="muted">Klik dari bot dan pratinjau link (WhatsApp, Facebook) tidak dihitung. Satu orang yang mengetuk dua kali tercatat dua klik.</p>

	{#if s.days.length > 1}
		<h2>Per hari</h2>
		<ol class="days">
			{#each s.days as d (d.day)}
				<li>
					<span class="d">{dayLabel(d.day)}</span>
					<span class="bar" style:width="{(d.clicks / maxDay) * 100}%"></span>
					<span class="n">{d.clicks}</span>
				</li>
			{/each}
		</ol>
	{/if}

	<h2>Produk paling diklik</h2>
	{#if s.products.length}
		<ol class="list">
			{#each s.products as p (p.id)}
				<li>
					<a class="row" href="/admin/produk/{p.id}">
						{#if p.image}<img class="thumb" src={imageSrc(p.image, 400)} alt="" width="56" height="56" loading="lazy" />{:else}<span class="thumb"></span>{/if}
						<span class="text">
							<strong><span class="num-badge">{p.number}</span> {p.name}</strong>
							<span class="muted">{p.stores.map((x) => `${storeName(x.store)} ${x.clicks}`).join(' · ')}</span>
						</span>
						<span class="big">{p.clicks}</span>
					</a>
				</li>
			{/each}
		</ol>
	{:else}
		<p class="panel">Belum ada klik di rentang ini. Klik muncul setelah pengunjung mengetuk tombol toko.</p>
	{/if}

	{#if s.cards.length}
		<h2>Kartu</h2>
		<ul class="list">
			{#each s.cards as c (c.id)}<li class="panel line"><span>{c.title}</span><span class="big">{c.clicks}</span></li>{/each}
		</ul>
	{/if}
	{#if s.accounts.length}
		<h2>Akun sosmed</h2>
		<ul class="list">
			{#each s.accounts as a (a.id)}<li class="panel line"><span>{accountText(a.platform, a.label)}</span><span class="big">{a.clicks}</span></li>{/each}
		</ul>
	{/if}
</main>

<style>
	.total {
		margin: 20px 0 4px;
		font-size: 18px;
	}
	.total strong {
		font-family: var(--font-display);
		font-weight: var(--display-weight);
		font-size: 48px;
		letter-spacing: var(--display-track);
		margin-right: 6px;
	}
	.days {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.days li {
		display: grid;
		grid-template-columns: 64px minmax(0, 1fr) 40px;
		align-items: center;
		gap: 8px;
		font-size: 14px;
	}
	.bar {
		height: 14px;
		border-radius: 999px;
		background: var(--primary);
		min-width: 4px;
	}
	.n {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.row {
		display: grid;
		grid-template-columns: 56px minmax(0, 1fr) auto;
		gap: 12px;
		align-items: center;
		padding: 10px;
		border-radius: 20px;
		background: var(--tile);
		text-decoration: none;
	}
	:global([data-theme='blok']) .row {
		background: #f7f7f7;
	}
	.text {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}
	.text strong {
		line-height: 1.3;
	}
	.text .num-badge {
		min-width: 0;
		height: 24px;
		font-size: 13px;
	}
	.big {
		font-family: var(--font-display);
		font-weight: var(--display-weight);
		font-size: 22px;
		padding-right: 6px;
		font-variant-numeric: tabular-nums;
	}
	.line {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}
</style>
