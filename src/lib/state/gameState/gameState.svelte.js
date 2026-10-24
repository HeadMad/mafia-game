import { buildPhases } from '$js/phaseHelpers';
import roleMeta from '$js/roleMeta';

const STORAGE_KEY = 'baikal_mafia_v5';

/**
 * Создаёт пустого игрока.
 * @param {number} id
 */
function createPlayer(id) {
	return {
		id,
		name: `Игрок ${id}`,
		role: /** @type {string|null} */ (null),
		alive: true,
		badges: /** @type {Array<{type: string, round: number}>} */ ([]),
		faction: /** @type {string|null} */ (null),
		autoPeaceful: false
	};
}

/**
 * Реактивный модуль состояния партии.
 */
function createGameState() {
	let setup = $state(true);
	let editingSettings = $state(false);
	let round = $state(1);
	let phaseIndex = $state(0);
	let phases = $state(/** @type {string[]} */ ([]));
	let players = $state(/** @type {ReturnType<typeof createPlayer>[]} */ ([]));
	let pool = $state(/** @type {Record<string, number>} */ ({}));
	let config = $state({
		predators: 3,
		peaceful: 5,
		specials: /** @type {Record<string, boolean>} */ ({})
	});
	let log = $state(/** @type {string[]} */ ([]));
	let owlEnabled = $state(true);
	let voleEnabled = $state(true);
	let voleAssigned = $state(false);
	let badgeUsed = $state(/** @type {Record<string, boolean>} */ ({}));
	let gameOver = $state(/** @type {{ winner: string, text: string, sub: string }|null} */ (null));
	/** @type {{ fromRound: number, toRound: number, lines: string[] }|null} */
	let intermission = $state(null);

	/** @type {{ open: boolean, message: string, okText: string, cancelText: string, danger: boolean, alertOnly: boolean, checkboxLabel: string|null, checkboxDefault: boolean, resolve: ((v: { ok: boolean, checked: boolean }) => void)|null }} */
	let confirm = $state({
		open: false,
		message: '',
		okText: 'ОК',
		cancelText: 'Отмена',
		danger: false,
		alertOnly: false,
		checkboxLabel: null,
		checkboxDefault: true,
		resolve: null
	});

	/** Имена с прошлой партии по id игрока (если отметили «Сохранить имена») */
	let savedNames = $state(/** @type {Record<number, string>} */ ({}));

	/**
	 * @param {string} message
	 * @param {{ okText?: string, cancelText?: string, danger?: boolean, alertOnly?: boolean, checkboxLabel?: string, checkboxDefault?: boolean }} [options]
	 * @returns {Promise<{ ok: boolean, checked: boolean }>}
	 */
	function showConfirm(message, options = {}) {
		return new Promise((resolve) => {
			confirm = {
				open: true,
				message,
				okText: options.okText || 'ОК',
				cancelText: options.cancelText || 'Отмена',
				danger: !!options.danger,
				alertOnly: !!options.alertOnly,
				checkboxLabel: options.checkboxLabel || null,
				checkboxDefault: options.checkboxDefault !== false,
				resolve
			};
		});
	}

	/**
	 * @param {{ ok: boolean, checked: boolean }} result
	 */
	function closeConfirm(result) {
		const r = confirm.resolve;
		confirm = { ...confirm, open: false, resolve: null };
		if (r) r(result);
	}

	/**
	 * @param {string} msg
	 */
	function addLog(msg) {
		const now = new Date();
		const h = now.getHours();
		const m = now.getMinutes();
		const time = `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}`;
		log = [...log, `[${time}] ${msg}`].slice(-250);
	}

	function save() {
		try {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					setup,
					editingSettings,
					round,
					phaseIndex,
					phases,
					players,
					pool,
					config,
					log,
					owlEnabled,
					voleEnabled,
					voleAssigned,
					badgeUsed,
					gameOver,
					intermission
				})
			);
		} catch {
			/* ignore */
		}
	}

	function load() {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return false;
			const s = JSON.parse(raw);
			if (!s?.players?.length || !s.phases) return false;
			setup = s.setup;
			editingSettings = s.editingSettings;
			round = s.round;
			phaseIndex = s.phaseIndex;
			phases = s.phases;
			players = s.players;
			pool = s.pool;
			config = s.config;
			log = s.log || [];
			owlEnabled = s.owlEnabled;
			voleEnabled = s.voleEnabled;
			voleAssigned = s.voleAssigned;
			badgeUsed = s.badgeUsed || {};
			gameOver = s.gameOver;
			intermission = s.intermission || null;
			return true;
		} catch {
			return false;
		}
	}

	function currentPhase() {
		return phases[phaseIndex] || 'day';
	}

	function isNightPhase() {
		const p = currentPhase();
		return p !== 'morning' && p !== 'day';
	}

	function initPool() {
		const c = config;
		pool = {
			predators: c.predators + (owlEnabled ? 1 : 0),
			spirit: c.specials.spirit ? 1 : 0,
			eagle: c.specials.eagle ? 1 : 0,
			fox: c.specials.fox ? 1 : 0,
			gammarus: c.specials.gammarus ? 1 : 0,
			angara: c.specials.angara ? 1 : 0
		};
		badgeUsed = {};
	}

	/**
	 * @param {{ predators: number, peaceful: number, specials: Record<string, boolean>, owlEnabled: boolean, voleEnabled: boolean }} cfg
	 * @param {boolean} keepPlayers
	 */
	function applyConfig(cfg, keepPlayers) {
		config = { predators: cfg.predators, peaceful: cfg.peaceful, specials: cfg.specials };
		owlEnabled = cfg.owlEnabled;
		voleEnabled = cfg.voleEnabled;
		phases = buildPhases(cfg);

		let specialCount = 0;
		Object.keys(cfg.specials).forEach((k) => {
			if (k === 'vole') return;
			if (cfg.specials[k]) specialCount++;
		});
		if (cfg.owlEnabled) specialCount++;
		if (cfg.voleEnabled) specialCount++;
		const total = cfg.predators + cfg.peaceful + specialCount;

		if (!keepPlayers || !players.length) {
			players = Array.from({ length: total }, (_, i) => createPlayer(i + 1));
			round = 1;
			phaseIndex = 0;
			log = [];
			voleAssigned = false;
			badgeUsed = {};
			gameOver = null;
			intermission = null;
			initPool();
		} else {
			while (players.length < total) {
				players = [...players, createPlayer(players.length + 1)];
			}
			if (players.length > total) {
				players = players.slice(0, total);
			}
			if (phaseIndex >= phases.length) phaseIndex = phases.length - 1;
		}
	}

	function createGame(cfg) {
		applyConfig(cfg, false);
		const names = savedNames;
		if (names && Object.keys(names).length) {
			players = players.map((p) => {
				const n = names[p.id];
				if (n) return { ...p, name: n };
				return p;
			});
			savedNames = {};
		}
		setup = false;
		editingSettings = false;
		addLog(`Партия создана. Круг 1. Игроков: ${players.length}`);
		save();
	}

	function updateSettings(cfg) {
		applyConfig(cfg, true);
		editingSettings = false;
		setup = false;
		addLog('Настройки обновлены');
		save();
	}

	function resetToNewGame(keepNames = false) {
		if (keepNames) {
			/** @type {Record<number, string>} */
			const map = {};
			players.forEach((p) => {
				map[p.id] = p.name;
			});
			savedNames = map;
		} else {
			savedNames = {};
		}
		setup = true;
		editingSettings = false;
		round = 1;
		phaseIndex = 0;
		phases = [];
		players = [];
		pool = {};
		config = { predators: 3, peaceful: 5, specials: {} };
		log = [];
		owlEnabled = true;
		voleEnabled = true;
		voleAssigned = false;
		badgeUsed = {};
		gameOver = null;
		intermission = null;
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {
			/* ignore */
		}
	}

	function clearAutoPeaceful() {
		players = players.map((p) => {
			if (!p.autoPeaceful) return p;
			return { ...p, role: null, faction: null, autoPeaceful: false };
		});
	}

	function autoFillPeacefulIfNeeded() {
		const remaining =
			(pool.predators || 0) +
			(pool.spirit || 0) +
			(pool.eagle || 0) +
			(pool.fox || 0) +
			(pool.gammarus || 0) +
			(pool.angara || 0);
		if (remaining > 0) {
			clearAutoPeaceful();
			return;
		}
		let filled = 0;
		players = players.map((p) => {
			if (p.role) return p;
			filled++;
			return { ...p, role: 'peaceful', faction: 'peaceful', autoPeaceful: true };
		});
		if (filled > 0) addLog(`➔ Автозаполнение: ${filled} мирных`);
	}

	/**
	 * @param {number} playerId
	 */
	function assignRoleFromPool(playerId) {
		if (!isNightPhase()) return;
		const phase = currentPhase();
		const idx = players.findIndex((p) => p.id === playerId);
		if (idx < 0) return;
		const player = players[idx];
		if (!player.alive) return;

		if (player.role) {
			if (player.role === 'vole') return;
			const can =
				phase === 'predators'
					? player.role === 'predator' || player.role === 'owl'
					: player.role === phase;
			if (!can) return;
			const nextPool = { ...pool };
			if (player.role === 'predator' || player.role === 'owl') {
				nextPool.predators = (nextPool.predators || 0) + 1;
			} else if (nextPool[player.role] !== undefined) {
				nextPool[player.role] = (nextPool[player.role] || 0) + 1;
			}
			pool = nextPool;
			players = players.map((p, i) =>
				i === idx ? { ...p, role: null, faction: null, autoPeaceful: false } : p
			);
			clearAutoPeaceful();
			addLog(`↺ Игрок ${playerId}: роль сброшена`);
			autoFillPeacefulIfNeeded();
			save();
			return;
		}

		const nextPool = { ...pool };
		if (phase === 'predators') {
			if ((nextPool.predators || 0) <= 0) return;
			nextPool.predators--;
			players = players.map((p, i) =>
				i === idx ? { ...p, role: 'predator', faction: 'predator', autoPeaceful: false } : p
			);
			addLog(`➔ Игрок ${playerId} — Хищник`);
		} else {
			if ((nextPool[phase] || 0) <= 0) return;
			nextPool[phase]--;
			const faction = roleMeta[phase]?.faction || 'special';
			players = players.map((p, i) =>
				i === idx ? { ...p, role: phase, faction, autoPeaceful: false } : p
			);
			addLog(`➔ Игрок ${playerId} — ${roleMeta[phase]?.label || phase}`);
		}
		pool = nextPool;
		autoFillPeacefulIfNeeded();
		save();
	}

	/**
	 * @param {number} playerId
	 */
	async function longPressPlayer(playerId) {
		const idx = players.findIndex((p) => p.id === playerId);
		if (idx < 0) return;
		const player = players[idx];
		if (!player.alive) return;

		if (player.role === 'predator' && owlEnabled) {
			const prevOwl = players.find((p) => p.role === 'owl');
			const msg = prevOwl
				? `Переназначить Сову с игрока ${prevOwl.id} на игрока ${player.id} («${player.name}»)?`
				: `Назначить игрока ${player.id} («${player.name}») Совой?`;
			const res = await showConfirm(msg, { okText: prevOwl ? 'Переназначить' : 'Назначить' });
			if (!res.ok) return;
			players = players.map((p) => {
				if (prevOwl && p.id === prevOwl.id) {
					return { ...p, role: 'predator', faction: 'predator' };
				}
				if (p.id === playerId) return { ...p, role: 'owl', faction: 'owl' };
				return p;
			});
			if (prevOwl) addLog(`↺ Игрок ${prevOwl.id} снова Хищник`);
			addLog(`➔ Игрок ${playerId} — Сова`);
			save();
			return;
		}

		if (player.role === 'owl') {
			const res = await showConfirm(`Снять роль Совы с игрока ${player.id} (станет Хищником)?`, {
				okText: 'Снять'
			});
			if (!res.ok) return;
			players = players.map((p, i) =>
				i === idx ? { ...p, role: 'predator', faction: 'predator' } : p
			);
			addLog(`↺ Игрок ${playerId} снова Хищник (Сова снята)`);
			save();
			return;
		}

		if (voleEnabled) {
			const canVole = !player.role || player.role === 'peaceful' || player.autoPeaceful;
			if (canVole) {
				const prevVole = players.find((p) => p.role === 'vole');
				const msg = prevVole
					? `Переназначить Полёвку с игрока ${prevVole.id} на игрока ${player.id} («${player.name}»)?`
					: `Назначить игрока ${player.id} («${player.name}») Ольхонской Полёвкой?`;
				const res = await showConfirm(msg, { okText: prevVole ? 'Переназначить' : 'Назначить' });
				if (!res.ok) return;
				players = players.map((p) => {
					if (prevVole && p.id === prevVole.id) {
						return { ...p, role: 'peaceful', faction: 'peaceful', autoPeaceful: true };
					}
					if (p.id === playerId) {
						return { ...p, role: 'vole', faction: 'special', autoPeaceful: false };
					}
					return p;
				});
				voleAssigned = true;
				if (prevVole) addLog(`↺ Игрок ${prevVole.id} снова мирный`);
				clearAutoPeaceful();
				autoFillPeacefulIfNeeded();
				addLog(`➔ Игрок ${playerId} — Ольхонская Полевка`);
				save();
				return;
			}
		}

		if (player.role === 'vole') {
			const res = await showConfirm(`Снять роль Полёвки с игрока ${player.id}?`, { okText: 'Снять' });
			if (!res.ok) return;
			players = players.map((p, i) =>
				i === idx ? { ...p, role: 'peaceful', faction: 'peaceful', autoPeaceful: true } : p
			);
			voleAssigned = false;
			clearAutoPeaceful();
			autoFillPeacefulIfNeeded();
			addLog(`↺ Игрок ${playerId}: Полёвка снята`);
			save();
		}
	}

	/**
	 * @param {number} playerId
	 */
	function applyBadge(playerId) {
		const phase = currentPhase();
		if (!isNightPhase() && phase !== 'day') return;
		const infoMap = {
			predators: 'attack',
			spirit: 'protect',
			eagle: 'check',
			fox: 'mute',
			gammarus: 'clean',
			angara: 'gift',
			day: 'exile'
		};
		const badgeKey = infoMap[phase];
		if (!badgeKey || badgeUsed[phase]) return;

		const idx = players.findIndex((p) => p.id === playerId);
		if (idx < 0) return;
		const player = players[idx];
		if (!player.alive) return;
		if (player.badges.some((b) => b.type === badgeKey && b.round === round)) return;
		if (phase === 'spirit' && player.role === 'spirit') {
			addLog('⚠ Дух не может защитить себя');
			return;
		}

		players = players.map((p, i) => {
			if (i !== idx) return p;
			const next = {
				...p,
				badges: [...p.badges, { type: badgeKey, round }]
			};
			if (phase === 'day' && badgeKey === 'exile') {
				next.alive = false;
			}
			return next;
		});
		badgeUsed = { ...badgeUsed, [phase]: true };
		if (phase === 'day') addLog(`➔ Суд города: Игрок ${playerId} изгнан`);
		else addLog(`➔ ${badgeKey}: Игрок ${playerId}`);
		checkWin();
		save();
	}

	/**
	 * @param {number} playerId
	 * @param {string} badgeType
	 */
	function removeBadge(playerId, badgeType) {
		const phase = currentPhase();
		const infoMap = {
			predators: 'attack',
			spirit: 'protect',
			eagle: 'check',
			fox: 'mute',
			gammarus: 'clean',
			angara: 'gift',
			day: 'exile'
		};
		if (infoMap[phase] !== badgeType) return;
		const idx = players.findIndex((p) => p.id === playerId);
		if (idx < 0) return;
		players = players.map((p, i) => {
			if (i !== idx) return p;
			const badges = p.badges.filter((b) => !(b.type === badgeType && b.round === round));
			const next = { ...p, badges };
			if (badgeType === 'exile') next.alive = true;
			return next;
		});
		badgeUsed = { ...badgeUsed, [phase]: false };
		addLog(`↺ Снят бейдж с Игрока ${playerId}`);
		save();
	}

	/**
	 * @param {number} playerId
	 * @param {string} name
	 */
	function renamePlayer(playerId, name) {
		players = players.map((p) => (p.id === playerId ? { ...p, name: name || `Игрок ${playerId}` } : p));
		save();
	}

	function checkWin() {
		if (gameOver) return true;
		const alive = players.filter((p) => p.alive);
		if (!alive.length) return false;
		const preds = alive.filter((p) => p.role === 'predator');
		const owls = alive.filter((p) => p.role === 'owl');
		const gams = alive.filter((p) => p.role === 'gammarus');
		const others = alive.filter((p) => p.role !== 'predator' && p.role !== 'owl');

		if (preds.length === 0 && gams.length === 0) {
			const predPoolLeft = (pool.predators || 0) > 0;
			if (!predPoolLeft) {
				gameOver = {
					winner: 'peaceful',
					text: 'Выиграли МИРНЫЕ!',
					sub: 'Хищников и Гамаруса не осталось.'
				};
				addLog('🏆 Победа мирных жителей');
				return true;
			}
		}
		if (others.length === 0 && preds.length === 1 && owls.length === 1 && alive.length === 2) {
			gameOver = {
				winner: 'owl',
				text: 'Победа Совы!',
				sub: 'Остались один хищник и одна сова.'
			};
			addLog('🏆 Победа Совы');
			return true;
		}
		return false;
	}

	function buildMorningSummary() {
		const attacked = [];
		const protectedList = [];
		const muted = [];
		const checked = [];
		const cleaned = [];
		players.forEach((p) => {
			p.badges.forEach((b) => {
				if (b.round !== round) return;
				if (b.type === 'attack') attacked.push(p);
				if (b.type === 'protect') protectedList.push(p);
				if (b.type === 'mute') muted.push(p);
				if (b.type === 'check') checked.push(p);
				if (b.type === 'clean') cleaned.push(p);
			});
		});
		const lines = [`Круг ${round}. Наступило утро.\n`];
		if (!attacked.length) {
			lines.push('Хищники этой ночью никого не прогнали.');
		} else {
			attacked.forEach((victim) => {
				const wasProtected = protectedList.some((pr) => pr.id === victim.id);
				if (wasProtected) {
					lines.push(
						`Игрок ${victim.id} (${victim.name}) атакован, но защищён Духом — жив.`
					);
				} else {
					lines.push(`Игрок ${victim.id} (${victim.name}) прогнан хищниками.`);
					if (victim.alive) {
						players = players.map((p) =>
							p.id === victim.id ? { ...p, alive: false } : p
						);
						addLog(`➔ Ночная жертва: Игрок ${victim.id}`);
					}
					if (victim.role === 'owl') {
						lines.push('⚠ Жертвой стала Сова! Хищники получают дополнительный ход.');
					}
				}
			});
		}
		cleaned.forEach((c) => {
			lines.push(`Гамарус зачистил: Игрок ${c.id} (${c.name}).`);
			if (c.alive) {
				players = players.map((p) => (p.id === c.id ? { ...p, alive: false } : p));
				addLog(`➔ Зачистка: Игрок ${c.id}`);
			}
		});
		if (muted.length) {
			lines.push('\nНе голосуют сегодня:');
			muted.forEach((m) => lines.push(`• Игрок ${m.id} (${m.name})`));
		}
		if (checked.length) {
			const foundPred = checked.some((c) => c.role === 'predator' || c.role === 'owl');
			lines.push(foundPred ? '\nОрлан обнаружил хищника.' : '\nОрлан не обнаружил хищника.');
		}
		checkWin();
		return lines.join('\n');
	}

	function nextPhase() {
		if (gameOver) return;
		if (intermission) return;
		const phase = currentPhase();
		if (phase === 'day') {
			const fromRound = round;
			const aliveBefore = players.filter((p) => p.alive);
			const deadBefore = players.filter((p) => !p.alive);
			const exiledThisDay = players.filter(
				(p) => !p.alive && p.badges.some((b) => b.type === 'exile' && b.round === fromRound)
			);

			const lines = [];
			lines.push(`Круг ${fromRound} завершён.`);
			if (exiledThisDay.length) {
				lines.push('');
				lines.push('Изгнаны голосованием:');
				exiledThisDay.forEach((p) => {
					lines.push(`• Игрок ${p.id} (${p.name})`);
				});
			} else {
				lines.push('');
				lines.push('Никого не изгнали.');
			}
			lines.push('');
			lines.push(`В живых: ${aliveBefore.length}`);
			lines.push(`Выбыло: ${deadBefore.length}`);
			lines.push('');
			lines.push(`Начинается круг ${fromRound + 1}.`);
			lines.push('Город засыпает…');

			players = players.map((p) => ({ ...p, badges: [] }));
			badgeUsed = {};
			const alive = players.filter((p) => p.alive);
			const dead = players.filter((p) => !p.alive);
			players = [...alive, ...dead];

			intermission = {
				fromRound,
				toRound: fromRound + 1,
				lines
			};
			addLog(`——— Конец круга ${fromRound} ———`);
			checkWin();
			save();
			return;
		} else {
			phaseIndex++;
			if (phaseIndex >= phases.length) phaseIndex = phases.length - 1;
			const next = currentPhase();
			if (next === 'morning') {
				buildMorningSummary();
				addLog('➔ Утро. Итоги ночи.');
			} else if (next === 'day') {
				addLog('➔ День. Голосование.');
			}
		}
		checkWin();
		save();
	}

	function continueFromIntermission() {
		if (!intermission) return;
		const to = intermission.toRound;
		intermission = null;
		round = to;
		phaseIndex = 0;
		addLog(`——— Круг ${round} ———`);
		addLog('Город засыпает. Ночь.');
		checkWin();
		save();
	}

	function prevPhase() {
		if (gameOver) return;
		if (phaseIndex > 0) phaseIndex--;
		else if (round > 1) {
			round--;
			phaseIndex = phases.length - 1;
		}
		save();
	}

	return {
		get setup() {
			return setup;
		},
		set setup(v) {
			setup = v;
		},
		get editingSettings() {
			return editingSettings;
		},
		set editingSettings(v) {
			editingSettings = v;
		},
		get round() {
			return round;
		},
		get phaseIndex() {
			return phaseIndex;
		},
		get phases() {
			return phases;
		},
		get players() {
			return players;
		},
		get pool() {
			return pool;
		},
		get config() {
			return config;
		},
		get log() {
			return log;
		},
		get owlEnabled() {
			return owlEnabled;
		},
		get voleEnabled() {
			return voleEnabled;
		},
		get badgeUsed() {
			return badgeUsed;
		},
		get gameOver() {
			return gameOver;
		},
		get intermission() {
			return intermission;
		},
		get confirm() {
			return confirm;
		},
		currentPhase,
		isNightPhase,
		showConfirm,
		closeConfirm,
		createGame,
		updateSettings,
		resetToNewGame,
		assignRoleFromPool,
		longPressPlayer,
		applyBadge,
		removeBadge,
		renamePlayer,
		buildMorningSummary,
		nextPhase,
		continueFromIntermission,
		prevPhase,
		load,
		save,
		addLog
	};
}

const gameState = createGameState();
export default gameState;
