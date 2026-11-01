<script lang="ts">
	import { untrack } from 'svelte';
	import { guessStore, imageSrc, storeName } from '$lib/format';
	import { shrinkPhoto } from './photo';

	interface Values {
		number: string;
		name: string;
		price: string;
		categoryId: string;
		links: { store: string; url: string }[];
	}
	interface Props {
		values: Values;
		categories: { id: number; name: string }[];
		nextNumber: number;
		image?: string | null;
		error?: string | null;
		field?: string | null;
	}
	let { values, categories, nextNumber, image = null, error = null, field = null }: Props = $props();

	// Nilai awal saja; form dibuat ulang ({#key}) setiap kali produk tersimpan.
	let links = $state(untrack(() => (values.links.length ? values.links.map((l) => ({ ...l })) : [{ store: '', url: '' }])));
	let name = $state(untrack(() => values.name));
	// Semua isian diikat ke state. Isian tanpa bind bisa terisi ulang nilai lama saat bagian lain form berubah (misalnya pratinjau foto).
	let price = $state(untrack(() => values.price));
	let number = $state(untrack(() => values.number));
	let categoryId = $state(untrack(() => values.categoryId));
	let reading = $state(false);
	let readNote = $state('');
	let preview = $state<string | null>(null);
	let removeImage = $state(false);

	const canPaste = typeof navigator !== 'undefined' && !!navigator.clipboard?.readText;

	async function pasteInto(i: number) {
		try {
			const text = (await navigator.clipboard.readText()).trim();
			const url = text.match(/https?:\/\/\S+/)?.[0];
			if (url) {
				links[i].url = url;
				readName(url);
			}
		} catch {
			/* izin ditolak: tempel manual lewat keyboard */
		}
	}

	function addLink() {
		if (links.length < 6) links.push({ store: '', url: '' });
	}

	async function readName(url: string) {
		if (name.trim() || !/^https?:\/\//i.test(url.trim())) return;
		reading = true;
		readNote = '';
		try {
			const res = await fetch('/admin/api/baca-link', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ url: url.trim() })
			});
			const out = await res.json();
			if (out.name && !name.trim()) {
				name = out.name;
				readNote = 'Nama terisi dari link. Periksa lagi.';
			} else if (!out.name) readNote = out.message || 'Nama tidak terbaca dari link ini. Isi sendiri.';
		} catch {
			readNote = 'Nama tidak terbaca dari link ini. Isi sendiri.';
		} finally {
			reading = false;
		}
	}

	async function onPhoto(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		const small = await shrinkPhoto(file);
		if (small !== file) {
			const dt = new DataTransfer();
			dt.items.add(small);
			input.files = dt.files;
		}
		if (preview) URL.revokeObjectURL(preview);
		preview = URL.createObjectURL(small);
		removeImage = false;
	}

	const current = $derived(removeImage ? null : preview ?? (image ? imageSrc(image, 400) : null));
</script>

