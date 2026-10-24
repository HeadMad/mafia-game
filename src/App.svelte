<script>
	import { onMount } from 'svelte';
	import gameState from '$state/gameState';
	import SetupScreen from './components/SetupScreen';
	import GameScreen from './components/GameScreen';

	onMount(() => {
		gameState.load();
	});
</script>

<div class="app-root">
	{#if gameState.setup}
		<SetupScreen />
	{:else}
		<GameScreen />
	{/if}
</div>

<style>
	:global(html),
	:global(body),
	:global(#app) {
		height: 100%;
	}

	.app-root {
		min-height: 100%;
		max-width: 480px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		position: relative;
	}
</style>
