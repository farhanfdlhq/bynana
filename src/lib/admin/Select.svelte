<script lang="ts">
	/** Dropdown bertema, pengganti <select> bawaan browser. Nilainya dikirim lewat input tersembunyi. */
	interface Option {
		value: string;
		label: string;
	}
	interface Props {
		id: string;
		name: string;
		options: Option[];
		value?: string;
		placeholder?: string;
		invalid?: boolean;
	}
	let { id, name, options, value = $bindable(''), placeholder = 'Pilih', invalid = false }: Props = $props();

	let open = $state(false);
	let active = $state(0);
	let root: HTMLDivElement;
	let list = $state<HTMLUListElement>();

	const selected = $derived(options.find((o) => o.value === value));

	function show() {
		open = true;
		active = Math.max(0, options.findIndex((o) => o.value === value));
		queueMicrotask(() => list?.querySelector<HTMLElement>(`#${id}-opt-${active}`)?.scrollIntoView({ block: 'nearest' }));
	}
	function pick(i: number) {
		value = options[i].value;
		open = false;
		root.querySelector('button')?.focus();
	}
	function onKey(e: KeyboardEvent) {
		if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
			e.preventDefault();
			show();
			return;
		}
		if (!open) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			open = false;
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			active = Math.min(options.length - 1, active + 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			active = Math.max(0, active - 1);
		} else if (e.key === 'Home') {
			e.preventDefault();
			active = 0;
		} else if (e.key === 'End') {
			e.preventDefault();
			active = options.length - 1;
		} else if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			pick(active);
		} else if (e.key === 'Tab') {
			open = false;
		}
		list?.querySelector<HTMLElement>(`#${id}-opt-${active}`)?.scrollIntoView({ block: 'nearest' });
	}
	function onWindowClick(e: MouseEvent) {
		if (open && !root.contains(e.target as Node)) open = false;
	}
</script>

<svelte:window onclick={onWindowClick} />

<div class="select" bind:this={root}>
	<input type="hidden" {name} {value} />
	<button
		{id}
		type="button"
		class="trigger"
		class:placeholder={!selected}
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-controls="{id}-list"
		class:invalid
		onclick={() => (open ? (open = false) : show())}
		onkeydown={onKey}
	>
		<span>{selected?.label ?? placeholder}</span>
		<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" class:flip={open}><path d="M6 9.5l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" /></svg>
	</button>
	{#if open}
		<ul bind:this={list} id="{id}-list" role="listbox" aria-labelledby={id} aria-activedescendant="{id}-opt-{active}" tabindex="-1">
			{#each options as o, i (o.value)}
				<li
					id="{id}-opt-{i}"
					role="option"
					aria-selected={o.value === value}
					class:active={i === active}
					onclick={() => pick(i)}
					onkeydown={() => {}}
					onmouseenter={() => (active = i)}
				>
					<span>{o.label}</span>
					{#if o.value === value}
						<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.select {
		position: relative;
	}
	.trigger {
		width: 100%;
		min-height: 52px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 12px 14px 12px 16px;
		border: 2px solid transparent;
		border-radius: 16px;
		background: var(--field);
		color: var(--ink);
		font: inherit;
		font-size: 16px;
		text-align: left;
		cursor: pointer;
	}
	:global([data-theme='pastel']) .trigger {
		background: #ffffff;
	}
	.trigger[aria-expanded='true'],
	.trigger:focus-visible {
		outline: none;
		border-color: var(--ink);
	}
	.trigger.invalid {
		border-color: var(--danger);
	}
	.trigger span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.trigger.placeholder span {
		color: var(--ink-soft);
	}
	svg {
		flex-shrink: 0;
		transition: transform 0.18s ease;
	}
	svg.flip {
		transform: rotate(180deg);
	}
	ul {
		position: absolute;
		z-index: 30;
		right: 0;
		min-width: max(100%, 220px);
		top: calc(100% + 6px);
		margin: 0;
		padding: 6px;
		list-style: none;
		max-height: 280px;
		overflow-y: auto;
		border-radius: 18px;
		background: var(--bg);
		box-shadow: 0 14px 36px rgba(0, 0, 0, 0.18);
		animation: drop 0.16s ease both;
	}
	li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		min-height: 44px;
		padding: 0 12px;
		border-radius: 12px;
		cursor: pointer;
		font-size: 16px;
	}
	li.active {
		background: var(--field);
	}
	li[aria-selected='true'] {
		font-weight: 700;
	}
	@keyframes drop {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
</style>