{#if error && !field}<p class="notice error" role="alert">{error}</p>{/if}

{#snippet fieldError(name: string)}
	{#if error && field === name}<p class="field-error" id="err-{name}" role="alert">{error}</p>{/if}
{/snippet}

<fieldset class="links">
	<legend class="label">Link affiliate</legend>
	{#each links as l, i (i)}
		<div class="link-row">
			<label class="visually-hidden" for="link-{i}">Link toko {i + 1}</label>
			<div class="with-action">
				<input
					id="link-{i}"
					name="link_url"
					type="url"
					inputmode="url"
					autocomplete="off"
					autocapitalize="off"
					spellcheck="false"
					enterkeyhint="next"
					placeholder="https://s.shopee.co.id/..."
					bind:value={l.url}
					onblur={() => readName(l.url)}
					aria-invalid={field === 'links' ? 'true' : undefined}
					aria-describedby={field === 'links' ? 'err-links' : undefined}
				/>
				{#if canPaste && !l.url.trim()}
					<button type="button" class="inline-btn" onclick={() => pasteInto(i)}>Tempel</button>
				{:else if l.url.trim()}
					<button type="button" class="inline-btn ghost" onclick={() => (l.url = '')} aria-label="Kosongkan link {i + 1}">Hapus</button>
				{/if}
			</div>
			<input type="hidden" name="link_store" value={l.store} />
			{#if l.url.trim()}
				<p class="help">Toko: {storeName(guessStore(l.url) ?? 'lainnya')}</p>
			{/if}
		</div>
	{/each}
	{@render fieldError('links')}
	{#if links.length < 6}
		<button type="button" class="btn small" onclick={addLink}>Tambah link toko lain</button>
	{/if}
</fieldset>

<div class="photo-row">
	<label class="photo" style:background-image={current ? `url(${current})` : undefined}>
		<span class="photo-label" class:on-photo={!!current}>{current ? 'Ganti foto' : 'Pilih foto'}</span>
		<input name="foto" type="file" accept="image/*" onchange={onPhoto} aria-describedby={field === 'foto' ? 'err-foto' : undefined} />
	</label>
	<div class="field grow">
		<label for="name">Nama produk</label>
		<textarea
			id="name"
			name="name"
			rows="3"
			maxlength="160"
			enterkeyhint="next"
			placeholder="Misalnya Serum Niacinamide 30 ml"
			bind:value={name}
			aria-invalid={field === 'name' ? 'true' : undefined}
			aria-describedby={field === 'name' ? 'err-name' : undefined}
		></textarea>
		{#if reading}<p class="help" role="status">Membaca nama dari link…</p>{:else if readNote}<p class="help" role="status">{readNote}</p>{/if}
		{@render fieldError('name')}
	</div>
</div>
{@render fieldError('foto')}
{#if image && !preview}
	<label class="check"><input type="checkbox" name="hapus_foto" value="1" bind:checked={removeImage} /> Hapus foto</label>
{/if}

<div class="row2">
	<div class="field">
		<label for="price">Harga <span class="opt">opsional</span></label>
		<div class="prefix">
			<span aria-hidden="true">Rp</span>
			<input
				id="price"
				name="price"
				inputmode="numeric"
				autocomplete="off"
				enterkeyhint="next"
				bind:value={price}
				aria-invalid={field === 'price' ? 'true' : undefined}
				aria-describedby={field === 'price' ? 'err-price' : undefined}
			/>
		</div>
		{@render fieldError('price')}
	</div>
	<div class="field">
		<label for="category">Kategori</label>
		<select id="category" name="category" bind:value={categoryId}>
			<option value="">Tanpa kategori</option>
			{#each categories as c (c.id)}
				<option value={String(c.id)}>{c.name}</option>
			{/each}
		</select>
	</div>
</div>

<div class="field">
	<label for="number">Nomor <span class="opt">opsional</span></label>
	<input
		id="number"
		name="number"
		inputmode="numeric"
		autocomplete="off"
		enterkeyhint="done"
		placeholder="Otomatis"
		bind:value={number}
		aria-describedby="number-help{field === 'number' ? ' err-number' : ''}"
		aria-invalid={field === 'number' ? 'true' : undefined}
	/>
	{@render fieldError('number')}
	<p class="help" id="number-help">Kosongkan supaya dapat nomor {nextNumber}. Isi hanya kalau nomornya sudah disebut di video lama.</p>
</div>

<style>
	.links {
		border: 0;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
		align-items: flex-start;
	}
	.links legend {
		font-weight: 600;
		margin-bottom: 6px;
		padding: 0;
	}
	.link-row {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.help {
		margin: 0;
		font-size: 14px;
		color: var(--ink-soft);
	}
	.photo-row {
		display: flex;
		gap: 12px;
		align-items: stretch;
	}
	.photo {
		position: relative;
		width: 112px;
		min-height: 112px;
		flex-shrink: 0;
		border-radius: 20px;
		background: var(--accent);
		background-size: cover;
		background-position: center;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		cursor: pointer;
		overflow: hidden;
	}
	.photo input {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
	}
	.photo:focus-within {
		outline: 3px solid var(--ink);
		outline-offset: 2px;
	}
	.photo-label.on-photo {
		align-self: flex-end;
		margin-bottom: 8px;
		padding: 4px 10px;
		border-radius: 999px;
		background: var(--ink);
		color: var(--on-ink);
		font-size: 13px;
	}
	.with-action {
		position: relative;
	}
	.with-action input {
		padding-right: 92px;
	}
	.inline-btn {
		position: absolute;
		top: 50%;
		right: 6px;
		transform: translateY(-50%);
		min-height: 40px;
		padding: 0 14px;
		border: 0;
		border-radius: 999px;
		background: var(--ink);
		color: var(--on-ink);
		font: inherit;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
	}
	.inline-btn.ghost {
		background: transparent;
		color: var(--ink-soft);
		text-decoration: underline;
	}
	.prefix {
		position: relative;
	}
	.prefix span {
		position: absolute;
		left: 16px;
		top: 50%;
		transform: translateY(-50%);
		font-weight: 600;
		color: var(--ink-soft);
		pointer-events: none;
	}
	.prefix input {
		padding-left: 46px;
	}
	.opt {
		font-weight: 400;
		font-size: 14px;
		color: var(--ink-soft);
	}
	.grow {
		flex: 1;
	}
	.check {
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
	}
	.check input {
		width: 20px;
		height: 20px;
	}
</style>
