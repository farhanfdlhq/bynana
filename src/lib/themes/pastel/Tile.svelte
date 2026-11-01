<script lang="ts">
	import { buyHref, imageSrc, rupiah, storeName, type PublicProduct } from '$lib/format';
	let { p, eager = false, index = 99 }: { p: PublicProduct; eager?: boolean; index?: number } = $props();
	const tints = ['var(--primary)', 'var(--accent)', 'var(--apricot)'];
	const tint = $derived(tints[p.number % 3]);
	const label = $derived(p.links.length > 1 ? `Pilih dari ${p.links.length} toko` : p.links.length ? `Beli di ${storeName(p.links[0].store)}` : '');
	const direct = $derived(p.links.length === 1);
</script>

<article class="tile" class:rise={index < 8} style:--d={index < 8 ? `${240 + index * 70}ms` : undefined}>
	<a class="pic" href="/{p.number}" style:background={tint} aria-label="Nomor {p.number}: {p.name}">
		{#if p.image}
			<img
				src={imageSrc(p.image, 400)}
				srcset="{imageSrc(p.image, 400)} 400w, {imageSrc(p.image, 800)} 800w"
				sizes="(min-width: 480px) 220px, 50vw"
				alt=""
				width="400"
				height="400"
				loading={eager ? 'eager' : 'lazy'}
				decoding="async"
			/>
		{/if}
	</a>
	<p class="num"><span class="visually-hidden">Nomor </span>{p.number}</p>
	<h3><a href="/{p.number}">{p.name}</a></h3>
	{#if p.price != null}<p class="price">{rupiah(p.price)}</p>{/if}
	{#if p.links.length}
		<a class="buy" href={buyHref(p)} rel={direct ? 'nofollow sponsored' : undefined}>{label}</a>
	{/if}
</article>

<style>
	.tile {
		background: var(--tile);
		border-radius: 26px;
		padding: 8px 8px 12px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 0;
	}
	.pic {
		display: block;
		aspect-ratio: 1;
		border-radius: 19px;
		overflow: hidden;
	}
	.pic img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.num {
		margin: 2px 6px 0;
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 20px;
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}
	h3 {
		margin: 0 6px;
		font-size: 16px;
		font-weight: 600;
		line-height: 1.25;
		flex-grow: 1;
	}
	h3 a {
		text-decoration: none;
	}
	h3 a:hover {
		text-decoration: underline;
	}
	.price {
		margin: -2px 6px 0;
		font-size: 15px;
	}
	.buy {
		margin: 2px 4px 0;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		min-height: 44px;
		padding: 6px 12px;
		border-radius: 999px;
		background: var(--ink);
		color: var(--on-ink);
		text-decoration: none;
		font-size: 14px;
		font-weight: 600;
		transition: transform 0.15s ease;
	}
	.buy:active {
		transform: scale(0.96);
	}
</style>
