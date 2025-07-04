<script>
	export let favoritesFolders = [];
	export let currentFolder = null;
	export let onselectFavoriteFolder = () => {};
	export let onremoveFromFavorites = () => {};

	function formatFolderId(folderId) {
		if (!folderId || folderId === null || folderId === undefined) return "";
		return String(folderId).padStart(8, "0");
	}

	function isCurrentFavoriteFolder(favoriteFolder) {
		if (!currentFolder || !currentFolder.is_favorite) return false;
		return formatFolderId(favoriteFolder.folder_id) === currentFolder.id;
	}
</script>

{#if favoritesFolders.length > 0}
	<div class="favorites-section">
		<h2 class="favorites-title">⭐ お気に入り</h2>
		<div class="favorites-list">
			{#each favoritesFolders as favoriteFolder}
				<div class="favorite-folder-item">
					{#if favoriteFolder.is_private}
						<div class="favorite-folder private-folder">
							<div class="folder-content">
								<div class="folder-name">
									🔒 {favoriteFolder.folder_name}
								</div>
								<div class="folder-status">（非公開）</div>
							</div>
						</div>
					{:else}
						<button
							class="favorite-folder"
							class:selected={isCurrentFavoriteFolder(
								favoriteFolder,
							)}
							on:click={() =>
								onselectFavoriteFolder({
									folderId: formatFolderId(
										favoriteFolder.folder_id,
									),
									userId: favoriteFolder.owner_user_id,
								})}
						>
							<div class="folder-name">
								📁 {favoriteFolder.folder_name}
							</div>
							<div class="folder-owner">
								by {favoriteFolder.owner_user_name}
							</div>
						</button>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.favorites-section {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	.favorites-title {
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: #333;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border-bottom: 2px solid #eee;
	}

	.favorites-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.favorite-folder {
		width: 100%;
		text-align: left;
		background: #f8f9fa;
		border: none;
		border-radius: 8px;
		padding: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		border: 2px solid transparent;
	}

	.favorite-folder:hover {
		background: #e9ecef;
		border-color: #667eea;
		transform: translateY(-1px);
	}

	.favorite-folder.selected {
		background: #667eea;
		color: white;
		border-color: #667eea;
	}

	.favorite-folder.selected:hover {
		background: #5a67d8;
		border-color: #5a67d8;
	}

	.favorite-folder.selected .folder-name {
		color: white;
	}

	.favorite-folder.selected .folder-owner {
		color: rgba(255, 255, 255, 0.8);
	}

	.favorite-folder.private-folder {
		background: #ffe6e6;
		cursor: default;
		border-color: #f5b7b1;
	}

	.favorite-folder.private-folder:hover {
		background: #ffe6e6;
		border-color: #f5b7b1;
		transform: none;
	}

	.folder-content {
		flex: 1;
	}

	.folder-name {
		font-weight: 600;
		color: #333;
		margin-bottom: 0.25rem;
		font-size: 0.9rem;
	}

	.folder-owner {
		font-size: 0.8rem;
		color: #666;
	}

	.folder-status {
		font-size: 0.8rem;
		color: #d73a49;
		font-style: italic;
	}

	@media (max-width: 768px) {
		.favorites-section {
			padding: 1rem;
		}

		.favorites-title {
			font-size: 1rem;
		}

		.favorite-folder {
			padding: 0.75rem;
		}

		.folder-name {
			font-size: 0.85rem;
		}

		.folder-owner,
		.folder-status {
			font-size: 0.75rem;
		}
	}
</style>
