<script lang="ts">
	import { dismiss, toasts } from './toast.svelte';
</script>

<div class="toaster" role="status" aria-live="polite">
	{#each toasts as t (t.id)}
		<div class="toast {t.kind}">
			<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
				{#if t.kind === 'ok'}
					<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
				{:else}
					<path d="M12 7v6M12 17h.01" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" />
				{/if}
			</svg>
			<p>{t.text}</p>
			<button type="button" onclick={() => dismiss(t.id)} aria-label="Tutup notifikasi">
				<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" /></svg>
			</button>
		</div>
	{/each}
</div>

<style>
	.toaster {
		position: fixed;
		left: 12px;
		right: 12px;
		bottom: calc(max(12px, env(safe-area-inset-bottom)) + 72px);
		max-width: 456px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 8px;
		z-index: 20;
		pointer-events: none;
	}
	.toast {
		pointer-events: auto;
		display: grid;
		grid-template-columns: 22px minmax(0, 1fr) 36px;
		align-items: center;
		gap: 10px;
		padding: 8px 8px 8px 16px;
		border-radius: 20px;
		background: var(--accent);
		color: var(--ink);
		box-shadow: 0 10px 28px rgba(0, 0, 0, 0.16);
		animation: toast-in 0.28s cubic-bezier(0.2, 0.7, 0.2, 1) both;
	}
	.toast.error {
		background: var(--ink);
		color: var(--on-ink);
	}
	p {
		margin: 0;
		font-weight: 600;
		font-size: 15px;
		line-height: 1.35;
	}
	button {
		width: 36px;
		height: 36px;
		border: 0;
		border-radius: 999px;
		background: transparent;
		color: inherit;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}
	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
</style>
