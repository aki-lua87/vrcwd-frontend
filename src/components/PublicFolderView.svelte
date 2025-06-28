<script>
	import { onMount } from 'svelte';
	import WorldCard from './WorldCard.svelte';
	import SharedHeader from './SharedHeader.svelte';
	
	export let userId = '';
	export let folderId = '';
	
	let folderData = null;
	let worldsData = [];
	let loading = true;
	let error = '';
	let currentPage = 1;
	let totalPages = 1;
	let totalCount = 0;
	
	const CONFIG = {
		API_BASE_URL: "http://localhost:8787",
		PAGE_SIZE: 12,
	};
	
	// API Service for public endpoints
	class PublicApiService {
		constructor(baseUrl) {
			this.baseUrl = baseUrl;
		}
		
		async fetchPublicFolderItems(userId, folderId) {
			const url = `${this.baseUrl}/v2/u/${userId}/folders/${folderId}/items`;
			const response = await fetch(url);
			if (!response.ok) {
				if (response.status === 404) {
					throw new Error('フォルダーが見つからないか、非公開に設定されています。');
				} else if (response.status === 403) {
					throw new Error('このフォルダーは非公開です。');
				}
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.json();
		}
	}
	
	const apiService = new PublicApiService(CONFIG.API_BASE_URL);
	
	let allWorldsData = [];
	
	function updateCurrentPageData() {
		const startIndex = (currentPage - 1) * CONFIG.PAGE_SIZE;
		const endIndex = startIndex + CONFIG.PAGE_SIZE;
		worldsData = allWorldsData.slice(startIndex, endIndex);
	}
	
	function setWorldsData(data) {
		allWorldsData = data;
		totalCount = data.length;
		totalPages = Math.ceil(data.length / CONFIG.PAGE_SIZE);
		updateCurrentPageData();
	}
	
	function setCurrentPage(page) {
		currentPage = Math.max(1, Math.min(page, totalPages));
		updateCurrentPageData();
	}
	
	async function loadData() {
		loading = true;
		error = '';
		
		try {
			// Load worlds data (this will include folder information if successful)
			const worlds = await apiService.fetchPublicFolderItems(userId, folderId);
			setWorldsData(worlds);
			
			// Create basic folder data from the first world or use defaults
			if (worlds.length > 0) {
				// Try to extract folder info from the response or use defaults
				folderData = {
					id: folderId,
					folder_name: `フォルダー ${folderId}`,
					comment: '',
					is_private: false
				};
			} else {
				folderData = {
					id: folderId,
					folder_name: `フォルダー ${folderId}`,
					comment: '',
					is_private: false
				};
			}
			
			loading = false;
		} catch (err) {
			console.error('Error loading public folder:', err);
			error = err.message;
			loading = false;
		}
	}
	
	function previousPage() {
		if (currentPage > 1) {
			setCurrentPage(currentPage - 1);
		}
	}
	
	function nextPage() {
		if (currentPage < totalPages) {
			setCurrentPage(currentPage + 1);
		}
	}
	
	function copyShareUrl() {
		const currentUrl = window.location.href;
		navigator.clipboard.writeText(currentUrl).then(() => {
			alert('共有URLをクリップボードにコピーしました！');
		}).catch(() => {
			// Fallback for older browsers
			const textArea = document.createElement('textarea');
			textArea.value = currentUrl;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			alert('共有URLをクリップボードにコピーしました！');
		});
	}
	
	// Dummy handlers for WorldCard events (read-only mode)
	function handleOpenWorldDetails(data) {
		// In public view, we might want to show a simplified modal or redirect to VRChat
		const { worldId } = data;
		const world = allWorldsData.find(w => w.world_id === worldId);
		if (world) {
			const vrchatUrl = `https://vrchat.com/home/world/${worldId}/info`;
			window.open(vrchatUrl, '_blank');
		}
	}
	
	function handleSaveComment() {
		// Read-only mode - no comment editing
	}
	
	function handleRemoveFromFolder() {
		// Read-only mode - no removal
	}
	
	onMount(() => {
		if (userId && folderId) {
			loadData();
		} else {
			error = 'ユーザーIDまたはフォルダーIDが指定されていません。';
			loading = false;
		}
	});
</script>

<div class="public-folder-view">
	<SharedHeader />
	
	
	{#if loading}
		<div class="loading">データを読み込み中...</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else if folderData}
		<div class="folder-info">
			<div class="folder-header">
				<h2 class="folder-title">📁 {folderData.folder_name}</h2>
				{#if folderData.comment}
					<p class="folder-comment">{folderData.comment}</p>
				{/if}
				<div class="folder-meta">
					<span class="owner">👤 {userId}</span>
					<span class="count">🌍 {totalCount} ワールド</span>
					<button class="share-button" on:click={copyShareUrl}>
						🔗 URLをコピー
					</button>
				</div>
			</div>
		</div>
		
		{#if worldsData.length === 0}
			<div class="empty-message">
				このフォルダーにはワールドがありません。
			</div>
		{:else}
			<div class="worlds-container">
				<div class="worlds-grid">
					{#each worldsData as world (world.world_id)}
						<WorldCard 
							{world}
							onopenWorldDetails={handleOpenWorldDetails}
							onsaveComment={handleSaveComment}
							onremoveFromFolder={handleRemoveFromFolder}
							readonly={true}
						/>
					{/each}
				</div>
				
				{#if totalPages > 1}
					<div class="pagination">
						<button 
							class="btn btn-secondary" 
							on:click={previousPage}
							disabled={currentPage <= 1}
						>
							← 前のページ
						</button>
						
						<div class="page-info">
							{currentPage} / {totalPages} ページ (総 {totalCount} 件)
						</div>
						
						<button 
							class="btn btn-secondary" 
							on:click={nextPage}
							disabled={currentPage >= totalPages}
						>
							次のページ →
						</button>
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<style>
	.public-folder-view {
		min-height: 100vh;
		background: #f5f7fa;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	}

	.share-button {
		background: #667eea;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		transition: background-color 0.3s ease;
		font-size: 0.9rem;
		margin-left: 1rem;
	}

	.share-button:hover {
		background: #5a67d8;
	}

	.loading {
		text-align: center;
		padding: 3rem;
		font-size: 1.1rem;
		color: #666;
	}

	.error {
		background: #fee;
		color: #c33;
		padding: 1rem;
		border-radius: 6px;
		border-left: 4px solid #c33;
		margin: 2rem auto;
		max-width: 800px;
		text-align: center;
	}

	.folder-info {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem 1rem 1rem;
	}

	.folder-header {
		background: white;
		padding: 2rem;
		border-radius: 12px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	.folder-title {
		font-size: 2rem;
		font-weight: 600;
		color: #333;
		margin: 0 0 1rem 0;
	}

	.folder-comment {
		font-size: 1.1rem;
		color: #666;
		font-style: italic;
		margin: 0 0 1.5rem 0;
		line-height: 1.6;
	}

	.folder-meta {
		display: flex;
		justify-content: center;
		gap: 2rem;
		font-size: 1rem;
		color: #667eea;
	}

	.empty-message {
		text-align: center;
		padding: 3rem;
		color: #666;
		font-size: 1.1rem;
		background: white;
		margin: 2rem auto;
		max-width: 600px;
		border-radius: 12px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
	}

	.worlds-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 1rem;
	}

	.worlds-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		padding: 2rem 0;
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

	.btn-secondary {
		background: white;
		color: #333;
		border: 1px solid #eee;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.btn-secondary:hover:not(:disabled) {
		background: #f5f7fa;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none !important;
	}

	.page-info {
		font-weight: 500;
		color: #333;
		background: white;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	@media (max-width: 768px) {
		.header-content {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}

		.folder-meta {
			flex-direction: column;
			gap: 0.5rem;
		}

		.pagination {
			flex-direction: column;
			gap: 1rem;
		}
	}
</style>