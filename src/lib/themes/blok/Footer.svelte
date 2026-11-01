<script lang="ts">
	let { name }: { name: string } = $props();
</script>

<footer>
	<div class="wrap">
		<p class="note">
			Link di halaman ini adalah link affiliate. Kalau kamu belanja lewat link ini, aku dapat komisi kecil dari toko, dan harga untukmu tetap
			sama.
		</p>
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
		max-width: 1200px;
		margin: 0 auto;
		padding: 40px 16px 0;
	}
	.note {
		margin: 0;
		max-width: 560px;
		font-size: 16px;
		line-height: 1.5;
	}
	.name {
		margin: 32px 0 -0.18em;
		font-family: var(--font-display);
		font-weight: 800;
		letter-spacing: -0.06em;
		line-height: 0.85;
		font-size: clamp(88px, 27vw, 300px);
		color: var(--primary);
	}
	@media (min-width: 720px) {
		.wrap {
			padding: 56px 32px 0;
		}
	}
</style>
