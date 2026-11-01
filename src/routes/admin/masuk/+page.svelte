<script lang="ts">
	import PasswordInput from '$lib/admin/PasswordInput.svelte';
	import Mark from '$lib/components/Mark.svelte';
	let { form } = $props();
</script>

<svelte:head><title>Masuk · admin bynana</title></svelte:head>

<main class="admin-wrap login">
	<p class="brand" aria-hidden="true"><Mark size={64} />bynana</p>
	<h1>Masuk ke admin</h1>
	<form method="post" class="stack" novalidate>
		{#if form?.message}<p class="notice error" role="alert">{form.message}</p>{/if}
		<div class="field">
			<label for="email">Email</label>
			<input id="email" name="email" type="email" inputmode="email" autocomplete="username" autocapitalize="off" value={form?.email ?? ''} />
		</div>
		<div class="field">
			<label for="password">Password</label>
			<PasswordInput id="password" name="password" autocomplete="current-password" />
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
		display: flex;
		align-items: center;
		gap: 12px;
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
