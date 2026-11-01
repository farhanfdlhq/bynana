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
		margin-top: 72px;
		background: var(--ink);
		color: var(--on-ink);
		overflow: hidden;
	}
	.wrap {
		padding: 40px 20px 28px;
	}
	.note {
		margin: 0;
		font-size: 16px;
		line-height: 1.5;
	}
	.name {
		margin: 28px 0 0;
		font-family: var(--font-display);
		font-weight: 800;
		letter-spacing: -0.05em;
		line-height: 1;
		font-size: clamp(64px, 22cqw, 110px);
		color: var(--primary);
	}
</style>
