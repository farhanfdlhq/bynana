<script lang="ts">
	import { goHref, imageSrc, rupiah, storeName, type PublicProduct } from '$lib/format';
	let { p, eager = false, index = 99 }: { p: PublicProduct; eager?: boolean; index?: number } = $props();
	const tints = ['var(--primary-soft)', 'var(--accent-soft)', 'var(--field)'];
	const tint = $derived(tints[p.number % 3]);
</script>

<article class="tile" class:rise={index < 8} style:--d={index < 8 ? `${200 + index * 70}ms` : undefined}>
	<a class="pic" href="/{p.number}" style:background={tint} aria-label="Nomor {p.number}: {p.name}">
		{#if p.image}
			<img
				src={imageSrc(p.image, 400)}
				srcset="{imageSrc(p.image, 400)} 400w, {imageSrc(p.image, 800)} 800w"
				sizes="(min-width: 900px) 240px, 50vw"
				alt=""
				width="400"
				height="400"
				loading={eager ? 'eager' : 'lazy'}
				decoding="async"
			/>
		{/if}
		<span class="num">{p.number}</span>
	</a>
	<h3><a href="/{p.number}">{p.name}</a></h3>
	{#if p.price != null}<p class="price">{rupiah(p.price)}</p>{/if}
	<div class="stores">
		{#each p.links as l, i (l.store + i)}
			<a class="store" class:main={i === 0} href={goHref(p.number, l.store)} rel="nofollow sponsored">{storeName(l.store)}</a>
		{/each}
	</div>
</article>

<style>
	.tile {
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 0;
	}
	.pic {
		position: relative;
		display: block;
		aspect-ratio: 1;
		border-radius: 22px;
		overflow: hidden;
	}
	.pic img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.num {
		position: absolute;
		left: 10px;
		bottom: 10px;
		background: var(--ink);
		color: var(--on-ink);
		font-weight: 800;
		font-size: 20px;
		line-height: 1;
		padding: 7px 11px;
		border-radius: 999px;
		font-variant-numeric: tabular-nums;
	}
	h3 {
		margin: 2px 0 0;
		font-size: 16px;
		font-weight: 600;
		line-height: 1.25;
	}
	h3 a {
		text-decoration: none;
	}
	h3 a:hover {
		text-decoration: underline;
	}
	.price {
		margin: 0;
		font-size: 16px;
	}
	.stores {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.store {
		text-decoration: none;
		background: var(--field);
		font-size: 15px;
		font-weight: 600;
		padding: 10px 12px;
		border-radius: 999px;
		min-height: 40px;
		display: inline-flex;
		align-items: center;
		transition: transform 0.15s ease;
	}
	.store.main {
		background: var(--primary);
	}
	.store:active {
		transform: scale(0.96);
	}
</style>
