<script>
	export let isVisible = false;
	export let worldData = null;
	export let folders = [];
	export let userId = '';
	
	// Svelte 5 event props
	export let onclose = () => {};
	export let onaddToFolder = () => {};
	export let onremoveFromFolder = () => {};
	
	let selectedFolderId = '';
	let folderComment = '';
	let worldInFolders = new Set();
	
	$: if (isVisible && worldData) {
		loadWorldFolderStatus();
	}
	
	async function loadWorldFolderStatus() {
		worldInFolders.clear();
		
		const authToken = localStorage.getItem('idToken') || 'legacy';
		
		const apiService = {
			async fetchFolderItems(token, folderId) {
				const formattedId = String(folderId).padStart(8, '0');
				const url = `${import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:8787'}/v2/folders/${formattedId}/items`;
				const response = await fetch(url, {
					headers: {
						'Authorization': `Bearer ${token}`
					}
				});
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				return await response.json();
			}
		};
		
		for (const folder of folders) {
			try {
				const items = await apiService.fetchFolderItems(authToken, folder.id);
				if (items.some(item => item.world_id === worldData.world_id)) {
					worldInFolders.add(folder.id);
				}
			} catch (error) {
				console.warn(`Failed to check folder ${folder.id}:`, error);
			}
		}
		// Trigger reactivity
		worldInFolders = new Set(worldInFolders);
	}
	
	function closeModal() {
		isVisible = false;
		onclose();
	}
	
	function openInVRChat() {
		if (worldData) {
			const vrchatUrl = `https://vrchat.com/home/world/${worldData.world_id}/info`;
			window.open(vrchatUrl, '_blank');
		}
	}
	
	async function addToFolder() {
		if (!selectedFolderId) {
			alert('フォルダーを選択してください。');
			return;
		}
		
		if (worldInFolders.has(parseInt(selectedFolderId))) {
			alert('このワールドは既にそのフォルダーに追加されています。');
			return;
		}
		
		onaddToFolder({
			folderId: selectedFolderId,
			worldId: worldData.world_id,
			comment: folderComment.trim() || null
		});
		
		// Update local state
		worldInFolders.add(parseInt(selectedFolderId));
		worldInFolders = new Set(worldInFolders);
		
		// Clear form
		selectedFolderId = '';
		folderComment = '';
	}
	
	function removeFromFolder(folderId) {
		if (confirm('このフォルダーからワールドを削除しますか？')) {
			onremoveFromFolder({
				folderId: folderId,
				worldId: worldData.world_id
			});
			
			// Update local state
			worldInFolders.delete(folderId);
			worldInFolders = new Set(worldInFolders);
		}
	}
	
	function handleModalClick(event) {
		if (event.target === event.currentTarget) {
			closeModal();
		}
	}
</script>

{#if isVisible && worldData}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal" on:click={handleModalClick}>
		<div class="modal-content">
			<div class="modal-header">
				<h2 class="modal-title">🌍 ワールド詳細</h2>
				<button class="close-btn" on:click={closeModal}>×</button>
			</div>
			
			<div class="world-details-content">
				<div class="world-details-grid">
					<div class="image-section">
						<img 
							src={worldData.world_thumbnail_image_url} 
							alt={worldData.world_name}
							class="world-image"
						/>
					</div>
					<div class="info-section">
						<div class="world-info">
							<h3 class="world-title">{worldData.world_name}</h3>
							<div class="world-author">👤 {worldData.world_author_name}</div>
						</div>
						
						<div class="world-actions">
							<button class="btn btn-primary" on:click={openInVRChat}>
								🌐 VRChatで開く
							</button>
						</div>
					</div>
				</div>

				<div class="description-section">
					<h4 class="section-title">📝 説明</h4>
					<div class="world-description">{worldData.world_description}</div>
				</div>

				<div class="folders-section">
					<h4 class="section-title">📁 フォルダー管理</h4>
					
					<div class="add-folder-form">
						<select bind:value={selectedFolderId} class="folder-select">
							<option value="">フォルダーを選択</option>
							{#each folders as folder (folder.id)}
								<option value={folder.id}>{folder.folder_name}</option>
							{/each}
						</select>
						<input
							type="text"
							bind:value={folderComment}
							class="comment-input"
							placeholder="コメント (任意)"
						/>
						<button class="btn btn-primary" on:click={addToFolder}>
							📂 フォルダーに追加
						</button>
					</div>

					<div class="folders-grid">
						{#each folders as folder (folder.id)}
							<div 
								class="folder-card"
								class:added={worldInFolders.has(folder.id)}
								on:click={() => worldInFolders.has(folder.id) ? removeFromFolder(folder.id) : null}
								role="button"
								tabindex="0"
								on:keydown
							>
								<div class="folder-name">📁 {folder.folder_name}</div>
								<div class="folder-comment">{folder.comment || 'コメントなし'}</div>
								{#if worldInFolders.has(folder.id)}
									<div class="added-badge">追加済み</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
		max-width: 800px;
		width: 90%;
		max-height: 90vh;
		overflow-y: auto;
		position: relative;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #eee;
	}

	.modal-title {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: #333;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #666;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-btn:hover {
		background: #f5f5f5;
		color: #333;
	}

	.world-details-content {
		padding: 2rem;
	}

	.world-details-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.world-image {
		width: 100%;
		height: 300px;
		object-fit: cover;
		border-radius: 8px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
	}

	.info-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.world-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		color: #333;
	}

	.world-author {
		font-size: 1rem;
		color: #667eea;
		padding: 0.5rem;
		background: #f8f9ff;
		border-radius: 4px;
		border-left: 3px solid #667eea;
		margin-bottom: 1rem;
	}

	.world-actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.btn-primary {
		background: #667eea;
		color: white;
	}

	.btn-primary:hover {
		background: #764ba2;
	}

	.section-title {
		font-size: 1.2rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: #333;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.description-section {
		margin-bottom: 2rem;
	}

	.world-description {
		color: #444;
		font-size: 0.9rem;
		line-height: 1.6;
		padding: 1rem;
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		border-radius: 8px;
		border-left: 4px solid #667eea;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	.folders-section {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 8px;
	}

	.add-folder-form {
		display: flex;
		gap: 1rem;
		align-items: center;
		flex-wrap: wrap;
		margin-bottom: 1.5rem;
	}

	.folder-select, .comment-input {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 0.9rem;
	}

	.folder-select {
		flex: 1;
		min-width: 200px;
	}

	.comment-input {
		flex: 2;
		min-width: 250px;
	}

	.folders-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 0.75rem;
	}

	.folder-card {
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		background: white;
		cursor: pointer;
		transition: all 0.2s ease;
		position: relative;
	}

	.folder-card:hover {
		border-color: #667eea;
		transform: translateY(-1px);
	}

	.folder-card.added {
		border-color: #667eea;
		background: #f8f9ff;
	}

	.folder-card.added:hover {
		background: #f0f4ff;
	}

	.folder-name {
		font-weight: 600;
		margin-bottom: 0.25rem;
	}

	.folder-comment {
		font-size: 0.8rem;
		color: #666;
	}

	.added-badge {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: #667eea;
		color: white;
		font-size: 0.7rem;
		padding: 0.2rem 0.4rem;
		border-radius: 12px;
	}

	@media (max-width: 768px) {
		.world-details-grid {
			grid-template-columns: 1fr;
		}

		.add-folder-form {
			flex-direction: column;
			align-items: stretch;
		}

		.folder-select, .comment-input {
			min-width: auto;
		}
	}
</style>