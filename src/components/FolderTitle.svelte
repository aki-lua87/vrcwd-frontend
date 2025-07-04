<script>
	export let currentFolder = null;
	export let userId = "";

	// Svelte 5 event props
	export let oneditFolder = () => {};
	export let ondeleteFolder = () => {};
	export let onshareFolder = () => {};
	export let onremoveFromFavorites = () => {};

	function editFolder() {
		if (currentFolder) {
			oneditFolder({ folder: currentFolder });
		}
	}

	function deleteFolder() {
		if (currentFolder) {
			ondeleteFolder({ folderId: currentFolder.id });
		}
	}

	function shareFolder() {
		if (currentFolder && userId) {
			onshareFolder({
				folder: currentFolder,
				userId: userId,
			});
		}
	}

	function removeFromFavorites() {
		if (currentFolder) {
			onremoveFromFavorites({ folderId: currentFolder.id });
		}
	}
</script>

<div class="folder-title-section">
	<div class="header-content">
		<div class="folder-info">
			<div class="folder-header">
				<h2 class="folder-title">
					{currentFolder
						? `📁 ${currentFolder.folder_name}`
						: "📁 フォルダを選択してください"}
				</h2>
				<div class="folder-comment-container">
					{#if currentFolder && currentFolder.comment && currentFolder.comment.trim()}
						<p class="folder-comment">{currentFolder.comment}</p>
					{:else}
						<p class="folder-comment-placeholder">&nbsp;</p>
					{/if}
				</div>
			</div>
		</div>
		{#if currentFolder}
			<div class="folder-actions">
				{#if currentFolder.is_favorite}
					<!-- お気に入りフォルダの場合 -->
					<button class="btn btn-small btn-warning" on:click={removeFromFavorites}>
						⭐ お気に入りから削除
					</button>
				{:else}
					<!-- 自分のフォルダの場合 -->
					<button class="btn btn-small btn-share" on:click={shareFolder}>
						🔗 共有
					</button>
					<button
						class="btn btn-small btn-secondary"
						on:click={editFolder}
					>
						✏️ 編集
					</button>
					<button
						class="btn btn-small btn-danger"
						on:click={deleteFolder}
					>
						🗑️ 削除
					</button>
				{/if}
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

	.folder-header {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		min-height: 2.5rem;
	}

	.folder-title {
		margin: 0;
		font-size: 1.8rem;
		font-weight: 600;
		color: #333;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-shrink: 0;
	}

	.folder-comment-container {
		flex: 1;
		display: flex;
		align-items: center;
		min-width: 0;
	}

	.folder-comment,
	.folder-comment-placeholder {
		margin: 0;
		font-size: 1rem;
		color: #666;
		font-style: italic;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.folder-comment-placeholder {
		opacity: 0;
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

	.btn-share {
		background: #28a745;
		color: white;
	}

	.btn-share:hover {
		background: #218838;
	}

	.btn-warning {
		background: #f59e0b;
		color: white;
	}

	.btn-warning:hover {
		background: #d97706;
	}

	/* スマートフォン向けスタイル */
	@media (max-width: 768px) {
		.folder-title-section {
			position: static;
			top: auto;
			padding: 1rem 0.5rem;
		}
		
		.header-content {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
			padding: 0;
		}
		
		.folder-info {
			text-align: center;
		}

		.folder-header {
			flex-direction: column;
			gap: 0.5rem;
			min-height: auto;
		}
		
		.folder-title {
			font-size: 1.4rem;
			justify-content: center;
		}

		.folder-comment-container {
			width: 100%;
			justify-content: center;
		}
		
		.folder-comment,
		.folder-comment-placeholder {
			text-align: center;
			font-size: 0.9rem;
			white-space: normal;
			overflow: visible;
			text-overflow: unset;
		}
		
		.folder-actions {
			justify-content: center;
			flex-wrap: wrap;
			margin-top: 0;
		}
		
		.btn {
			flex: 1;
			min-width: 80px;
		}
		
		.btn-small {
			padding: 0.6rem 0.8rem;
			font-size: 0.75rem;
		}
	}
</style>
