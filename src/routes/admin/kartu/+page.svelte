<script lang="ts">
	import { enhance } from '$app/forms';
	import AccountForm from '$lib/admin/AccountForm.svelte';
	import CardForm from '$lib/admin/CardForm.svelte';
	import ConfirmButton from '$lib/admin/ConfirmButton.svelte';
	import { toast } from '$lib/admin/toast.svelte';
	import { accountText } from '$lib/format';
	let { data, form } = $props();

	const KIND = { promo: 'Promo', link: 'Link', video: 'Video', teks: 'Teks' } as const;
	interface CardValues {
		id: number;
		kind: string;
		title: string;
		body: string;
		buttonLabel: string;
		url: string;
		categoryId: number | null;
		image: string | null;
		visible: boolean;
		startsAt: string | null;
		endsAt: string | null;
	}
	const empty: CardValues = { id: 0, kind: 'promo', title: '', body: '', buttonLabel: '', url: '', categoryId: null, image: null, visible: true, startsAt: null, endsAt: null };
	let openNew = $state(false);
	$effect(() => {
		if (form && 'ok' in form && form.ok) toast(form.ok);
	});
	let openAccount = $state(false);
</script>

<svelte:head><title>Kartu · admin bynana</title></svelte:head>



<main class="admin-wrap">
	<h1>Kartu</h1>
	<p class="muted">Kartu tampil di atas katalog. Di tema Kartu pastel, kartu bisa digeser.</p>

	<ul class="list">
		{#each data.cards as c, i (c.id)}
			<li class="panel">
				<details>
					<summary>
						<span class="status {c.visible ? 'published' : 'archived'}">{KIND[c.kind]}{c.visible ? '' : ', disembunyikan'}</span>
						<strong>{c.title}</strong>
					</summary>
					<div class="inner">
						<CardForm {c} categories={data.categories} error={form && 'cardError' in form && form.cardId === c.id ? form.cardError : null} />
						<div class="mini-actions">
							{#if i > 0}<form novalidate method="post" action="?/geserKartu" use:enhance><input type="hidden" name="id" value={c.id} /><input type="hidden" name="arah" value="naik" /><button class="btn small">Naikkan</button></form>{/if}
							{#if i < data.cards.length - 1}<form novalidate method="post" action="?/geserKartu" use:enhance><input type="hidden" name="id" value={c.id} /><input type="hidden" name="arah" value="turun" /><button class="btn small">Turunkan</button></form>{/if}
							<form novalidate method="post" action="?/hapusKartu" use:enhance><input type="hidden" name="id" value={c.id} /><ConfirmButton label="Hapus" title="Hapus kartu ini?" message="Kartu “{c.title}” hilang dari situs dan tidak bisa dikembalikan." /></form>
						</div>
					</div>
				</details>
			</li>
		{/each}
	</ul>
	{#if !data.cards.length}<p class="panel">Belum ada kartu. Kartu promo cocok untuk diskon tanggal kembar.</p>{/if}

	<details class="panel add" bind:open={openNew}>
		<summary><strong>Tambah kartu</strong></summary>
		<div class="inner">{#key data.cards.length}<CardForm c={empty} categories={data.categories} error={form && 'cardError' in form && !form.cardId ? form.cardError : null} />{/key}</div>
	</details>

	<h2>Akun sosmed</h2>
	<p class="muted">Tampil sebagai tombol di bagian profil. Satu platform boleh lebih dari satu akun.</p>
	<ul class="list">
		{#each data.accounts as a, i (a.id)}
			<li class="panel">
				<details>
					<summary><strong>{accountText(a.platform, a.label)}</strong>{#if !a.visible}<span class="muted"> · disembunyikan</span>{/if}</summary>
					<div class="inner">
						<AccountForm id={a.id} platform={a.platform} label={a.label} url={a.url} visible={a.visible} platforms={data.platforms} error={form && 'accountError' in form && form.accountId === a.id ? form.accountError : null} />
						<div class="mini-actions">
							{#if i > 0}<form novalidate method="post" action="?/geserAkun" use:enhance><input type="hidden" name="id" value={a.id} /><input type="hidden" name="arah" value="naik" /><button class="btn small">Naikkan</button></form>{/if}
							{#if i < data.accounts.length - 1}<form novalidate method="post" action="?/geserAkun" use:enhance><input type="hidden" name="id" value={a.id} /><input type="hidden" name="arah" value="turun" /><button class="btn small">Turunkan</button></form>{/if}
							<form novalidate method="post" action="?/hapusAkun" use:enhance><input type="hidden" name="id" value={a.id} /><ConfirmButton label="Hapus" title="Hapus akun ini?" message="Tombol {accountText(a.platform, a.label)} hilang dari situs." /></form>
						</div>
					</div>
				</details>
			</li>
		{/each}
	</ul>

	<details class="panel add" bind:open={openAccount}>
		<summary><strong>Tambah akun</strong></summary>
		<div class="inner">
			{#key data.accounts.length}<AccountForm platforms={data.platforms} error={form && 'accountError' in form && !form.accountId ? form.accountError : null} />{/key}
		</div>
	</details>
</main>

<style>
	summary {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		cursor: pointer;
		list-style: none;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	.inner {
		padding-top: 12px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.add {
		margin-top: 12px;
	}
	.mini-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
</style>
