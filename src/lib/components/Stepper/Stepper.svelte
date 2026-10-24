<script>
	/**
	 * @typedef {Object} Props
	 * @property {number} value
	 * @property {number} [min]
	 * @property {number} [max]
	 * @property {(v: number) => void} onchange
	 */

	/** @type {Props} */
	let { value = 1, min = 1, max = 20, onchange } = $props();

	function bump(dir) {
		const next = Math.max(min, Math.min(max, value + dir));
		onchange(next);
	}
</script>

<div class="stepper">
	<button type="button" class="stepper-btn" onclick={() => bump(-1)}>−</button>
	<span class="stepper-value">{value}</span>
	<button type="button" class="stepper-btn" onclick={() => bump(1)}>+</button>
</div>

<style>
	.stepper {
		display: flex;
		align-items: center;
	}

	.stepper-btn {
		width: 36px;
		height: 36px;
		border: none;
		border-radius: 10px;
		background: rgba(0, 122, 255, 0.12);
		color: var(--accent);
		font-size: 22px;
		font-weight: 500;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		user-select: none;
	}

	.stepper-btn:active {
		opacity: 0.6;
	}

	.stepper-value {
		width: 40px;
		text-align: center;
		font-size: 18px;
		font-weight: 600;
		color: var(--accent);
	}
</style>
