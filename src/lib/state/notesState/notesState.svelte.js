const STORAGE_KEY = 'baikal_mafia_notes_v1';

/**
 * @typedef {{ id: string, text: string, updatedAt: number }} Note
 */

/**
 * @returns {Note[]}
 */
function loadNotes() {
	try {
		if (typeof localStorage === 'undefined') return [];
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const data = JSON.parse(raw);
		if (!Array.isArray(data)) return [];
		return data.filter((n) => n && typeof n.id === 'string' && typeof n.text === 'string');
	} catch {
		return [];
	}
}

function createNotesState() {
	// Загружаем сразу при создании модуля (не в геттере / не во время рендера)
	let notes = $state(/** @type {Note[]} */ (loadNotes()));

	function persist() {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
		} catch {
			/* ignore */
		}
	}

	/**
	 * @returns {string}
	 */
	function addNote() {
		const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
		notes = [{ id, text: '', updatedAt: Date.now() }, ...notes];
		persist();
		return id;
	}

	/**
	 * @param {string} id
	 * @param {string} text
	 */
	function updateNote(id, text) {
		notes = notes.map((n) => (n.id === id ? { ...n, text, updatedAt: Date.now() } : n));
		persist();
	}

	/**
	 * @param {string} id
	 */
	function removeNote(id) {
		notes = notes.filter((n) => n.id !== id);
		persist();
	}

	return {
		get notes() {
			return notes;
		},
		addNote,
		updateNote,
		removeNote
	};
}

const notesState = createNotesState();
export default notesState;
