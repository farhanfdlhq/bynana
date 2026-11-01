<script lang="ts">
	interface Props {
		title: string;
		description: string;
		origin: string;
		path: string;
		image?: string;
		imageAlt?: string;
		noindex?: boolean;
		jsonLd?: Record<string, unknown> | null;
		type?: 'website' | 'product' | 'profile';
	}
	let { title, description, origin, path, image = '/og.png', imageAlt = 'bynana', noindex = false, jsonLd = null, type = 'website' }: Props = $props();

	const canonical = $derived(origin + path);
	const imageUrl = $derived(image.startsWith('http') ? image : origin + image);
	const ld = $derived(jsonLd ? JSON.stringify(jsonLd).replace(/</g, '\\u003c') : '');
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	{#if noindex}<meta name="robots" content="noindex, follow" />{/if}
	<meta property="og:site_name" content="bynana" />
	<meta property="og:locale" content="id_ID" />
	<meta property="og:type" content={type === 'product' ? 'product' : type === 'profile' ? 'profile' : 'website'} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={imageUrl} />
	<meta property="og:image:alt" content={imageAlt} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={imageUrl} />
	{#if ld}
		{@html `<script type="application/ld+json">${ld}</script>`}
	{/if}
</svelte:head>
