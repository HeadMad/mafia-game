<script>
	import notesState from '$state/notesState';

	/**
	 * @typedef {Object} Props
	 * @property {boolean} open
	 * @property {() => void} onclose
	 */

	/** @type {Props} */
	let { open = false, onclose } = $props();

	/** @type {string|null} */
	let focusId = $state(null);

	function onAdd() {
		const id = notesState.addNote();
		focusId = id;
	}

	/**
	 * @param {HTMLTextAreaElement} node
	 * @param {string} id
	 */
	function focusIfNew(node, id) {
		if (focusId === id) {
			queueMicrotask(() => {
				node.focus();
				focusId = null;
			});
		}
		return {
			/** @param {string} newId */
			update(newId) {
				if (focusId === newId) {
					queueMicrotask(() => {
						node.focus();
						focusId = null;
					});
				}
			}
		};
	}
</script>

{#if open}
	<div
		class="notes-overlay"
		role="presentation"
		onclick={(e) => {
			if (e.target === e.currentTarget) onclose();
		}}
	>
		<div class="notes-sheet" role="dialog" aria-modal="true" aria-label="Заметки">
			<div class="notes-header">
				<h2>Заметки</h2>
				<button type="button" class="notes-close" onclick={onclose} aria-label="Закрыть">✕</button>
			</div>

			<div class="notes-toolbar">
				<button type="button" class="notes-add" onclick={onAdd}>+ Новая заметка</button>
			</div>

			<div class="notes-list">
				{#if notesState.notes.length === 0}
					<p class="notes-empty">Пока пусто. Добавьте первую заметку.</p>
				{:else}
					{#each notesState.notes as note (note.id)}
						<div class="note-card">
							<textarea
								class="note-text"
								rows="3"
								placeholder="Текст заметки…"
								value={note.text}
								use:focusIfNew={note.id}
								oninput={(e) => {
									const t = /** @type {HTMLTextAreaElement} */ (e.currentTarget);
									notesState.updateNote(note.id, t.value);
								}}
							></textarea>
							<button
								type="button"
								class="note-delete"
								aria-label="Удалить"
								onclick={() => notesState.removeNote(note.id)}
							>
								Удалить
							</button>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.notes-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: 110;
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	.notes-sheet {
		background: var(--bg);
		border-radius: 16px 16px 0 0;
		width: 100%;
		max-width: 480px;
		max-height: 85vh;
		display: flex;
		flex-direction: column;
		padding-bottom: env(safe-area-inset-bottom);
	}

	.notes-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 16px 8px;
	}

	.notes-header h2 {
		font-size: 18px;
		font-weight: 700;
	}

	.notes-close {
		background: rgba(0, 0, 0, 0.06);
		border: none;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		font-size: 16px;
		color: var(--text-secondary);
	}

	.notes-toolbar {
		padding: 0 16px 10px;
	}

	.notes-add {
		width: 100%;
		padding: 12px;
		border: none;
		border-radius: 12px;
		background: rgba(0, 122, 255, 0.12);
		color: var(--accent);
		font-size: 15px;
		font-weight: 600;
	}

	.notes-add:active {
		opacity: 0.75;
	}

	.notes-list {
		padding: 0 16px 20px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.notes-empty {
		text-align: center;
		color: var(--text-secondary);
		font-size: 14px;
		padding: 24px 8px;
	}

	.note-card {
		background: var(--surface);
		border-radius: 12px;
		padding: 10px 10px 8px;
	}

	.note-text {
		width: 100%;
		border: none;
		resize: vertical;
		min-height: 64px;
		font-family: inherit;
		font-size: 15px;
		line-height: 1.45;
		color: var(--text);
		background: transparent;
		outline: none;
	}

	.note-delete {
		display: block;
		margin-left: auto;
		border: none;
		background: none;
		color: var(--predator);
		font-size: 13px;
		font-weight: 600;
		padding: 6px 4px;
	}

	.note-delete:active {
		opacity: 0.6;
	}
</style>
