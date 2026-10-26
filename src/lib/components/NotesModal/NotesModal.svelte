<script>
	import notesState from '$state/notesState';

	/**
	 * @typedef {Object} Props
	 * @property {boolean} open
	 * @property {() => void} onclose
	 */

	/** @type {Props} */
	let { open = false, onclose } = $props();

	/** @type {'list' | 'edit'} */
	let mode = $state('list');
	/** id существующей заметки или null для новой */
	let editingId = $state(/** @type {string|null} */ (null));
	let draft = $state('');
	/** @type {HTMLTextAreaElement|null} */
	let textareaEl = $state(null);

	const isNew = $derived(editingId === null && mode === 'edit');

	/**
	 * @param {string} text
	 * @param {number} [max]
	 */
	function titleFrom(text, max = 48) {
		const line = (text || '').split('\n').find((l) => l.trim()) || '';
		const t = line.trim();
		if (!t) return 'Без названия';
		return t.length > max ? t.slice(0, max).trimEnd() + '…' : t;
	}

	function openNew() {
		editingId = null;
		draft = '';
		mode = 'edit';
		queueMicrotask(() => textareaEl?.focus());
	}

	/**
	 * @param {{ id: string, text: string }} note
	 */
	function openEdit(note) {
		editingId = note.id;
		draft = note.text;
		mode = 'edit';
		queueMicrotask(() => {
			textareaEl?.focus();
			const len = textareaEl?.value.length ?? 0;
			textareaEl?.setSelectionRange(len, len);
		});
	}

	function backToList() {
		mode = 'list';
		editingId = null;
		draft = '';
	}

	function onSave() {
		const text = draft;
		if (editingId) {
			notesState.updateNote(editingId, text);
		} else if (text.trim()) {
			notesState.addNote(text);
		}
		backToList();
	}

	function onCancel() {
		backToList();
	}

	function onDelete() {
		if (editingId) notesState.removeNote(editingId);
		backToList();
	}

	// при закрытии окна сбрасываем режим
	$effect(() => {
		if (!open) {
			mode = 'list';
			editingId = null;
			draft = '';
		}
	});
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
				<h2>{mode === 'edit' ? (isNew ? 'Новая заметка' : 'Заметка') : 'Заметки'}</h2>
				<button type="button" class="notes-close" onclick={onclose} aria-label="Закрыть">✕</button>
			</div>

			{#if mode === 'list'}
				<div class="notes-list">
					{#if notesState.notes.length === 0}
						<p class="notes-empty">Пока пусто. Создайте первую заметку.</p>
					{:else}
						{#each notesState.notes as note (note.id)}
							<button type="button" class="note-row" onclick={() => openEdit(note)}>
								<span class="note-title">{titleFrom(note.text)}</span>
								<span class="note-chevron">›</span>
							</button>
						{/each}
					{/if}
				</div>

				<div class="notes-footer">
					<button type="button" class="btn-primary" onclick={openNew}>Создать заметку</button>
				</div>
			{:else}
				<div class="notes-editor">
					<textarea
						class="note-textarea"
						bind:this={textareaEl}
						bind:value={draft}
						placeholder="Текст заметки…"
						rows="8"
					></textarea>
				</div>

				<div class="notes-footer dual">
					{#if isNew}
						<button type="button" class="btn-secondary" onclick={onCancel}>Отменить</button>
						<button type="button" class="btn-primary" onclick={onSave}>Сохранить</button>
					{:else}
						<button type="button" class="btn-danger" onclick={onDelete}>Удалить</button>
						<button type="button" class="btn-primary" onclick={onSave}>Сохранить</button>
					{/if}
				</div>
			{/if}
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
		min-height: 42vh;
		display: flex;
		flex-direction: column;
		padding-bottom: env(safe-area-inset-bottom);
	}

	.notes-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 16px 10px;
		flex-shrink: 0;
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

	.notes-list {
		flex: 1;
		overflow-y: auto;
		padding: 0 16px 12px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.notes-empty {
		text-align: center;
		color: var(--text-secondary);
		font-size: 14px;
		padding: 32px 8px;
	}

	.note-row {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		text-align: left;
		padding: 14px 14px;
		border: none;
		border-radius: 12px;
		background: var(--surface);
		color: var(--text);
		font-size: 15px;
		font-weight: 500;
		font-family: inherit;
	}

	.note-row:active {
		opacity: 0.75;
	}

	.note-title {
		flex: 1;
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.note-chevron {
		flex-shrink: 0;
		color: var(--text-secondary);
		font-size: 18px;
		line-height: 1;
	}

	.notes-editor {
		flex: 1;
		display: flex;
		min-height: 0;
		padding: 0 16px 8px;
	}

	.note-textarea {
		width: 100%;
		height: 100%;
		min-height: 200px;
		border: none;
		border-radius: 12px;
		background: var(--surface);
		padding: 14px;
		font-family: inherit;
		font-size: 16px;
		line-height: 1.5;
		color: var(--text);
		resize: none;
		outline: none;
	}

	.notes-footer {
		flex-shrink: 0;
		padding: 10px 16px 14px;
		display: flex;
		gap: 10px;
	}

	.notes-footer.dual .btn-primary,
	.notes-footer.dual .btn-secondary,
	.notes-footer.dual .btn-danger {
		flex: 1;
	}

	.btn-primary,
	.btn-secondary,
	.btn-danger {
		width: 100%;
		padding: 14px;
		border: none;
		border-radius: 12px;
		font-size: 16px;
		font-weight: 600;
		font-family: inherit;
	}

	.btn-primary {
		background: var(--accent);
		color: #fff;
	}

	.btn-secondary {
		background: rgba(0, 0, 0, 0.06);
		color: var(--text);
	}

	.btn-danger {
		background: rgba(255, 59, 48, 0.12);
		color: var(--predator);
	}

	.btn-primary:active,
	.btn-secondary:active,
	.btn-danger:active {
		opacity: 0.75;
	}
</style>
