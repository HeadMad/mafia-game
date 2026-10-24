<script>
	import roleMeta from '$js/roleMeta';
	import badgeMeta from '$js/badgeMeta';

	/**
	 * @typedef {Object} Player
	 * @property {number} id
	 * @property {string} name
	 * @property {string|null} role
	 * @property {boolean} alive
	 * @property {Array<{type: string, round: number}>} badges
	 * @property {string|null} faction
	 */

	/**
	 * @typedef {Object} Props
	 * @property {Player} player
	 * @property {boolean} [highlight]
	 * @property {boolean} [avatarLocked]
	 * @property {() => void} onavatar
	 * @property {() => void} onlongpress
	 * @property {() => void} onrow
	 * @property {(type: string) => void} onbadge
	 * @property {(name: string) => void} onrename
	 */

	/** @type {Props} */
	let {
		player,
		highlight = false,
		avatarLocked = false,
		onavatar,
		onlongpress,
		onrow,
		onbadge,
		onrename
	} = $props();

	let editing = $state(false);
	let editValue = $state('');
	let longTimer = $state(/** @type {ReturnType<typeof setTimeout>|null} */ (null));
	let longFired = $state(false);
	/** После touch игнорируем мышиные/клик-события (ghost click на другую строку после re-render) */
	let touchActive = $state(false);
	let suppressClickUntil = $state(0);

	const icon = $derived(player.role ? roleMeta[player.role]?.icon || '❓' : '');
	const roleLabel = $derived(player.role ? roleMeta[player.role]?.label || '' : 'скрыто');

	function clearLongTimer() {
		if (longTimer) {
			clearTimeout(longTimer);
			longTimer = null;
		}
	}

	/** @param {TouchEvent} e */
	function onAvatarTouchStart(e) {
		touchActive = true;
		longFired = false;
		clearLongTimer();
		// фиксируем id на старте жеста
		const id = player.id;
		longTimer = setTimeout(() => {
			longFired = true;
			onlongpress();
			suppressClickUntil = Date.now() + 600;
		}, 550);
	}

	/** @param {TouchEvent} e */
	function onAvatarTouchMove(e) {
		// палец ушёл — отменяем long-press, короткий тап тоже не считаем
		clearLongTimer();
		longFired = true; // блокируем end → onavatar
	}

	/** @param {TouchEvent} e */
	function onAvatarTouchEnd(e) {
		clearLongTimer();
		// Гасим последующий synthetic click, иначе после re-render он попадает в другую карточку
		e.preventDefault();
		suppressClickUntil = Date.now() + 600;
		const wasLong = longFired;
		longFired = false;
		touchActive = false;
		if (!wasLong) {
			onavatar();
		}
	}

	/** @param {MouseEvent} e */
	function onAvatarMouseDown(e) {
		// На тач-устройствах после touch приходит mousedown — игнорируем
		if (touchActive || Date.now() < suppressClickUntil) return;
		if (e.button !== 0) return;
		longFired = false;
		clearLongTimer();
		longTimer = setTimeout(() => {
			longFired = true;
			onlongpress();
		}, 550);
	}

	/** @param {MouseEvent} e */
	function onAvatarMouseUp(e) {
		if (touchActive || Date.now() < suppressClickUntil) return;
		clearLongTimer();
		if (!longFired) onavatar();
		longFired = false;
	}

	function onAvatarMouseLeave() {
		if (touchActive) return;
		clearLongTimer();
	}

	/** @param {MouseEvent} e */
	function onAvatarClick(e) {
		e.stopPropagation();
		// click после touch уже обработан в touchend
		if (Date.now() < suppressClickUntil) {
			e.preventDefault();
		}
	}

	/** @param {MouseEvent} e */
	function onRowClick(e) {
		if (Date.now() < suppressClickUntil) return;
		const t = /** @type {HTMLElement} */ (e.target);
		if (t.closest('.player-avatar') || t.closest('.badge') || t.closest('.player-name-input')) return;
		onrow();
	}

	/** @type {HTMLInputElement|null} */
	let nameInput = $state(null);

	function startEdit() {
		editing = true;
		editValue = player.name;
		queueMicrotask(() => {
			nameInput?.focus();
			nameInput?.select();
		});
	}

	function finishEdit() {
		onrename(editValue.trim() || `Игрок ${player.id}`);
		editing = false;
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="player-row"
	class:dead={!player.alive}
	class:highlight
	class:faction-predator={player.faction === 'predator'}
	class:faction-peaceful={player.faction === 'peaceful'}
	class:faction-special={player.faction === 'special'}
	class:faction-owl={player.faction === 'owl'}
	onclick={onRowClick}
>
	<div class="player-num">{player.id}</div>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="player-avatar"
		class:filled={!!player.role}
		class:locked={avatarLocked}
		ontouchstart={onAvatarTouchStart}
		ontouchmove={onAvatarTouchMove}
		ontouchend={onAvatarTouchEnd}
		ontouchcancel={onAvatarTouchEnd}
		onmousedown={onAvatarMouseDown}
		onmouseup={onAvatarMouseUp}
		onmouseleave={onAvatarMouseLeave}
		onclick={onAvatarClick}
	>
		{icon}
	</div>

	<div class="player-info">
		{#if editing}
			<input
				class="player-name-input"
				bind:this={nameInput}
				bind:value={editValue}
				onblur={finishEdit}
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						finishEdit();
					}
					if (e.key === 'Escape') {
						editValue = player.name;
						editing = false;
					}
				}}
			/>
		{:else}
			<div class="player-name-row">
				<div class="player-name">{player.name}</div>
				<button
					type="button"
					class="edit-name-btn"
					aria-label="Редактировать имя"
					onclick={(e) => {
						e.stopPropagation();
						startEdit();
					}}
				>
					✎
				</button>
			</div>
		{/if}
		<div class="player-role">{roleLabel}</div>
	</div>

	<div class="player-badges">
		{#each player.badges as b (b.type + b.round)}
			{@const meta = badgeMeta[b.type]}
			{#if meta}
				<button
					type="button"
					class="badge {meta.cls}"
					onclick={(e) => {
						e.stopPropagation();
						onbadge(b.type);
					}}
				>
					{meta.text}
				</button>
			{/if}
		{/each}
	</div>
</div>

<style>
	.player-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 12px;
		background: var(--surface);
		border-radius: var(--radius);
		min-height: 56px;
		user-select: none;
		cursor: pointer;
		overflow: visible;
		position: relative;
	}

	.player-row.faction-predator {
		background: rgba(255, 59, 48, 0.08);
	}
	.player-row.faction-peaceful {
		background: rgba(52, 199, 89, 0.08);
	}
	.player-row.faction-special {
		background: rgba(175, 82, 222, 0.08);
	}
	.player-row.faction-owl {
		background: rgba(175, 82, 222, 0.12);
	}
	.player-row.dead {
		opacity: 0.4;
		background: var(--dead-bg) !important;
		cursor: default;
	}
	.player-row.dead .player-name,
	.player-row.dead .player-num {
		text-decoration: line-through;
	}
	.player-row.highlight {
		/* outline не клипится overflow родителя так же сильно, как box-shadow в некоторых движках —
		   используем оба + запас по margin у списка */
		outline: 2px solid var(--accent);
		outline-offset: 0px;
		box-shadow: none;
		z-index: 1;
	}

	.player-num {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.05);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
		font-weight: 600;
		color: var(--text-secondary);
		flex-shrink: 0;
		pointer-events: none;
	}

	.player-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		border: 1.5px dashed rgba(0, 0, 0, 0.18);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20px;
		flex-shrink: 0;
		cursor: pointer;
		background: transparent;
		touch-action: manipulation;
	}
	.player-avatar.filled {
		border-style: solid;
		border-color: transparent;
		background: rgba(0, 0, 0, 0.04);
	}
	.player-avatar.locked {
		cursor: default;
		opacity: 0.85;
	}

	.player-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.player-name-row {
		display: flex;
		align-items: center;
		gap: 6px;
		min-width: 0;
	}
	.player-name {
		font-size: 16px;
		font-weight: 560;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 0;
	}
	.edit-name-btn {
		flex-shrink: 0;
		width: 28px;
		height: 28px;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: var(--text-secondary);
		font-size: 15px;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		transform: scaleX(-1);
	}
	.edit-name-btn:active {
		background: rgba(0, 0, 0, 0.06);
	}
	.player-role {
		font-size: 12px;
		color: var(--text-secondary);
		font-weight: 500;
	}
	.player-name-input {
		font-size: 16px;
		font-weight: 560;
		border: none;
		background: transparent;
		outline: none;
		width: 100%;
		color: var(--text);
		padding: 0;
	}

	.player-badges {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
		justify-content: flex-end;
		max-width: 120px;
	}
	.badge {
		font-size: 11px;
		font-weight: 700;
		padding: 3px 8px;
		border-radius: 10px;
		color: #fff;
		border: none;
		white-space: nowrap;
	}
	.badge.attack {
		background: var(--predator);
	}
	.badge.protect {
		background: var(--spirit);
		color: #003a4a;
	}
	.badge.check {
		background: var(--eagle);
		color: #3a1f00;
	}
	.badge.mute {
		background: var(--mute);
		color: #3a2e00;
	}
	.badge.clean {
		background: var(--gammarus);
		color: #003a4a;
	}
	.badge.gift {
		background: var(--angara);
	}
	.badge.exile {
		background: var(--exile);
	}
</style>
