<script lang="ts">
	import { imageSrc, storeName } from '$lib/format';
	let { data } = $props();

	const filters = [
		{ id: 'semua', label: 'Terbaru' },
		{ id: 'klik', label: 'Paling diklik' },
		{ id: 'draf', label: 'Draf' },
		{ id: 'arsip', label: 'Arsip' }
	];
	const STATUS = { draft: 'Draf', published: 'Tayang', archived: 'Arsip' } as const;
	const href = (f: string, page = 1) => {
		const sp = new URLSearchParams();
		if (f !== 'semua') sp.set('f', f);
		if (data.q) sp.set('q', data.q);
		if (page > 1) sp.set('hal', String(page));
		const s = sp.toString();
		return '/admin/produk' + (s ? `?${s}` : '');
	};
</script>

<svelte:head><title>Produk · admin bynana</title></svelte:head>

<main class="admin-wrap">
	<div class="head">
		<h1>Produk</h1>
		<p class="muted">{data.counts.published} tayang · {data.counts.draft} draf</p>
	</div>

	<form method="get" role="search" class="search">
		{#if data.filter !== 'semua'}<input type="hidden" name="f" value={data.filter} />{/if}
		<label class="visually-hidden" for="q">Cari nomor atau nama</label>
		<input id="q" name="q" type="search" placeholder="Cari nomor atau nama" value={data.q} autocomplete="off" />
	</form>

	<nav class="chips" aria-label="Saring produk">
		{#each filters as f (f.id)}
			<a class="chip" href={href(f.id)} aria-current={data.filter === f.id ? 'page' : undefined}>
				{f.label}{f.id === 'draf' && data.counts.draft ? ` (${data.counts.draft})` : ''}
			</a>
		{/each}
	</nav>

	{#if data.products.length}
		<ul class="list items">
			{#each data.products as p (p.id)}
				<li>
					<a class="item" href="/admin/produk/{p.id}">
						{#if p.image}
							<img class="thumb" src={imageSrc(p.image, 400)} alt="" width="56" height="56" loading="lazy" />
						{:else}
							<span class="thumb empty">Foto</span>
						{/if}
						<span class="text">
							<span class="title"><span class="num-badge">{p.number}</span> {p.name || 'Belum ada nama'}</span>
							<span class="muted">
								<span class="status {p.status}">{STATUS[p.status]}</span>
								{p.stores.map(storeName).join(', ') || 'Belum ada link'}
							</span>
						</span>
						<span class="clicks" title="Klik 30 hari terakhir">{p.clicks}<span class="visually-hidden"> klik</span></span>
					</a>
				</li>
			{/each}
		</ul>
		{#if data.pages > 1}
			<nav class="pager" aria-label="Halaman">
				{#if data.page > 1}<a class="btn small" href={href(data.filter, data.page - 1)}>Sebelumnya</a>{/if}
				<span class="muted">Halaman {data.page} dari {data.pages}</span>
				{#if data.page < data.pages}<a class="btn small" href={href(data.filter, data.page + 1)}>Berikutnya</a>{/if}
			</nav>
		{/if}
	{:else if data.q}
		<p class="panel">Tidak ada produk yang cocok dengan "{data.q}".</p>
	{:else if data.filter === 'draf'}
		<p class="panel">Tidak ada draf. Draf muncul di sini setelah kamu menempel banyak link sekaligus.</p>
	{:else}
		<div class="panel stack">
			<p style="margin: 0">Belum ada produk. Mulai dengan menempel link-link yang sudah ada di bio, satu link per baris.</p>
			<a class="btn primary" href="/admin/produk/baru?cara=banyak">Tempel banyak link</a>
		</div>
	{/if}
	<p class="muted legend">Angka di kanan adalah jumlah klik 30 hari terakhir.</p>
</main>

<style>
	.head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
	}
	.search {
		margin-bottom: 12px;
	}
	.items {
		margin-top: 16px;
	}
	.item {
		display: grid;
		grid-template-columns: 56px minmax(0, 1fr) auto;
		gap: 12px;
		align-items: center;
		padding: 10px;
		border-radius: 20px;
		background: var(--tile);
		text-decoration: none;
	}
	:global([data-theme='blok']) .item {
		background: #f7f7f7;
	}
	.thumb.empty {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		color: var(--ink-soft);
	}
	.text {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}
	.title {
		font-weight: 600;
		line-height: 1.3;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}
	.title .num-badge {
		min-width: 0;
		height: 24px;
		font-size: 13px;
		vertical-align: 1px;
	}
	.clicks {
		font-family: var(--font-display);
		font-weight: var(--display-weight);
		font-size: 20px;
		padding-right: 6px;
		font-variant-numeric: tabular-nums;
	}
	.pager {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		margin-top: 16px;
	}
	.legend {
		margin-top: 16px;
	}
</style>
