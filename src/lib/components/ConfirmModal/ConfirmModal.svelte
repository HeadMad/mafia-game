<script>
	/**
	 * @typedef {Object} Props
	 * @property {boolean} open
	 * @property {string} message
	 * @property {string} [okText]
	 * @property {string} [cancelText]
	 * @property {boolean} [danger]
	 * @property {boolean} [alertOnly]
	 * @property {(v: boolean) => void} onresolve
	 */

	/** @type {Props} */
	let {
		open = false,
		message = '',
		okText = 'ОК',
		cancelText = 'Отмена',
		danger = false,
		alertOnly = false,
		onresolve
	} = $props();
</script>

{#if open}
	<div
		class="confirm-overlay"
		role="presentation"
		onclick={(e) => {
			if (e.target === e.currentTarget) onresolve(false);
		}}
	>
		<div class="confirm-card" role="dialog" aria-modal="true">
			<p>{message}</p>
			<div class="confirm-actions">
				{#if !alertOnly}
					<button type="button" class="confirm-cancel" onclick={() => onresolve(false)}>
						{cancelText}
					</button>
				{/if}
				<button
					type="button"
					class="confirm-ok"
					class:danger
					onclick={() => onresolve(true)}
				>
					{okText}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.confirm-overlay {
		position: fixed;
		inset: 0;
		z-index: 200;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
		background: rgba(0, 0, 0, 0.25);
	}

	.confirm-card {
		background: var(--surface);
		border-radius: 16px;
		width: 100%;
		max-width: 300px;
		padding: 22px 20px 16px;
		text-align: center;
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
	}

	.confirm-card p {
		font-size: 16px;
		font-weight: 500;
		line-height: 1.45;
		color: var(--text);
		margin-bottom: 18px;
		white-space: pre-wrap;
	}

	.confirm-actions {
		display: flex;
		gap: 10px;
	}

	.confirm-actions button {
		flex: 1;
		padding: 12px 10px;
		border: none;
		border-radius: 12px;
		font-size: 16px;
		font-weight: 600;
	}

	.confirm-cancel {
		background: rgba(0, 0, 0, 0.06);
		color: var(--text);
	}

	.confirm-ok {
		background: var(--accent);
		color: #fff;
	}

	.confirm-ok.danger {
		background: var(--predator);
	}

	.confirm-actions button:active {
		opacity: 0.75;
	}
</style>
