const STORAGE_KEY = 'baikal_mafia_notes_v1';

/**
 * @typedef {{ id: string, text: string, updatedAt: number }} Note
 */

function loadNotes() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return /** @type {Note[]} */ ([]);
		const data = JSON.parse(raw);
		if (!Array.isArray(data)) return [];
		return data.filter((n) => n && typeof n.id === 'string' && typeof n.text === 'string');
	} catch {
		return [];
	}
}

function createNotesState() {
	let notes = $state(/** @type {Note[]} */ ([]));
	let loaded = $state(false);

	function ensureLoaded() {
		if (loaded) return;
		notes = loadNotes();
		loaded = true;
	}

	function persist() {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
		} catch {
			/* ignore */
		}
	}

	/**
	 * @returns {string} new note id
	 */
	function addNote() {
		ensureLoaded();
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
		ensureLoaded();
		notes = notes.map((n) => (n.id === id ? { ...n, text, updatedAt: Date.now() } : n));
		persist();
	}

	/**
	 * @param {string} id
	 */
	function removeNote(id) {
		ensureLoaded();
		notes = notes.filter((n) => n.id !== id);
		persist();
	}

	return {
		get notes() {
			ensureLoaded();
			return notes;
		},
		addNote,
		updateNote,
		removeNote,
		ensureLoaded
	};
}

const notesState = createNotesState();
export default notesState;
