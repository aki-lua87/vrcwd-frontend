<script>
	import { createEventDispatcher } from 'svelte';
	
	export let currentFolder = null;
	
	const dispatch = createEventDispatcher();
	
	function editFolder() {
		if (currentFolder) {
			dispatch('editFolder', { folder: currentFolder });
		}
	}
	
	function deleteFolder() {
		if (currentFolder) {
			dispatch('deleteFolder', { folderId: currentFolder.id });
		}
	}
</script>

<div class="folder-title-section">
	<div class="header-content">
		<div class="folder-info">
			<h2 class="folder-title">
				{currentFolder ? `📁 ${currentFolder.folder_name}` : '📁 フォルダーを選択してください'}
			</h2>
			{#if currentFolder && currentFolder.comment && currentFolder.comment.trim()}
				<p class="folder-comment">{currentFolder.comment}</p>
			{/if}
		</div>
		{#if currentFolder}
			<div class="folder-actions">
				<button class="btn btn-small btn-secondary" on:click={editFolder}>
					✏️ 編集
				</button>
				<button class="btn btn-small btn-danger" on:click={deleteFolder}>
					🗑️ 削除
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.folder-title-section {
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		border-bottom: 1px solid #dee2e6;
		padding: 1rem 0;
		position: sticky;
		top: 70px;
		z-index: 90;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.header-content {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 1rem;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
	}

	.folder-info {
		flex: 1;
	}

	.folder-title {
		margin: 0;
		font-size: 1.8rem;
		font-weight: 600;
		color: #333;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.folder-comment {
		margin: 0.5rem 0 0 2.5rem;
		font-size: 1rem;
		color: #666;
		font-style: italic;
	}

	.folder-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}

	.btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.8rem;
		font-weight: 500;
	}

	.btn-small {
		padding: 0.5rem 1rem;
		font-size: 0.8rem;
	}

	.btn-secondary {
		border: 1px solid #667eea;
		background: white;
		color: #667eea;
	}

	.btn-secondary:hover {
		background: #667eea;
		color: white;
	}

	.btn-danger {
		background: #c33;
		color: white;
	}

	.btn-danger:hover {
		background: #a02622;
	}
</style>