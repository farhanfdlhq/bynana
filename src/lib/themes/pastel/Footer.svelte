<script lang="ts">
	let { name }: { name: string } = $props();
</script>

<footer>
	<div class="wrap">
		<p class="name" aria-hidden="true">{name}</p>
		<p class="note">
			Link di halaman ini adalah link affiliate. Kalau kamu belanja lewat link ini, aku dapat komisi kecil dari toko, dan harga untukmu tetap
			sama.
		</p>
	</div>
</footer>

<style>
	footer {
		margin-top: 64px;
		padding: 0 12px 12px;
	}
	.wrap {
		max-width: 1200px;
		margin: 0 auto;
		background: var(--accent);
		border-radius: 32px;
		padding: 32px 20px 28px;
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
		font-size: clamp(56px, 17vw, 200px);
	}
	.note {
		margin: 0;
		max-width: 560px;
		font-size: 16px;
		line-height: 1.5;
	}
	@media (min-width: 720px) {
		footer {
			padding: 0 32px 32px;
		}
		.wrap {
			max-width: 1136px;
			padding: 48px 40px 40px;
		}
	}
</style>
