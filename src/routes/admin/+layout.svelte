<script lang="ts">
	import '$lib/admin/admin.css';
	import { page } from '$app/state';
	import Toaster from '$lib/admin/Toaster.svelte';
	let { children } = $props();

	const path = $derived(page.url.pathname);
	const isLogin = $derived(path === '/admin/masuk');
	const items = [
		{ href: '/admin/produk', label: 'Produk' },
		{ href: '/admin/kartu', label: 'Kartu' },
		{ href: '/admin/klik', label: 'Klik' },
		{ href: '/admin/atur', label: 'Atur' }
	];
	const isActive = (href: string) => path === href || (path.startsWith(href + '/') && !path.startsWith('/admin/produk/baru'));
</script>

<svelte:head>
	<meta name="robots" content="noindex, nofollow" />
	<link rel="manifest" href="/manifest.webmanifest" />
	<meta name="theme-color" content="#141414" />
</svelte:head>

<div class="admin">
	{@render children()}
	<Toaster />

	{#if !isLogin}
		<nav class="tabbar" aria-label="Menu admin">
			{#each items as it (it.href)}
				<a href={it.href} aria-current={isActive(it.href) ? 'page' : undefined}>{it.label}</a>
			{/each}
			<a class="add" href="/admin/produk/baru" aria-current={path.startsWith('/admin/produk/baru') ? 'page' : undefined}>Tambah</a>
		</nav>
	{/if}
</div>

<style>
	.tabbar {
		position: fixed;
		left: 12px;
		right: 12px;
		bottom: max(12px, env(safe-area-inset-bottom));
		max-width: 560px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 4px;
		padding: 6px;
		border-radius: 999px;
		background: var(--ink);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
		z-index: 10;
	}
	.tabbar a {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 48px;
		border-radius: 999px;
		color: var(--on-ink);
		text-decoration: none;
		font-size: 14px;
		font-weight: 600;
	}
	.tabbar a[aria-current='page'] {
		background: var(--primary);
		color: var(--ink);
	}
	.tabbar a.add {
		background: var(--bg);
		color: var(--ink);
		font-weight: 800;
	}
	.tabbar a.add[aria-current='page'] {
		background: var(--primary);
	}
</style>
