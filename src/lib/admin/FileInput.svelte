<script lang="ts">
	import { shrinkPhoto } from './photo';

	interface Props {
		id: string;
		name: string;
		label: string;
		current?: string | null;
		round?: boolean;
	}
	let { id, name, label, current = null, round = false }: Props = $props();
	let preview = $state<string | null>(null);
	let fileName = $state('');

	async function onChange(e: Event) {
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
		fileName = file.name;
	}
	const shown = $derived(preview ?? current);
</script>

<div class="file">
	<span class="thumb" class:round style:background-image={shown ? `url(${shown})` : undefined} aria-hidden="true">
		{#if !shown}
			<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 7.5h3l1.5-2h7l1.5 2h3v11H4z M12 16a3 3 0 100-6 3 3 0 000 6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" /></svg>
		{/if}
	</span>
	<span class="side">
		<label class="pick" for={id}>{shown ? 'Ganti foto' : label}</label>
		<span class="name">{fileName || (current ? 'Foto sekarang' : 'Belum ada foto')}</span>
	</span>
	<input class="visually-hidden" {id} {name} type="file" accept="image/*" onchange={onChange} />
</div>

<style>
	.file {
		display: flex;
		align-items: center;
		gap: 14px;
	}
	.thumb {
		width: 72px;
		height: 72px;
		flex-shrink: 0;
		border-radius: 18px;
		background: var(--primary-soft);
		background-size: cover;
		background-position: center;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--ink);
	}
	.thumb.round {
		border-radius: 999px;
	}
	.side {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
		align-items: flex-start;
	}
	.pick {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding: 0 18px;
		border-radius: 999px;
		background: var(--ink);
		color: var(--on-ink);
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.15s ease;
	}
	.pick:active {
		transform: scale(0.97);
	}
	.file:focus-within .pick {
		outline: 3px solid var(--primary);
		outline-offset: 2px;
	}
	.name {
		font-size: 14px;
		color: var(--ink-soft);
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
