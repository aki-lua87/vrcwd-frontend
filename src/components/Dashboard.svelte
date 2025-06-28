<script>
	import { onMount } from 'svelte';
	import { CognitoAuthService } from '../lib/cognito-auth.ts';
	import SharedHeader from './SharedHeader.svelte';
	import FolderSidebar from './FolderSidebar.svelte';
	import FolderTitle from './FolderTitle.svelte';
	import Stats from './Stats.svelte';
	import WorldInput from './WorldInput.svelte';
	import WorldsGrid from './WorldsGrid.svelte';
	import Pagination from './Pagination.svelte';
	import WorldDetailsModal from './WorldDetailsModal.svelte';
	import FolderModal from './FolderModal.svelte';
	import ShareModal from './ShareModal.svelte';
	
	// Application state
	let folders = [];
	let currentFolder = null;
	let worldsData = [];
	let allWorldsData = [];
	let totalCount = 0;
	let currentPage = 1;
	let totalPages = 1;
	let userId = '';
	let loading = true;
	let error = '';
	let success = '';
	
	// World details modal state
	let showWorldDetailsModal = false;
	let selectedWorldData = null;
	
	// Folder modal state
	let showFolderModal = false;
	let editingFolder = null;
	
	// Share modal state
	let showShareModal = false;
	
	// Configuration
	const CONFIG = {
		API_BASE_URL: "http://localhost:8787",
		PAGE_SIZE: 10,
		DEFAULT_PAGE: 1,
	};
	
	// API Service
	class ApiService {
		constructor(baseUrl) {
			this.baseUrl = baseUrl;
		}

		async fetchFolders(userId) {
			const url = `${this.baseUrl}/v2/u/${userId}/folders`;
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.json();
		}

		async createFolder(userId, folderData) {
			const url = `${this.baseUrl}/v2/u/${userId}/folders`;
			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(folderData),
			});
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.json();
		}

		async updateFolder(userId, folderId, folderData) {
			const url = `${this.baseUrl}/v2/u/${userId}/folders/${folderId}`;
			const response = await fetch(url, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(folderData),
			});
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.json();
		}

		async deleteFolder(userId, folderId) {
			const url = `${this.baseUrl}/v2/u/${userId}/folders/${folderId}`;
			const response = await fetch(url, {
				method: "DELETE",
			});
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.json();
		}

		async fetchFolderItems(userId, folderId) {
			const url = `${this.baseUrl}/v2/u/${userId}/folders/${folderId}/items`;
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.json();
		}

		async addWorldToFolder(userId, folderId, worldData) {
			const url = `${this.baseUrl}/v2/u/${userId}/folders/${folderId}/items`;
			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(worldData),
			});
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.json();
		}

		async updateWorldComment(userId, folderId, worldId, comment) {
			const url = `${this.baseUrl}/v2/u/${userId}/folders/${folderId}/items/${worldId}`;
			const response = await fetch(url, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ comment }),
			});
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.json();
		}

		async removeWorldFromFolder(userId, folderId, worldId) {
			const url = `${this.baseUrl}/v2/u/${userId}/folders/${folderId}/items/${worldId}`;
			const response = await fetch(url, {
				method: "DELETE",
			});
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.json();
		}

		async addWorldToMaster(worldId) {
			const url = `${this.baseUrl}/v2/worlds`;
			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ world_id: worldId }),
			});
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.json();
		}
	}
	
	const apiService = new ApiService(CONFIG.API_BASE_URL);
	
	// Helper functions
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
	
	function resetPagination() {
		currentPage = 1;
		updateCurrentPageData();
	}
	
	function extractWorldIdFromInput(input) {
		const trimmedInput = input.trim();
		
		if (trimmedInput.startsWith('wrld_')) {
			return trimmedInput;
		}
		
		const urlPatterns = [
			/vrchat\.com\/home\/content\/worlds\/(wrld_[a-f0-9\-]+)/,
			/vrchat\.com\/home\/world\/(wrld_[a-f0-9\-]+)/,
			/vrchat\.com\/home\/launch\?.*worldId=(wrld_[a-f0-9\-]+)/
		];
		
		for (const pattern of urlPatterns) {
			const match = trimmedInput.match(pattern);
			if (match) {
				return match[1];
			}
		}
		
		return null;
	}
	
	function showSuccess(message) {
		success = message;
		setTimeout(() => {
			success = '';
		}, 3000);
	}
	
	function showError(message) {
		error = message;
		setTimeout(() => {
			error = '';
		}, 5000);
	}
	
	// Event handlers
	async function loadData() {
		loading = true;
		error = '';
		
		try {
			const foldersData = await apiService.fetchFolders(userId);
			folders = foldersData;
			
			if (!currentFolder && folders.length > 0) {
				currentFolder = folders[0];
			}
			
			await loadWorldsForCurrentFolder();
			loading = false;
		} catch (err) {
			console.error("Error loading data:", err);
			error = "データの読み込みに失敗しました。";
			loading = false;
		}
	}
	
	async function loadWorldsForCurrentFolder() {
		try {
			if (!currentFolder) {
				setWorldsData([]);
				return;
			}

			const worldsDataResult = await apiService.fetchFolderItems(userId, currentFolder.id);
			resetPagination();
			setWorldsData(worldsDataResult);
		} catch (err) {
			console.error("Error loading worlds:", err);
			showError("ワールドの読み込みに失敗しました。");
		}
	}
	
	function handleSelectFolder(data) {
		const folderId = data.folderId;
		const folder = folders.find(f => f.id == folderId);
		currentFolder = folder;
		loadWorldsForCurrentFolder();
	}
	
	function handleCreateFolder() {
		editingFolder = null;
		showFolderModal = true;
	}
	
	function handleEditFolder(data) {
		editingFolder = data.folder;
		showFolderModal = true;
	}
	
	async function handleDeleteFolder(data) {
		const folderId = data.folderId;
		if (confirm("このフォルダーとその中のすべてのワールドを削除しますか？")) {
			try {
				await apiService.deleteFolder(userId, folderId);
				showSuccess("フォルダーを削除しました。");
				await loadData();
			} catch (err) {
				console.error("Error deleting folder:", err);
				showError("フォルダーの削除に失敗しました。");
			}
		}
	}
	
	async function handleAddWorld(data) {
		const inputValue = data.worldInput;
		const worldId = extractWorldIdFromInput(inputValue);
		
		if (!worldId) {
			showError("正しいワールドIDまたはVRChatのURLを入力してください。");
			return;
		}

		if (!currentFolder) {
			showError("ワールドを追加するフォルダーを選択してください。");
			return;
		}

		try {
			try {
				await apiService.addWorldToMaster(worldId);
			} catch (err) {
				if (!err.message.includes("409")) {
					throw err;
				}
			}

			await apiService.addWorldToFolder(userId, currentFolder.id, {
				world_id: worldId,
			});

			showSuccess("ワールドを追加しました。");
			await loadWorldsForCurrentFolder();
		} catch (err) {
			console.error("Error adding world:", err);
			if (err.message.includes("404")) {
				showError("ワールドが見つかりません。ワールドIDを確認してください。");
			} else {
				showError("ワールドの追加に失敗しました。");
			}
		}
	}
	
	async function handleSaveComment(data) {
		const { worldId, comment } = data;
		
		try {
			await apiService.updateWorldComment(userId, currentFolder.id, worldId, comment);
			
			// Update local state
			const world = allWorldsData.find(w => w.world_id === worldId);
			if (world) {
				world.comment = comment;
				setWorldsData(allWorldsData);
			}
			
			showSuccess("コメントを更新しました。");
		} catch (err) {
			console.error("Error saving comment:", err);
			showError("コメントの保存に失敗しました。");
		}
	}
	
	async function handleRemoveFromFolder(data) {
		const { worldId } = data;
		
		if (confirm("このワールドをフォルダーから削除しますか？")) {
			try {
				await apiService.removeWorldFromFolder(userId, currentFolder.id, worldId);
				showSuccess("ワールドを削除しました。");
				await loadWorldsForCurrentFolder();
			} catch (err) {
				console.error("Error removing world:", err);
				showError("ワールドの削除に失敗しました。");
			}
		}
	}
	
	function handleOpenWorldDetails(data) {
		const { worldId } = data;
		const worldData = allWorldsData.find(w => w.world_id === worldId);
		if (worldData) {
			selectedWorldData = worldData;
			showWorldDetailsModal = true;
		} else {
			showError("ワールドデータが見つかりません。");
		}
	}
	
	function handlePageChange(data) {
		const { page } = data;
		setCurrentPage(page);
	}
	
	function handleCloseWorldDetails() {
		showWorldDetailsModal = false;
		selectedWorldData = null;
	}
	
	async function handleAddToFolderFromModal(data) {
		const { folderId, worldId, comment } = data;
		
		try {
			await apiService.addWorldToFolder(userId, folderId, {
				world_id: worldId,
				comment: comment
			});
			
			showSuccess('ワールドをフォルダーに追加しました。');
			
			// Update main dashboard if the folder is currently selected
			if (currentFolder && currentFolder.id == folderId) {
				await loadWorldsForCurrentFolder();
			}
		} catch (err) {
			console.error('Error adding to folder:', err);
			showError('フォルダーへの追加に失敗しました。');
		}
	}
	
	async function handleRemoveFromFolderFromModal(data) {
		const { folderId, worldId } = data;
		
		try {
			await apiService.removeWorldFromFolder(userId, folderId, worldId);
			showSuccess('フォルダーからワールドを削除しました。');
			
			// Update main dashboard if the folder is currently selected
			if (currentFolder && currentFolder.id == folderId) {
				await loadWorldsForCurrentFolder();
			}
		} catch (err) {
			console.error('Error removing from folder:', err);
			showError('フォルダーからの削除に失敗しました。');
		}
	}
	
	function handleCloseFolderModal() {
		showFolderModal = false;
		editingFolder = null;
	}
	
	async function handleSaveFolder(data) {
		const { folderData, isEditing, folderId } = data;
		
		try {
			if (isEditing) {
				await apiService.updateFolder(userId, folderId, folderData);
				showSuccess("フォルダーを更新しました。");
			} else {
				await apiService.createFolder(userId, folderData);
				showSuccess("フォルダーを作成しました。");
			}
			
			// Reload data to reflect changes
			await loadData();
		} catch (err) {
			console.error("Error saving folder:", err);
			showError("フォルダーの保存に失敗しました。");
		}
	}
	
	function handleShareFolder(data) {
		if (data.folder && data.userId) {
			showShareModal = true;
		}
	}
	
	function handleCloseShareModal() {
		showShareModal = false;
	}
	
	// Initialize on mount
	onMount(async () => {
		// Check for legacy userId first (backward compatibility)
		const storedUserId = localStorage.getItem("userId");
		if (storedUserId) {
			userId = storedUserId;
			loadData();
			return;
		}

		// Check Cognito authentication
		try {
			const cognitoConfig = {
				region: import.meta.env.COGNITO_REGION || 'us-east-1',
				userPoolId: import.meta.env.COGNITO_USER_POOL_ID || '',
				clientId: import.meta.env.COGNITO_CLIENT_ID || '',
			};

			const authService = new CognitoAuthService(cognitoConfig);
			
			if (!authService.isAuthenticated()) {
				window.location.href = "/login";
				return;
			}

			const userInfo = await authService.getCurrentUser();
			if (!userInfo) {
				window.location.href = "/login";
				return;
			}

			userId = userInfo.username;
			loadData();
		} catch (error) {
			console.error('Authentication check failed:', error);
			window.location.href = "/login";
		}
	});
