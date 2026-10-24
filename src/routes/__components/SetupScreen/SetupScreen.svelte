<script>
	import Stepper from '$components/Stepper';
	import gameState from '$state/gameState';

	let predators = $state(3);
	let peaceful = $state(5);
	let specials = $state({
		owl: true,
		spirit: true,
		eagle: true,
		fox: true,
		vole: true,
		gammarus: true,
		angara: true
	});

	const editing = $derived(gameState.editingSettings);

	$effect(() => {
		if (editing) {
			predators = gameState.config.predators;
			peaceful = gameState.config.peaceful;
			specials = {
				owl: gameState.owlEnabled,
				spirit: !!gameState.config.specials.spirit,
				eagle: !!gameState.config.specials.eagle,
				fox: !!gameState.config.specials.fox,
				vole: gameState.voleEnabled,
				gammarus: !!gameState.config.specials.gammarus,
				angara: !!gameState.config.specials.angara
			};
		}
	});

	const total = $derived(
		predators +
			peaceful +
			Object.values(specials).filter(Boolean).length
	);

	function submit() {
		const cfg = {
			predators,
			peaceful,
			owlEnabled: specials.owl,
			voleEnabled: specials.vole,
			specials: {
				spirit: specials.spirit,
				eagle: specials.eagle,
				fox: specials.fox,
				vole: specials.vole,
				gammarus: specials.gammarus,
				angara: specials.angara
			}
		};
		if (editing) gameState.updateSettings(cfg);
		else gameState.createGame(cfg);
	}
</script>

<section class="setup">
	<header class="setup-header">
		<h1>Байкальская Мафия</h1>
		<p class="subtitle">{editing ? 'Настройки партии' : 'Настройка партии'}</p>
	</header>

	<div class="setup-body">
		<div class="input-row">
			<span>Рядовые Хищники</span>
			<Stepper value={predators} min={1} max={12} onchange={(v) => (predators = v)} />
		</div>
		<div class="input-row">
			<span>Рядовые Мирные</span>
			<Stepper value={peaceful} min={1} max={20} onchange={(v) => (peaceful = v)} />
		</div>

		<div class="section-title">Особые персонажи</div>
		<div class="checkboxes">
			{#each [
				{ key: 'owl', label: '🦉 Сова' },
				{ key: 'spirit', label: '👻 Дух Байкала' },
				{ key: 'eagle', label: '🦅 Орлан-Белохвост' },
				{ key: 'fox', label: '🦊 Лиса' },
				{ key: 'vole', label: '🐭 Ольхонская Полевка' },
				{ key: 'gammarus', label: '🦐 Гамарус' },
				{ key: 'angara', label: '🌊 Ангара' }
			] as item}
				<div class="checkbox-item">
					<input
						type="checkbox"
						checked={specials[item.key]}
						onchange={() => {
							specials = { ...specials, [item.key]: !specials[item.key] };
						}}
					/>
					<span class="check-label">{item.label}</span>
				</div>
			{/each}
		</div>

		<div class="total-row">
			<span>Всего карт в колоде</span>
			<strong>{total}</strong>
		</div>
	</div>

	<div class="setup-footer">
		<button type="button" class="primary-btn" class:secondary={editing} onclick={submit}>
			{editing ? 'Назад к игре' : 'Создать партию'}
		</button>
	</div>
</section>

<style>
	.setup {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 100%;
		padding: 16px 16px 0;
		padding-top: max(16px, env(safe-area-inset-top));
	}

	.setup-header {
		text-align: center;
		margin-bottom: 24px;
		padding-top: 4px;
	}
	.setup-header h1 {
		font-size: 26px;
		font-weight: 700;
		letter-spacing: -0.4px;
		margin-bottom: 4px;
	}
	.subtitle {
		color: var(--text-secondary);
		font-size: 15px;
	}

	.setup-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 14px;
		overflow-y: auto;
		padding-bottom: 12px;
	}

	.input-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: var(--surface);
		border-radius: var(--radius);
		padding: 10px 12px 10px 16px;
		font-size: 16px;
		font-weight: 500;
	}

	.section-title {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.4px;
		margin-top: 4px;
		margin-bottom: -4px;
		padding-left: 2px;
	}

	.checkboxes {
		background: var(--surface);
		border-radius: var(--radius);
		overflow: hidden;
	}
	.checkbox-item {
		display: flex;
		align-items: center;
		padding: 13px 16px;
		border-bottom: 0.5px solid rgba(0, 0, 0, 0.06);
		cursor: pointer;
		user-select: none;
	}
	.checkbox-item:last-child {
		border-bottom: none;
	}
	.checkbox-item input {
		width: 20px;
		height: 20px;
		margin-right: 12px;
		accent-color: var(--accent);
	}
	.check-label {
		font-size: 16px;
		font-weight: 500;
	}

	.total-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 14px 16px;
		background: var(--surface);
		border-radius: var(--radius);
		font-size: 16px;
	}
	.total-row strong {
		font-size: 22px;
		font-weight: 700;
		color: var(--accent);
	}

	.setup-footer {
		flex-shrink: 0;
		padding: 12px 0 max(16px, env(safe-area-inset-bottom));
		background: var(--bg);
		position: sticky;
		bottom: 0;
	}
	.primary-btn {
		display: block;
		width: 100%;
		padding: 16px;
		background: var(--accent);
		color: #fff;
		border: none;
		border-radius: 14px;
		font-size: 17px;
		font-weight: 600;
	}
	.primary-btn.secondary {
		background: rgba(0, 0, 0, 0.08);
		color: var(--text);
	}
	.primary-btn:active {
		opacity: 0.7;
	}
</style>
