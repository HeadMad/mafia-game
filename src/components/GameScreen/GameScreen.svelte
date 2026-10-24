<script>
	import PlayerRow from '$components/PlayerRow';
	import ConfirmModal from '$components/ConfirmModal';
	import gameState from '$state/gameState';
	import roleMeta from '$js/roleMeta';
	import charDesc from '$js/charDesc';
	import { phaseShort, phaseSpeechText, phaseActionInfo } from '$js/phaseHelpers';

	let menuOpen = $state(false);
	let modal = $state(/** @type {{ open: boolean, title: string, body: string }} */ ({
		open: false,
		title: '',
		body: ''
	}));
	let accOpen = $state(/** @type {Record<number, boolean>} */ ({}));

	const phase = $derived(gameState.currentPhase());
	const isNight = $derived(gameState.isNightPhase());
	const speech = $derived(phaseSpeechText(phase, gameState.owlEnabled));
	const actionInfo = $derived(phaseActionInfo(phase));
	const morningText = $derived(phase === 'morning' ? gameState.buildMorningSummary() : '');

	function poolIcons() {
		if (phase === 'day') return [];
		if (phase === 'predators') {
			const n = gameState.pool.predators || 0;
			return Array.from({ length: n }, () => '🐾');
		}
		const n = gameState.pool[phase] || 0;
		const icon = roleMeta[phase]?.icon || '❓';
		return Array.from({ length: n }, () => icon);
	}

	function canChangeRole(player) {
		if (!player.role) return true;
		if (!isNight) return false;
		if (phase === 'predators') return player.role === 'predator' || player.role === 'owl';
		return player.role === phase;
	}

	function isHighlight(player) {
		if (!isNight || !player.alive) return false;
		if (phase === 'predators') return player.role === 'predator' || player.role === 'owl';
		return player.role === phase;
	}

	async function onNewGame() {
		menuOpen = false;
		const res = await gameState.showConfirm('Завершить текущую игру и начать новую?', {
			okText: 'Новая игра',
			danger: true,
			checkboxLabel: 'Сохранить имена',
			checkboxDefault: true
		});
		if (res.ok) gameState.resetToNewGame(res.checked);
	}

	function openModal(title, body) {
		menuOpen = false;
		modal = { open: true, title, body };
	}

	/** @param {MouseEvent} e */
	function onDocPointerDown(e) {
		if (!menuOpen) return;
		const t = /** @type {HTMLElement} */ (e.target);
		if (t.closest('.menu-wrap')) return;
		menuOpen = false;
	}
</script>

<svelte:window onpointerdown={onDocPointerDown} />

