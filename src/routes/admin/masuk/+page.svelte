<script lang="ts">
	let { form } = $props();
</script>

<svelte:head><title>Masuk · admin bynana</title></svelte:head>

<main class="admin-wrap login">
	<p class="brand" aria-hidden="true">bynana</p>
	<h1>Masuk ke admin</h1>
	<form method="post" class="stack">
		{#if form?.message}<p class="notice error" role="alert">{form.message}</p>{/if}
		<div class="field">
			<label for="email">Email</label>
			<input id="email" name="email" type="email" autocomplete="username" required value={form?.email ?? ''} />
		</div>
		<div class="field">
			<label for="password">Password</label>
			<input id="password" name="password" type="password" autocomplete="current-password" required />
		</div>
		<button class="btn primary block" type="submit">Masuk</button>
		<p class="muted">Lupa password? Minta pemilik server menjalankan <code>npm run admin -- reset</code> di terminal.</p>
	</form>
</main>

<style>
	.login {
		max-width: 440px;
		padding-top: 48px;
	}
	.brand {
		margin: 0;
		font-family: var(--font-display);
		font-weight: var(--display-weight);
		letter-spacing: var(--display-track);
		font-size: 64px;
		line-height: 0.9;
	}
	code {
		font-size: 14px;
	}
</style>
