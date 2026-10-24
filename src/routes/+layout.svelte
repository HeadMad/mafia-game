<script>
	import '$lib/css/tokens';
	import '$lib/css/resets';

	let { children } = $props();
</script>

<div id="app">
	{@render children()}
</div>

<style>
	:global(#app) {
		min-height: 100%;
		max-width: 480px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		position: relative;
	}
</style>
