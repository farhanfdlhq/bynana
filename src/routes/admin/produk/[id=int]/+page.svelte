<script lang="ts">
	import { enhance } from '$app/forms';
	import ConfirmButton from '$lib/admin/ConfirmButton.svelte';
	import ProductForm from '$lib/admin/ProductForm.svelte';
	import { toast } from '$lib/admin/toast.svelte';
	let { data, form } = $props();
	let busy = $state(false);
	const p = $derived(data.product);
	const values = $derived(form && 'values' in form && form.values ? form.values : p.values);
	const STATUS = { draft: 'Draf, belum tampil di situs', published: 'Tayang di situs', archived: 'Diarsipkan, tidak tampil di situs' } as const;
	const submit = () => {
		busy = true;
		return async ({ update }: { update: (opts?: { reset?: boolean }) => Promise<void> }) => {
			await update({ reset: false });
			busy = false;
		};
	};
	$effect(() => {
		if (data.saved && !form) toast('Tersimpan.');
	});
</script>

<svelte:head><title>Produk {p.number} · admin bynana</title></svelte:head>

<main class="admin-wrap">
	<div class="head">
		<a class="btn small" href="/admin/produk">Kembali</a>
		{#if p.status === 'published'}<a class="btn small" href="/{p.number}" target="_blank" rel="noopener">Lihat di situs</a>{/if}
	</div>
	<h1>Produk nomor {p.number}</h1>
	<p class="muted"><span class="status {p.status}">{STATUS[p.status]}</span> · {data.clicks} klik sejak awal</p>

	{#key p.id + String(data.saved)}
	<form novalidate method="post" action="?/simpan" enctype="multipart/form-data" class="stack" use:enhance={submit}>
		<ProductForm
			{values}
			image={p.image}
			categories={data.categories}
			nextNumber={data.nextNumber}
			error={form && 'message' in form ? form.message : null}
			field={form && 'field' in form ? form.field : null}
		/>
		<div class="actions">
			{#if p.status === 'published'}
				<button class="btn primary block" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
			{:else}
				<button class="btn primary block" formaction="?/tayang" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan dan tayangkan'}</button>
				<button class="btn block" disabled={busy}>Simpan saja</button>
			{/if}
		</div>
	</form>
	{/key}

	<h2>Status</h2>
	<div class="status-actions">
		{#if p.status !== 'draft'}
			<form method="post" action="?/draf" use:enhance><button class="btn small">Jadikan draf</button></form>
		{/if}
		{#if p.status !== 'archived'}
			<form method="post" action="?/arsip" use:enhance><button class="btn small">Arsipkan</button></form>
		{/if}
		<form method="post" action="?/hapus"><ConfirmButton label="Hapus permanen" title="Hapus produk nomor {p.number}?" message="Produk hilang dari situs dan tidak bisa dikembalikan. Nomornya tidak akan dipakai lagi." confirmLabel="Hapus" /></form>
	</div>
	<p class="muted">Arsip menyembunyikan produk tanpa menghapusnya. Kalau nomornya dibuka, pengunjung melihat pesan bahwa produk sudah tidak tersedia.</p>
</main>

<style>
	.head {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		margin-top: 16px;
	}
	.actions {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 8px;
	}
	.status-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
</style>
