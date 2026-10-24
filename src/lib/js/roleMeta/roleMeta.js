/**
 * Метаданные ролей Байкальской мафии.
 * @type {Record<string, { icon: string, label: string, faction: string }>}
 */
const roleMeta = {
	predator: { icon: '🐾', label: 'Хищник', faction: 'predator' },
	owl: { icon: '🦉', label: 'Сова', faction: 'owl' },
	peaceful: { icon: '🦭', label: 'Мирное', faction: 'peaceful' },
	spirit: { icon: '👻', label: 'Дух Байкала', faction: 'special' },
	eagle: { icon: '🦅', label: 'Орлан-Белохвост', faction: 'special' },
	fox: { icon: '🦊', label: 'Лиса', faction: 'special' },
	vole: { icon: '🐭', label: 'Ольхонская Полевка', faction: 'special' },
	gammarus: { icon: '🦐', label: 'Гамарус', faction: 'special' },
	angara: { icon: '🌊', label: 'Ангара', faction: 'special' }
};

export default roleMeta;
