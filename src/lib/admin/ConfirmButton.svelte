<script lang="ts">
	/** Tombol kirim yang meminta konfirmasi lewat dialog bertema, pengganti confirm() bawaan browser. */
	interface Props {
		label: string;
		title: string;
		message: string;
		confirmLabel?: string;
		class?: string;
	}
	let { label, title, message, confirmLabel = 'Hapus', class: cls = 'btn small danger' }: Props = $props();
	let dialog: HTMLDialogElement;
	let button: HTMLButtonElement;

	function ask(e: MouseEvent) {
		e.preventDefault();
		dialog.showModal();
	}
	function yes() {
		dialog.close();
		button.form?.requestSubmit();
	}
</script>

<button bind:this={button} type="submit" class={cls} onclick={ask}>{label}</button>
<dialog bind:this={dialog} aria-labelledby="dlg-title" onclick={(e) => e.target === dialog && dialog.close()}>
	<div class="box">
		<h2 id="dlg-title">{title}</h2>
		<p>{message}</p>
		<div class="row">
			<button type="button" class="btn" onclick={() => dialog.close()}>Batal</button>
			<button type="button" class="btn primary" onclick={yes}>{confirmLabel}</button>
		</div>
	</div>
</dialog>

<style>
	dialog {
		border: 0;
		padding: 0;
		border-radius: 28px;
		background: var(--bg);
		color: var(--ink);
		width: min(420px, calc(100vw - 32px));
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
	}
	dialog::backdrop {
		background: rgba(20, 20, 20, 0.45);
	}
	dialog[open] {
		animation: pop 0.22s cubic-bezier(0.2, 0.7, 0.2, 1) both;
	}
	.box {
		padding: 24px 20px 20px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	h2 {
		margin: 0;
		font-family: var(--font-display);
		font-weight: var(--display-weight);
		font-size: 22px;
		letter-spacing: -0.02em;
	}
	p {
		margin: 0 0 8px;
		line-height: 1.45;
	}
	.row {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px;
	}
	@keyframes pop {
		from {
			opacity: 0;
			transform: scale(0.96) translateY(8px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
</style>
