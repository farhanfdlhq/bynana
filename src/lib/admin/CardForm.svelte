<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import { imageSrc } from '$lib/format';
	import FileInput from './FileInput.svelte';

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
	interface Props {
		c: CardValues;
		categories: { id: number; name: string }[];
		error?: string | null;
	}
	let { c, categories, error = null }: Props = $props();

	const KINDS = [
		{ id: 'promo', label: 'Promo', help: 'Ajak pengunjung ke kategori atau link tertentu, misalnya kumpulan diskon.' },
		{ id: 'link', label: 'Link', help: 'Tombol ke alamat lain, misalnya etalase toko.' },
		{ id: 'video', label: 'Video', help: 'Gambar sampul dan tombol ke video TikTok, Reels, atau YouTube.' },
		{ id: 'teks', label: 'Teks', help: 'Pengumuman singkat. Tombol boleh tidak ada.' }
	];

	let kind = $state(untrack(() => c.kind));
	let target = $state(untrack(() => (c.categoryId ? 'kategori' : c.url ? 'link' : c.kind === 'teks' ? 'none' : 'kategori')));
	let title = $state(untrack(() => c.title));
	let body = $state(untrack(() => c.body));
	const uid = $derived(c.id || 'baru');
	const help = $derived(KINDS.find((k) => k.id === kind)?.help ?? '');
	const needsLink = $derived(kind === 'link' || kind === 'video');
	$effect(() => {
		if (needsLink) target = 'link';
	});
</script>

<form novalidate method="post" action="?/simpanKartu" enctype="multipart/form-data" class="stack" use:enhance={() => async ({ update }) => update({ reset: false })}>
	<input type="hidden" name="id" value={c.id} />
	{#if error}<p class="notice error" role="alert">{error}</p>{/if}

	<fieldset class="field">
		<legend class="label">Jenis kartu</legend>
		<div class="seg">
			{#each KINDS as k (k.id)}
				<label class:on={kind === k.id}><input class="visually-hidden" type="radio" name="kind" value={k.id} bind:group={kind} />{k.label}</label>
			{/each}
		</div>
		<p class="help">{help}</p>
	</fieldset>

	<div class="field">
		<label for="title-{uid}">Judul</label>
		<input id="title-{uid}" name="title" maxlength="80" enterkeyhint="next" placeholder="Misalnya Diskon 11.11" bind:value={title} />
		<p class="help count">{title.length}/80</p>
	</div>

	<div class="field">
		<label for="body-{uid}">Teks <span class="opt">opsional</span></label>
		<textarea id="body-{uid}" name="body" rows="2" maxlength="280" placeholder="Satu atau dua kalimat" bind:value={body}></textarea>
		<p class="help count">{body.length}/280</p>
	</div>

	<fieldset class="field">
		<legend class="label">Tombol menuju</legend>
		<div class="seg">
			<label class:on={target === 'kategori'} class:off={needsLink}><input class="visually-hidden" type="radio" name="target" value="kategori" bind:group={target} disabled={needsLink} />Kategori</label>
			<label class:on={target === 'link'}><input class="visually-hidden" type="radio" name="target" value="link" bind:group={target} />Link</label>
			<label class:on={target === 'none'} class:off={needsLink}><input class="visually-hidden" type="radio" name="target" value="none" bind:group={target} disabled={needsLink} />Tanpa tombol</label>
		</div>
		{#if needsLink}<p class="help">Kartu {kind === 'video' ? 'video' : 'link'} selalu butuh link.</p>{/if}
	</fieldset>

	{#if target === 'kategori'}
		<div class="field">
			<label for="cat-{uid}">Kategori tujuan</label>
			<select id="cat-{uid}" name="category">
				<option value="">Pilih kategori</option>
				{#each categories as k (k.id)}<option value={k.id} selected={c.categoryId === k.id}>{k.name}</option>{/each}
			</select>
			{#if !categories.length}<p class="help">Belum ada kategori. Buat dulu di menu Atur.</p>{/if}
		</div>
	{:else if target === 'link'}
		<div class="field">
			<label for="url-{uid}">Link tujuan</label>
			<input id="url-{uid}" name="url" type="url" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="https://" value={c.url} />
		</div>
	{/if}
	{#if target !== 'none'}
		<div class="field">
			<label for="btn-{uid}">Tulisan tombol <span class="opt">opsional</span></label>
			<input id="btn-{uid}" name="button_label" maxlength="40" placeholder={kind === 'video' ? 'Tonton videonya' : 'Lihat'} value={c.buttonLabel} />
		</div>
	{/if}

	<div class="field">
		<span class="label">Gambar <span class="opt">opsional</span></span>
		<FileInput id="img-{uid}" name="gambar" label="Pilih gambar" current={c.image ? imageSrc(c.image, 400) : null} />
		{#if c.image}<label class="check"><input type="checkbox" name="hapus_gambar" value="1" /> Hapus gambar</label>{/if}
	</div>

	<fieldset class="field">
		<legend class="label">Waktu tampil <span class="opt">opsional</span></legend>
		<div class="row2">
			<div class="field">
				<label class="small" for="start-{uid}">Mulai</label>
				<input id="start-{uid}" name="starts_at" type="date" value={c.startsAt ?? ''} />
			</div>
			<div class="field">
				<label class="small" for="end-{uid}">Sampai</label>
				<input id="end-{uid}" name="ends_at" type="date" value={c.endsAt ?? ''} />
			</div>
		</div>
		<p class="help">Kosongkan supaya kartu selalu tampil.</p>
	</fieldset>

	<label class="check"><input type="checkbox" name="visible" value="1" checked={c.visible} /> Tampilkan di situs</label>
	<button class="btn primary block">Simpan kartu</button>
</form>

<style>
	fieldset {
		border: 0;
		margin: 0;
		padding: 0;
		min-width: 0;
	}
	legend {
		padding: 0;
		margin-bottom: 6px;
		font-weight: 600;
	}
	.seg {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.seg label {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding: 0 16px;
		border-radius: 14px;
		background: var(--field);
		font-weight: 600;
		font-size: 15px;
		cursor: pointer;
		transition: transform 0.15s ease;
	}
	:global([data-theme='pastel']) .seg label {
		background: #ffffff;
	}
	.seg label.on {
		background: var(--ink);
		color: var(--on-ink);
	}
	.seg label.off {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.seg label:active {
		transform: scale(0.97);
	}
	.seg label:focus-within {
		outline: 3px solid var(--primary);
		outline-offset: 2px;
	}
	.help {
		margin: 6px 0 0;
		font-size: 14px;
		color: var(--ink-soft);
	}
	.count {
		margin-top: 0;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.opt {
		font-weight: 400;
		font-size: 14px;
		color: var(--ink-soft);
	}
	.small {
		font-weight: 400 !important;
		font-size: 14px !important;
	}
</style>
