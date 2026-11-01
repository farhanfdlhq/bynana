<script lang="ts">
	import { enhance } from '$app/forms';
	import ProductForm from '$lib/admin/ProductForm.svelte';
	let { data, form } = $props();

	let busy = $state(false);
	const empty = { number: '', name: '', price: '', categoryId: '', links: [] };
	const values = $derived(form && 'values' in form && form.values ? form.values : empty);
	const bulk = $derived(form && 'bulk' in form ? form.bulk : null);
	const made = $derived(bulk ? bulk.outcomes.filter((o) => o.ok) : []);
	const skipped = $derived(bulk ? bulk.outcomes.filter((o) => !o.ok) : []);

	const submit = () => {
		busy = true;
		return async ({ update }: { update: (opts?: { reset?: boolean }) => Promise<void> }) => {
			await update({ reset: false });
			busy = false;
		};
	};
</script>

<svelte:head><title>Tambah produk · admin bynana</title></svelte:head>

<main class="admin-wrap">
	<h1>Tambah produk</h1>
	<nav class="tabs" aria-label="Cara menambah">
		<a href="/admin/produk/baru" aria-current={data.cara === 'satu' ? 'page' : undefined}>Satu produk</a>
		<a href="/admin/produk/baru?cara=banyak" aria-current={data.cara === 'banyak' ? 'page' : undefined}>Tempel banyak</a>
	</nav>

	{#if data.cara === 'satu'}
		{#if data.saved}<p class="notice" role="status">Nomor {data.saved} tersimpan dan sudah tayang. Lanjut produk berikutnya.</p>{/if}
		<form method="post" action="?/simpan" enctype="multipart/form-data" class="stack" use:enhance={submit}>
			{#key data.saved}
			<ProductForm
				{values}
				categories={data.categories}
				nextNumber={data.nextNumber}
				error={form && 'message' in form && !('bulkText' in form) ? form.message : null}
				field={form && 'field' in form ? form.field : null}
			/>
			{/key}
			<div class="actions">
				<button class="btn primary block" formaction="?/lagi" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan dan tambah lagi'}</button>
				<button class="btn accent block" formaction="?/simpan" disabled={busy}>Simpan dan lihat</button>
				<button class="btn block" formaction="?/draf" disabled={busy}>Simpan sebagai draf</button>
			</div>
		</form>
	{:else}
		{#if bulk}
			<section class="panel stack result" aria-live="polite">
				<h2 style="margin: 0">{made.length} draf dibuat</h2>
				{#if made.length}
					<ul class="list">
						{#each made as o (o.line)}
							{#if o.ok}
								<li><a class="draft" href="/admin/produk/{o.id}"><span class="num-badge">{o.number}</span> {o.name || 'Nama belum terbaca, isi sendiri'}</a></li>
							{/if}
						{/each}
					</ul>
					<a class="btn primary" href="/admin/produk?f=draf">Lengkapi draf</a>
				{/if}
				{#if skipped.length || bulk.invalid.length || bulk.duplicates.length}
					<h3>Dilewati</h3>
					<ul class="skip">
						{#each skipped as o (o.line)}
							{#if !o.ok}<li>Baris {o.line}: {o.reason}</li>{/if}
						{/each}
						{#each bulk.invalid as v (v.line)}
							<li>Baris {v.line}: tidak ada link di baris ini</li>
						{/each}
						{#each bulk.duplicates as line (line)}
							<li>Baris {line}: link yang sama sudah ada di baris sebelumnya</li>
						{/each}
					</ul>
				{/if}
			</section>
		{/if}
		<form method="post" action="?/banyak" class="stack" use:enhance={submit}>
			{#if form && 'bulkText' in form}<p class="notice error" role="alert">{form.message}</p>{/if}
			<div class="field">
				<label for="daftar">Satu link per baris</label>
				<textarea
					id="daftar"
					name="daftar"
					rows="9"
					aria-describedby="daftar-help"
					placeholder={'459 https://s.shopee.co.id/...\nhttps://vt.tokopedia.com/...'}
				>{form && 'bulkText' in form ? form.bulkText : ''}</textarea>
				<p class="help" id="daftar-help">
					Boleh diawali nomor yang sudah disebut di video, misalnya <strong>459</strong> atau <strong>no.459</strong>. Baris tanpa nomor dapat nomor
					otomatis mulai {data.nextNumber}. Maksimal 50 link sekali tempel.
				</p>
			</div>
			<button class="btn accent block" disabled={busy}>{busy ? 'Membaca link, tunggu sebentar…' : 'Buat draf'}</button>
		</form>
	{/if}
</main>

<style>
	.tabs {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 4px;
		padding: 4px;
		margin-bottom: 20px;
		border-radius: 999px;
		background: var(--field);
	}
	:global([data-theme='pastel']) .tabs {
		background: #ffffff;
	}
	.tabs a {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 46px;
		border-radius: 999px;
		text-decoration: none;
		font-weight: 600;
	}
	.tabs a[aria-current='page'] {
		background: var(--ink);
		color: var(--on-ink);
	}
	.actions {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 8px;
	}
	.help {
		margin: 0;
		font-size: 14px;
		color: var(--ink-soft);
	}
	.result {
		margin-bottom: 20px;
	}
	.result h3 {
		margin: 8px 0 0;
		font-size: 17px;
	}
	.draft {
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: 44px;
		text-decoration: none;
		font-weight: 600;
	}
	.skip {
		margin: 0;
		padding-left: 20px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
</style>
