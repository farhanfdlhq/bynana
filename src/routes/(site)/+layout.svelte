<script lang="ts">
	let { children } = $props();
</script>

<div class="shell">
	<div class="screen">
		{@render children()}
	</div>
</div>
