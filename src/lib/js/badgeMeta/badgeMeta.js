/**
 * Метаданные бейджей действий.
 * @type {Record<string, { text: string, cls: string }>}
 */
const badgeMeta = {
	attack: { text: 'Атака', cls: 'attack' },
	protect: { text: 'Спасён', cls: 'protect' },
	check: { text: 'Проверка', cls: 'check' },
	mute: { text: 'Молчит', cls: 'mute' },
	clean: { text: 'Зачистка', cls: 'clean' },
	gift: { text: 'Дар', cls: 'gift' },
	exile: { text: 'Изгнан', cls: 'exile' }
};

export default badgeMeta;
