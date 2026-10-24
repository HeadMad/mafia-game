<script>
	import { onMount } from 'svelte';
	import gameState from '$state/gameState';
	import SetupScreen from './__components/SetupScreen';
	import GameScreen from './__components/GameScreen';

	onMount(() => {
		gameState.load();
	});
</script>

{#if gameState.setup}
	<SetupScreen />
{:else}
	<GameScreen />
{/if}