</script>

<div class="dashboard">
	<SharedHeader />
	
	<FolderTitle 
		{currentFolder}
		{userId}
		oneditFolder={handleEditFolder}
		ondeleteFolder={handleDeleteFolder}
		onshareFolder={handleShareFolder}
	/>
	
	<div class="main-container">
		<FolderSidebar 
			{folders}
			{currentFolder}
			onselectFolder={handleSelectFolder}
			oncreateFolder={handleCreateFolder}
			oneditFolder={handleEditFolder}
			ondeleteFolder={handleDeleteFolder}
		/>
		
		<div class="main-content">
			{#if loading}
				<div class="loading">データを読み込み中...</div>
			{:else if error}
				<div class="error">{error}</div>
			{:else}
				{#if success}
					<div class="success">{success}</div>
				{/if}
				
				<Stats totalWorlds={totalCount} />
				
				<WorldInput 
					disabled={!currentFolder}
					onaddWorld={handleAddWorld}
				/>
				
				<WorldsGrid 
					{worldsData}
					onopenWorldDetails={handleOpenWorldDetails}
					onsaveComment={handleSaveComment}
					onremoveFromFolder={handleRemoveFromFolder}
				/>
				
				<Pagination 
					{currentPage}
					{totalPages}
					{totalCount}
					onpageChange={handlePageChange}
				/>
			{/if}
		</div>
	</div>
	
	<!-- World Details Modal -->
	<WorldDetailsModal
		isVisible={showWorldDetailsModal}
		worldData={selectedWorldData}
		{folders}
		{userId}
		onclose={handleCloseWorldDetails}
		onaddToFolder={handleAddToFolderFromModal}
		onremoveFromFolder={handleRemoveFromFolderFromModal}
	/>
	
	<!-- Folder Modal -->
	<FolderModal
		isVisible={showFolderModal}
		{editingFolder}
		onclose={handleCloseFolderModal}
		onsave={handleSaveFolder}
	/>
	
	<!-- Share Modal -->
	<ShareModal
		isVisible={showShareModal}
		folderData={currentFolder}
		{userId}
		onclose={handleCloseShareModal}
	/>
</div>

<style>
	:global(*) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		background: #f5f7fa;
		color: #333;
		line-height: 1.6;
	}

	.dashboard {
		min-height: 100vh;
	}

	.main-container {
		max-width: 1400px;
		margin: 0 auto;
		display: flex;
		gap: 2rem;
		padding: 2rem 1rem;
	}

	.main-content {
		flex: 1;
		min-width: 0;
	}

	.loading {
		text-align: center;
		padding: 2rem;
		font-size: 1.1rem;
		color: #666;
	}

	.error {
		background: #fee;
		color: #c33;
		padding: 1rem;
		border-radius: 6px;
		border-left: 4px solid #c33;
		margin-bottom: 1rem;
	}

	.success {
		background: #d4edda;
		color: #28a745;
		padding: 1rem;
		border-radius: 6px;
		border-left: 4px solid #28a745;
		margin-bottom: 1rem;
	}

	@media (max-width: 768px) {
		.main-container {
			flex-direction: column;
			gap: 1rem;
		}
	}
</style>