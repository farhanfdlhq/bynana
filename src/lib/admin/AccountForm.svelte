<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import { PLATFORM_NAMES } from '$lib/format';

	interface Props {
		id?: number;
		platform?: string;
		label?: string;
		url?: string;
		visible?: boolean;
		platforms: readonly string[];
		error?: string | null;
	}
	let { id = 0, platform = 'tiktok', label = '', url = '', visible = true, platforms, error = null }: Props = $props();

	let chosen = $state(untrack(() => platform));
	const uid = $derived(id || 'baru');
	const EXAMPLE: Record<string, string> = {
		tiktok: 'https://www.tiktok.com/@bynana',
		instagram: 'https://www.instagram.com/bynana',
		shopee: 'https://shopee.co.id/bynana',
		threads: 'https://www.threads.net/@bynana',
		facebook: 'https://www.facebook.com/bynana',
		youtube: 'https://www.youtube.com/@bynana',
		whatsapp: 'https://wa.me/628xxxxxxxxxx',
		lainnya: 'https://'
	};
</script>

<form novalidate method="post" action="?/simpanAkun" class="stack" use:enhance={() => async ({ update }) => update({ reset: !id })}>
	{#if id}<input type="hidden" name="id" value={id} />{/if}
	{#if error}<p class="notice error" role="alert">{error}</p>{/if}

	<fieldset class="field">
		<legend class="label">Platform</legend>
		<div class="seg">
			{#each platforms as p (p)}
				<label class:on={chosen === p}><input class="visually-hidden" type="radio" name="platform" value={p} bind:group={chosen} />{PLATFORM_NAMES[p] || 'Lainnya'}</label>
			{/each}
		</div>
	</fieldset>

	<div class="field">
		<label for="lb-{uid}">Nama akun <span class="opt">opsional</span></label>
		<input id="lb-{uid}" name="label" maxlength="40" autocapitalize="off" autocomplete="off" placeholder="@bynana" value={label} />
		<p class="help">Tampil di tombol, misalnya "{PLATFORM_NAMES[chosen] || 'Akun'} @bynana".</p>
	</div>

	<div class="field">
		<label for="au-{uid}">Link</label>
		<input id="au-{uid}" name="url" type="url" inputmode="url" autocapitalize="off" autocomplete="off" spellcheck="false" placeholder={EXAMPLE[chosen] ?? 'https://'} value={url} />
	</div>

	<label class="check"><input type="checkbox" name="visible" value="1" checked={visible} /> Tampilkan di situs</label>
	<button class="btn primary block">{id ? 'Simpan akun' : 'Tambah akun'}</button>
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
		padding: 0 14px;
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
	.seg label:active {
		transform: scale(0.97);
	}
	.seg label:focus-within {
		outline: 3px solid var(--primary);
		outline-offset: 2px;
	}
	.help {
		margin: 0;
		font-size: 14px;
		color: var(--ink-soft);
	}
	.opt {
		font-weight: 400;
		font-size: 14px;
		color: var(--ink-soft);
	}
</style>
