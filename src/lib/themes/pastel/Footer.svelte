<script lang="ts">
	let { name, note = '' }: { name: string; note?: string } = $props();
</script>

<footer>
	<div class="wrap">
		{#if note.trim()}<p class="note">{note}</p>{/if}
		<p class="name" aria-hidden="true">{name}</p>
	</div>
</footer>

<style>
	footer {
		margin-top: 64px;
		padding: 0 16px 16px;
	}
	.wrap {
		background: var(--accent);
		border-radius: 32px;
		padding: 32px 22px 30px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.name {
		margin: 0;
		font-family: var(--font-display);
		font-weight: 700;
		letter-spacing: -0.04em;
		line-height: 0.9;
		font-size: clamp(48px, 15cqw, 76px);
	}
	.note {
		margin: 0;
		font-size: 16px;
		line-height: 1.5;
	}
</style>
