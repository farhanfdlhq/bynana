<script lang="ts">
	interface Props {
		id: string;
		name: string;
		autocomplete: 'current-password' | 'new-password';
		invalid?: boolean;
	}
	let { id, name, autocomplete, invalid = false }: Props = $props();
	let show = $state(false);
</script>

<div class="pw">
	<input {id} {name} type={show ? 'text' : 'password'} {autocomplete} autocapitalize="off" spellcheck="false" aria-invalid={invalid ? 'true' : undefined} />
	<button type="button" onclick={() => (show = !show)} aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'} aria-pressed={show} aria-controls={id}>
		<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
			<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
			<circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="2" />
			{#if show}<path d="M4 4l16 16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />{/if}
		</svg>
	</button>
</div>

<style>
	.pw {
		position: relative;
	}
	.pw input {
		padding-right: 58px;
	}
	button {
		position: absolute;
		top: 50%;
		right: 6px;
		transform: translateY(-50%);
		width: 44px;
		height: 44px;
		border: 0;
		border-radius: 999px;
		background: transparent;
		color: var(--ink);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}
	button:hover {
		background: rgba(0, 0, 0, 0.06);
	}
</style>
