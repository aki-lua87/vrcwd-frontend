<script>
	export let folders = [];
	export let currentFolder = null;
	
	// Svelte 5 event props
	export let onselectFolder = () => {};
	export let oncreateFolder = () => {};
	export let oneditFolder = () => {};
	export let ondeleteFolder = () => {};
	
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
</script>

<div class="sidebar">
	<h2>📁 フォルダー</h2>
	<button
		class="btn btn-primary"
		id="createFolderBtn"
		on:click={createFolder}
	>
		新しいフォルダー
	</button>
	
	<ul class="folder-list">
		{#each folders as folder (folder.id)}
			<li class="folder-item" class:active={currentFolder && currentFolder.id === folder.id}>
				<button
					class="folder-button"
					class:active={currentFolder && currentFolder.id === folder.id}
					on:click={() => selectFolder(folder.id)}
				>
					📁 {folder.folder_name}
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
		position: sticky;
		top: 120px;
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
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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
		}
	}
</style>