<section class="game">
	<header class="game-header">
		<div class="round-info">
			<span class="round-label">Круг {gameState.round}</span>
			<span
				class="phase-badge"
				class:night={isNight}
				class:morning={phase === 'morning'}
				class:day={phase === 'day'}
			>
				{phaseShort(phase)}
			</span>
		</div>
		<div class="menu-wrap">
			<button type="button" class="menu-btn" onclick={(e) => { e.stopPropagation(); menuOpen = !menuOpen; }}>☰</button>
			{#if menuOpen}
				<div class="menu-popover" role="menu">
			<button type="button" class="menu-item danger" onclick={onNewGame}>Новая игра</button>
			<button
				type="button"
				class="menu-item"
				onclick={() =>
					openModal(
						'Как пользоваться',
						'<p><b>Роли.</b> Короткий тап по аватарке выдаёт роль. Снять — снова тап в ход этой роли.</p><p><b>Сова.</b> Долгий тап на хищника → Сова (🦉). Можно переназначать.</p><p><b>Полёвка.</b> Долгий тап на мирного/скрытого. Можно переназначать.</p><p><b>Действия.</b> Тап по карточке вешает бейдж. Один на фазу.</p>'
					)}
			>
				Как пользоваться
			</button>
			<button
				type="button"
				class="menu-item"
				onclick={() =>
					openModal(
						'Правила',
						'<p><b>Цель мирных:</b> изгнать всех хищников (и Гамаруса).</p><p><b>Победа мирных:</b> не осталось хищников и Гамаруса.</p><p><b>Сова:</b> в финале 1 хищник + 1 сова — победа Совы.</p>'
					)}
			>
				Правила
			</button>
			<button
				type="button"
				class="menu-item"
				onclick={() => {
					menuOpen = false;
					modal = { open: true, title: 'Персонажи', body: 'chars' };
				}}
			>
				Персонажи
			</button>
			<button
				type="button"
				class="menu-item"
				onclick={() => {
					menuOpen = false;
					gameState.editingSettings = true;
					gameState.setup = true;
				}}
			>
				Настройки
			</button>
			<button
				type="button"
				class="menu-item"
				onclick={() =>
					openModal(
						'Лог партии',
						`<div class="log-box">${gameState.log.length ? gameState.log.join('\n') : 'Пока пусто'}</div>`
					)}
			>
				Лог партии
			</button>
				</div>
			{/if}
		</div>
	</header>

	{#if gameState.gameOver}
		<div class="win-banner">
			<h3>{gameState.gameOver.text}</h3>
			<p>{gameState.gameOver.sub}</p>
		</div>
	{:else if gameState.intermission}
		<div class="intermission">
			<div class="intermission-card">
				<p class="intermission-kicker">Промежуточные итоги</p>
				<h2>Круг {gameState.intermission.toRound}</h2>
				<div class="intermission-text">{gameState.intermission.lines.join('\n')}</div>
				<button
					type="button"
					class="intermission-btn"
					onclick={() => gameState.continueFromIntermission()}
				>
					Продолжить
				</button>
			</div>
		</div>
	{:else}
		{#if speech}
			<div class="phase-speech">{speech}</div>
		{/if}

		{#if isNight || phase === 'day'}
			<div class="phase-sticky">
				<div class="phase-panel">
					<div class="pool-avatars">
						{#each poolIcons() as icon, i (i)}
							<div class="pool-avatar">{icon}</div>
						{:else}
							<div class="pool-avatar empty">—</div>
						{/each}
					</div>
					<div class="phase-action">
						<span class="phase-action-text">{actionInfo.text}</span>
						<span
							class="action-badge {actionInfo.cls}"
							class:used={gameState.badgeUsed[phase]}
						>
							{actionInfo.badge}
						</span>
					</div>
				</div>
			</div>
		{/if}

		{#if phase === 'morning'}
			<div class="morning-panel">
				<div class="morning-text">{morningText}</div>
			</div>
		{/if}
	{/if}

	{#if !gameState.intermission && !gameState.gameOver}
	<div class="players-wrap">
		<div class="players-list">
			{#each gameState.players as player (player.id)}
				<PlayerRow
					{player}
					highlight={isHighlight(player)}
					avatarLocked={!!player.role && !canChangeRole(player)}
					onavatar={() => gameState.assignRoleFromPool(player.id)}
					onlongpress={() => gameState.longPressPlayer(player.id)}
					onrow={() => gameState.applyBadge(player.id)}
					onbadge={(type) => gameState.removeBadge(player.id, type)}
					onrename={(name) => gameState.renamePlayer(player.id, name)}
				/>
			{/each}
		</div>
	</div>
	{/if}

	{#if !gameState.gameOver && !gameState.intermission}
		<div class="nav-bar">
			<button
				type="button"
				class="nav-btn"
				disabled={gameState.phaseIndex === 0 && gameState.round === 1}
				onclick={() => gameState.prevPhase()}
			>
				← Назад
			</button>
			<button type="button" class="nav-btn primary" onclick={() => gameState.nextPhase()}>
				Далее →
			</button>
		</div>
	{/if}
</section>

{#if modal.open}
	<div
		class="modal-overlay"
		role="presentation"
		onclick={(e) => {
			if (e.target === e.currentTarget) modal = { ...modal, open: false };
		}}
	>
		<div class="modal-sheet">
			<div class="modal-header">
				<h2>{modal.title}</h2>
				<button type="button" class="modal-close" onclick={() => (modal = { ...modal, open: false })}
					>✕</button
				>
			</div>
			<div class="modal-body">
				{#if modal.body === 'chars'}
					{#each charDesc as c, idx}
						<div class="acc-item" class:open={accOpen[idx]}>
							<button
								type="button"
								class="acc-head"
								onclick={() => (accOpen = { ...accOpen, [idx]: !accOpen[idx] })}
							>
								<span><span class="icon">{c.icon}</span> {c.name}</span>
								<span class="acc-chevron">▼</span>
							</button>
							{#if accOpen[idx]}
								<div class="acc-body">{c.text}</div>
							{/if}
						</div>
					{/each}
				{:else}
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html modal.body}
				{/if}
			</div>
		</div>
	</div>
{/if}

<ConfirmModal
	open={gameState.confirm.open}
	message={gameState.confirm.message}
	okText={gameState.confirm.okText}
	cancelText={gameState.confirm.cancelText}
	danger={gameState.confirm.danger}
	alertOnly={gameState.confirm.alertOnly}
	checkboxLabel={gameState.confirm.checkboxLabel}
	checkboxDefault={gameState.confirm.checkboxDefault}
	onresolve={(v) => gameState.closeConfirm(v)}
/>

<style>
	.game {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 100%;
		padding: 16px 16px 0;
		padding-top: max(16px, env(safe-area-inset-top));
		overflow: visible;
	}

	.game-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
	}
	.round-info {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.round-label {
		font-size: 20px;
		font-weight: 700;
	}
	.phase-badge {
		font-size: 12px;
		font-weight: 600;
		padding: 4px 10px;
		border-radius: 20px;
		background: rgba(0, 0, 0, 0.06);
		color: var(--text-secondary);
	}
	.phase-badge.night {
		background: rgba(0, 122, 255, 0.12);
		color: var(--accent);
	}
	.phase-badge.morning {
		background: rgba(255, 149, 0, 0.15);
		color: #ff9500;
	}
	.phase-badge.day {
		background: rgba(52, 199, 89, 0.15);
		color: var(--peaceful);
	}

	.menu-wrap {
		position: relative;
		flex-shrink: 0;
	}

	.menu-btn {
		background: rgba(0, 0, 0, 0.05);
		border: none;
		width: 36px;
		height: 36px;
		border-radius: 10px;
		font-size: 18px;
		color: var(--text);
	}

	.menu-popover {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		background: var(--surface);
		border-radius: 14px;
		min-width: 220px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
		overflow: hidden;
		z-index: 120;
	}
	.menu-item {
		display: block;
		width: 100%;
		text-align: left;
		padding: 14px 18px;
		border: none;
		background: none;
		font-size: 16px;
		font-weight: 500;
		color: var(--text);
		border-bottom: 0.5px solid rgba(0, 0, 0, 0.06);
	}
	.menu-item:last-child {
		border-bottom: none;
	}
	.menu-item.danger {
		color: var(--predator);
	}

	.win-banner {
		background: var(--surface);
		border-radius: var(--radius);
		padding: 20px 16px;
		margin-bottom: 10px;
		text-align: center;
		box-shadow: 0 0 0 2px rgba(52, 199, 89, 0.35);
	}
	.win-banner h3 {
		font-size: 22px;
		font-weight: 800;
		margin-bottom: 8px;
		color: var(--peaceful);
	}
	.win-banner p {
		font-size: 14px;
		color: var(--text-secondary);
	}

	.phase-speech {
		font-size: 14px;
		line-height: 1.45;
		background: var(--surface);
		border-radius: var(--radius);
		padding: 12px 14px;
		margin-bottom: 10px;
	}

	.phase-sticky {
		position: sticky;
		top: 0;
		z-index: 40;
		background: var(--bg);
		padding: 8px 0 10px;
		margin: 0 -4px;
		padding-left: 4px;
		padding-right: 4px;
		border-bottom: 0.5px solid rgba(0, 0, 0, 0.06);
	}

	.phase-panel {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 4px 0;
	}
	.pool-avatars {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
		flex: 1;
		min-height: 36px;
	}
	.pool-avatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.04);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 18px;
	}
	.pool-avatar.empty {
		opacity: 0.25;
	}
	.phase-action {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 4px;
	}
	.phase-action-text {
		font-size: 12px;
		color: var(--text-secondary);
		font-weight: 500;
	}
	.action-badge {
		font-size: 13px;
		font-weight: 700;
		padding: 5px 12px;
		border-radius: 20px;
		color: #fff;
	}
	.action-badge.attack {
		background: var(--predator);
	}
	.action-badge.protect {
		background: var(--spirit);
		color: #003a4a;
	}
	.action-badge.check {
		background: var(--eagle);
		color: #3a1f00;
	}
	.action-badge.mute {
		background: var(--mute);
		color: #3a2e00;
	}
	.action-badge.clean {
		background: var(--gammarus);
		color: #003a4a;
	}
	.action-badge.gift {
		background: var(--angara);
	}
	.action-badge.exile {
		background: var(--exile);
	}
	.action-badge.used {
		opacity: 0.3;
		filter: grayscale(0.8);
	}

	.morning-panel {
		background: var(--surface);
		border-radius: var(--radius);
		padding: 14px;
		margin-bottom: 10px;
	}
	.morning-text {
		font-size: 14px;
		line-height: 1.5;
		white-space: pre-wrap;
	}

	.players-wrap {
		flex: 1;
		overflow-y: auto;
		overflow-x: visible;
		padding-bottom: calc(var(--nav-h) + env(safe-area-inset-bottom) + 8px);
		/* место под outline карточек */
		padding-left: 3px;
		padding-right: 3px;
		margin-left: -3px;
		margin-right: -3px;
	}
	.players-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
		overflow: visible;
		padding-top: 6px;
		padding-bottom: 6px;
	}

	.intermission {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px 8px calc(var(--nav-h) + 24px);
	}
	.intermission-card {
		width: 100%;
		background: var(--surface);
		border-radius: 16px;
		padding: 24px 20px 20px;
		text-align: center;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
	}
	.intermission-kicker {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.4px;
		margin-bottom: 8px;
	}
	.intermission-card h2 {
		font-size: 26px;
		font-weight: 800;
		letter-spacing: -0.4px;
		margin-bottom: 16px;
	}
	.intermission-text {
		font-size: 15px;
		line-height: 1.55;
		color: var(--text);
		white-space: pre-wrap;
		text-align: left;
		margin-bottom: 20px;
	}
	.intermission-btn {
		display: block;
		width: 100%;
		padding: 16px;
		border: none;
		border-radius: 14px;
		background: var(--accent);
		color: #fff;
		font-size: 17px;
		font-weight: 600;
	}
	.intermission-btn:active {
		opacity: 0.75;
	}

	.nav-bar {
		position: fixed;
		left: 50%;
		transform: translateX(-50%);
		bottom: 0;
		width: 100%;
		max-width: 480px;
		display: flex;
		gap: 10px;
		padding: 10px 16px max(12px, env(safe-area-inset-bottom));
		background: rgba(245, 245, 247, 0.92);
		backdrop-filter: blur(12px);
		border-top: 0.5px solid rgba(0, 0, 0, 0.06);
		z-index: 50;
	}
	.nav-btn {
		flex: 1;
		padding: 14px;
		border: none;
		border-radius: 12px;
		font-size: 16px;
		font-weight: 600;
		background: rgba(0, 0, 0, 0.05);
		color: var(--text);
	}
	.nav-btn.primary {
		background: var(--accent);
		color: #fff;
	}
	.nav-btn:disabled {
		opacity: 0.35;
		pointer-events: none;
	}

	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: 110;
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}
	.modal-sheet {
		background: var(--bg);
		border-radius: 16px 16px 0 0;
		width: 100%;
		max-width: 480px;
		max-height: 85vh;
		display: flex;
		flex-direction: column;
		padding-bottom: env(safe-area-inset-bottom);
	}
	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 16px 12px;
	}
	.modal-header h2 {
		font-size: 18px;
		font-weight: 700;
	}
	.modal-close {
		background: rgba(0, 0, 0, 0.06);
		border: none;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		font-size: 16px;
		color: var(--text-secondary);
	}
	.modal-body {
		padding: 0 16px 20px;
		overflow-y: auto;
		font-size: 15px;
		line-height: 1.55;
	}
	.modal-body :global(.log-box) {
		background: #1c1c1e;
		color: #e5e5ea;
		border-radius: var(--radius);
		padding: 12px 14px;
		font-family: 'SF Mono', Menlo, Consolas, monospace;
		font-size: 12px;
		line-height: 1.55;
		white-space: pre-wrap;
		max-height: 50vh;
		overflow-y: auto;
	}

	.acc-item {
		background: var(--surface);
		border-radius: var(--radius);
		margin-bottom: 8px;
		overflow: hidden;
	}
	.acc-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: 14px 16px;
		border: none;
		background: none;
		font-weight: 600;
		font-size: 15px;
		text-align: left;
		color: var(--text);
	}
	.acc-chevron {
		color: var(--text-secondary);
		font-size: 12px;
	}
	.acc-item.open .acc-chevron {
		transform: rotate(180deg);
	}
	.acc-body {
		padding: 0 16px 14px;
		font-size: 14px;
		line-height: 1.5;
		color: var(--text-secondary);
	}
</style>
