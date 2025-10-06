<script>
	export let folders = [];
	export let currentFolder = null;

	// Svelte 5 event props
	export let onselectFolder = () => {};
	export let oncreateFolder = () => {};
	export let oneditFolder = () => {};
	export let ondeleteFolder = () => {};
	export let onreorderFolders = () => {};

	let draggedIndex = null;
	let dropPosition = null; // 'before' or 'after'
	let dropTargetIndex = null;

	function selectFolder(folderId) {
		onselectFolder({ folderId });
	}

	function createFolder() {
		oncreateFolder();
	}

	function editFolder(folder) {
		oneditFolder({ folder });
	}

	function deleteFolder(folderId) {
		ondeleteFolder({ folderId });
	}

	function handleDragStart(event, index) {
		draggedIndex = index;
		event.dataTransfer.effectAllowed = 'move';
		event.dataTransfer.setData('text/html', event.target);
	}

	function handleDragOver(event, index) {
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';

		if (draggedIndex === null || draggedIndex === index) {
			dropTargetIndex = null;
			dropPosition = null;
			return;
		}

		// カーソルの位置から挿入位置を判定
		const rect = event.currentTarget.getBoundingClientRect();
		const midpoint = rect.top + rect.height / 2;

		if (event.clientY < midpoint) {
			dropPosition = 'before';
			dropTargetIndex = index;
		} else {
			dropPosition = 'after';
			dropTargetIndex = index;
		}
	}

	function handleDragLeave() {
		dropTargetIndex = null;
		dropPosition = null;
	}

	function handleDrop(event) {
		event.preventDefault();

		if (draggedIndex === null || dropTargetIndex === null) {
			return;
		}

		// 挿入先のインデックスを計算
		let insertIndex = dropTargetIndex;
		if (dropPosition === 'after') {
			insertIndex = dropTargetIndex + 1;
		}

		// ドラッグ元が挿入先より前にある場合は調整
		if (draggedIndex < insertIndex) {
			insertIndex--;
		}

		if (draggedIndex === insertIndex) {
			draggedIndex = null;
			dropTargetIndex = null;
			dropPosition = null;
			return;
		}

		// フォルダを並べ替え
		const reorderedFolders = [...folders];
		const [draggedFolder] = reorderedFolders.splice(draggedIndex, 1);
		reorderedFolders.splice(insertIndex, 0, draggedFolder);

		onreorderFolders({ folders: reorderedFolders });

		draggedIndex = null;
		dropTargetIndex = null;
		dropPosition = null;
	}

	function handleDragEnd() {
		draggedIndex = null;
		dropTargetIndex = null;
		dropPosition = null;
	}
</script>

<div class="sidebar">
	<h2>📁 フォルダ</h2>
	<button
		class="btn btn-primary"
		id="createFolderBtn"
		on:click={createFolder}
	>
		新しいフォルダを作成
	</button>
	<ul class="folder-list">
		{#each folders as folder, index (folder.id)}
			<li
				class="folder-item"
				class:active={currentFolder && currentFolder.id === folder.id}
				class:dragging={draggedIndex === index}
				class:drop-before={dropTargetIndex === index && dropPosition === 'before'}
				class:drop-after={dropTargetIndex === index && dropPosition === 'after'}
				draggable="true"
				on:dragstart={(e) => handleDragStart(e, index)}
				on:dragover={(e) => handleDragOver(e, index)}
				on:dragleave={handleDragLeave}
				on:drop={handleDrop}
				on:dragend={handleDragEnd}
			>
				<button
					class="folder-button"
					class:active={currentFolder &&
						currentFolder.id === folder.id}
					on:click={() => selectFolder(folder.id)}
				>
					<span class="drag-handle">⋮⋮</span>
					{folder.folder_name}
				</button>
			</li>
		{/each}
	</ul>
</div>

<style>
	.sidebar {
		width: 280px;
		flex-shrink: 0;
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		padding: 1.5rem;
		height: fit-content;
	}

	.sidebar h2 {
		font-size: 1.2rem;
		margin-bottom: 1rem;
		color: #333;
		border-bottom: 2px solid #eee;
		padding-bottom: 0.5rem;
	}

	.btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 0.9rem;
		font-weight: 500;
		width: 100%;
		margin-bottom: 1rem;
	}

	.btn-primary {
		background: #667eea;
		color: white;
	}

	.btn-primary:hover {
		background: #764ba2;
	}

	.folder-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.folder-item {
		margin-bottom: 1rem;
		cursor: move;
		position: relative;
	}

	.folder-item.dragging {
		opacity: 0.5;
	}

	.folder-item.drop-before::before {
		content: '';
		position: absolute;
		top: -0.5rem;
		left: 0;
		right: 0;
		height: 3px;
		background: #667eea;
		border-radius: 2px;
		z-index: 10;
	}

	.folder-item.drop-after::after {
		content: '';
		position: absolute;
		bottom: -0.5rem;
		left: 0;
		right: 0;
		height: 3px;
		background: #667eea;
		border-radius: 2px;
		z-index: 10;
	}

	.folder-button {
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		border: 1px solid #dee2e6;
		text-align: left;
		width: 100%;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
		color: #333;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 0.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.drag-handle {
		color: #999;
		font-size: 1rem;
		cursor: grab;
		user-select: none;
	}

	.drag-handle:active {
		cursor: grabbing;
	}

	.folder-button:hover {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.folder-button.active {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
	}

	.folder-item.active .folder-button:hover {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
	}

	@media (max-width: 768px) {
		.sidebar {
			width: 100%;
			position: static;
			margin: 0;
		}
	}
</style>
