/**
 * Хелперы фаз игры.
 */

/**
 * @param {string} phase
 * @returns {string}
 */
export function phaseShort(phase) {
	const map = {
		predators: 'Ночь',
		spirit: 'Ночь',
		eagle: 'Ночь',
		fox: 'Ночь',
		gammarus: 'Ночь',
		angara: 'Ночь',
		morning: 'Утро',
		day: 'День'
	};
	return map[phase] || phase;
}

/**
 * @param {string} phase
 * @param {boolean} owlEnabled
 * @returns {string}
 */
export function phaseSpeechText(phase, owlEnabled) {
	const map = {
		predators:
			'Просыпаются хищники' +
			(owlEnabled ? ' и Сова' : '') +
			'. Они выбирают, кого атаковать этой ночью.',
		spirit:
			'Просыпается Дух Байкала. Выберите игрока, которого нельзя прогнать. Себя защитить нельзя.',
		eagle: 'Просыпается Орлан-Белохвост. Проверьте роль одного игрока.',
		fox: 'Просыпается Лиса. Выберите игрока, который не сможет голосовать днём.',
		gammarus: 'Просыпается Гамарус. Чистильщик делает зачистку.',
		angara: 'Просыпается Ангара. Можно угостить даром одно животное.',
		morning: 'Наступило утро. Подводим итоги ночи.',
		day: 'Город просыпается. Обсуждение и голосование. Выберите, кого изгнать.'
	};
	return map[phase] || '';
}

/**
 * @param {string} phase
 * @returns {{ text: string, badge: string, cls: string, badgeKey: string|null }}
 */
export function phaseActionInfo(phase) {
	const map = {
		predators: { text: 'Жертва атаки', badge: 'Атака', cls: 'attack', badgeKey: 'attack' },
		spirit: { text: 'Защита', badge: 'Спасён', cls: 'protect', badgeKey: 'protect' },
		eagle: { text: 'Проверка', badge: 'Проверка', cls: 'check', badgeKey: 'check' },
		fox: { text: 'Молчание', badge: 'Молчит', cls: 'mute', badgeKey: 'mute' },
		gammarus: { text: 'Зачистка', badge: 'Зачистка', cls: 'clean', badgeKey: 'clean' },
		angara: { text: 'Дар', badge: 'Дар', cls: 'gift', badgeKey: 'gift' },
		day: { text: 'Изгнание', badge: 'Изгнан', cls: 'exile', badgeKey: 'exile' }
	};
	return map[phase] || { text: '', badge: '', cls: '', badgeKey: null };
}

/**
 * @param {{ specials: Record<string, boolean> }} config
 * @returns {string[]}
 */
export function buildPhases(config) {
	const phases = ['predators'];
	if (config.specials.spirit) phases.push('spirit');
	if (config.specials.eagle) phases.push('eagle');
	if (config.specials.fox) phases.push('fox');
	if (config.specials.gammarus) phases.push('gammarus');
	if (config.specials.angara) phases.push('angara');
	phases.push('morning');
	phases.push('day');
	return phases;
}

export default { phaseShort, phaseSpeechText, phaseActionInfo, buildPhases };
