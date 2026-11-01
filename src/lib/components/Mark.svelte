<script lang="ts">
	/** Logo bynana: dua huruf n dari "nana" yang makin tinggi, ditutup titik seperti "no.". */
	let { size = 32, dot = 'var(--primary)', label = '' }: { size?: number; dot?: string; label?: string } = $props();
</script>

<svg viewBox="0 0 100 100" width={size} height={size} role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : 'true'}>
	<path d="M14 84V58a16 16 0 0 1 32 0v26M46 84V40a16 16 0 0 1 32 0v44" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
	<circle cx="91" cy="84" r="6.5" fill={dot} />
</svg>
