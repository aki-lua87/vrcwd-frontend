<script>
	import { onMount } from "svelte";
	import { CognitoAuthService } from "../lib/cognito-auth.ts";
	import SharedHeader from "./SharedHeader.svelte";
	import FolderSidebar from "./FolderSidebar.svelte";
	import FolderTitle from "./FolderTitle.svelte";
	import Stats from "./Stats.svelte";
	import WorldInput from "./WorldInput.svelte";
	import WorldsGrid from "./WorldsGrid.svelte";
	import Pagination from "./Pagination.svelte";
	import WorldDetailsModal from "./WorldDetailsModal.svelte";
	import FolderModal from "./FolderModal.svelte";
	import ShareModal from "./ShareModal.svelte";

	// Application state
	let folders = [];
	let currentFolder = null;
	let worldsData = [];
	let allWorldsData = [];
	let totalCount = 0;
	let currentPage = 1;
	let totalPages = 1;
	let userId = "";
	let authToken = "";
	let cognitoSubUserId = "";
	let loading = true;
	let error = "";
	let success = "";
	let searchQuery = "";
	let clearSearchFlag = false;

	// Sorting state
	let sortBy = "addition_at"; // 'world_name' or 'addition_at'
	let sortOrder = "desc"; // 'asc' or 'desc'

	// Ensure filteredWorldsData is initialized
	let filteredWorldsData = [];

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
		API_BASE_URL:
			import.meta.env.PUBLIC_API_BASE_URL || "http://localhost:8787",
		PAGE_SIZE: 10,
		DEFAULT_PAGE: 1,
	};

	// API Service
	class ApiService {
		constructor(baseUrl) {
			this.baseUrl = baseUrl;
		}

		async fetchFolders(token) {
			const url = `${this.baseUrl}/v2/folders`;
	
			const response = await fetch(url, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.json();
		}

		async createFolder(token, folderData) {
			const url = `${this.baseUrl}/v2/folders`;
			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(folderData),
			});
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.json();
		}

		async updateFolder(token, folderId, folderData) {
			const formattedId = String(folderId).padStart(8, "0");
			const url = `${this.baseUrl}/v2/folders/${formattedId}`;
			const response = await fetch(url, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(folderData),
			});
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.json();
		}

		async deleteFolder(token, folderId) {
			const formattedId = String(folderId).padStart(8, "0");
			const url = `${this.baseUrl}/v2/folders/${formattedId}`;
			const response = await fetch(url, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.json();
		}

		async fetchFolderItems(token, folderId) {
			const formattedId = String(folderId).padStart(8, "0");
			const url = `${this.baseUrl}/v2/folders/${formattedId}/items`;
			const response = await fetch(url, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.json();
		}

		async addWorldToFolder(token, folderId, worldData) {
			const formattedId = String(folderId).padStart(8, "0");
			const url = `${this.baseUrl}/v2/folders/${formattedId}/items`;
			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(worldData),
			});
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.json();
		}

		async updateWorldComment(token, folderId, worldId, comment) {
			const formattedId = String(folderId).padStart(8, "0");
			const url = `${this.baseUrl}/v2/folders/${formattedId}/items/${worldId}`;
			const response = await fetch(url, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ comment }),
			});
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.json();
		}

		async removeWorldFromFolder(token, folderId, worldId) {
			const formattedId = String(folderId).padStart(8, "0");
			const url = `${this.baseUrl}/v2/folders/${formattedId}/items/${worldId}`;
			const response = await fetch(url, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.json();
		}

		async addWorldToMaster(token, worldId) {
			const url = `${this.baseUrl}/v2/worlds`;
			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
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
	function formatFolderId(folderId) {
		if (!folderId) return "";
		return String(folderId).padStart(8, "0");
	}

	function filterWorldsData() {
		if (!searchQuery || !searchQuery.trim()) {
			filteredWorldsData = [...allWorldsData];
		} else {
			const query = searchQuery.toLowerCase().trim();

			filteredWorldsData = allWorldsData.filter((world) => {
				// ワールド名での検索
				const worldName = world.world_name?.toLowerCase() || "";
				// 作者名での検索
				const authorName = world.world_author_name?.toLowerCase() || "";
				// 説明での検索
				const description =
					world.world_description?.toLowerCase() || "";

				return (
					worldName.includes(query) ||
					authorName.includes(query) ||
					description.includes(query)
				);
			});
		}

		totalCount = filteredWorldsData.length;
		totalPages = Math.ceil(filteredWorldsData.length / CONFIG.PAGE_SIZE);

		// Reset to first page when search changes
		if (currentPage > totalPages && totalPages > 0) {
			currentPage = 1;
		} else if (totalPages === 0) {
			currentPage = 1;
		}

		updateCurrentPageData();
	}

	function updateCurrentPageData() {
		const startIndex = (currentPage - 1) * CONFIG.PAGE_SIZE;
		const endIndex = startIndex + CONFIG.PAGE_SIZE;
		
		console.log('🔄 updateCurrentPageData called');
		console.log('📄 Page info:', { currentPage, startIndex, endIndex });
		console.log('📊 filteredWorldsData.length:', filteredWorldsData.length);
		
		worldsData = filteredWorldsData.slice(startIndex, endIndex);
		
		console.log('✅ worldsData updated, length:', worldsData.length);
		if (worldsData.length > 0) {
			console.log('📄 Current page items:');
			for (let i = 0; i < Math.min(3, worldsData.length); i++) {
				const item = worldsData[i];
				console.log(`  ${i + 1}. ${item.world_name} - addition_at: ${item.addition_at}`);
			}
		}
		
		// Force reactivity update
		worldsData = [...worldsData];
	}

	function setWorldsData(data) {
		console.log('📥 setWorldsData called with data length:', data.length);
		if (data.length > 0) {
			console.log('📋 First data item:', {
				world_name: data[0].world_name,
				addition_at: data[0].addition_at,
				created_at: data[0].created_at
			});
		}
		allWorldsData = sortWorldsData(data);
		console.log('✅ allWorldsData updated, length:', allWorldsData.length);
		filterWorldsData();
	}

	function sortWorldsData(data) {
		console.log('🔄 Sorting data by:', sortBy, 'order:', sortOrder);
		console.log('📊 Data length:', data.length);
		
		// Show first 5 items before sorting when sorting by addition_at
		if (sortBy === "addition_at" && data.length > 0) {
			console.log('📋 First 5 items before sorting:');
			for (let i = 0; i < Math.min(5, data.length); i++) {
				const item = data[i];
				console.log(`${i + 1}. ${item.world_name} - addition_at: ${item.addition_at} - created_at: ${item.created_at}`);
			}
		}
		
		const sorted = [...data].sort((a, b) => {
			let aValue, bValue;

			if (sortBy === "world_name") {
				aValue = (a.world_name || "").toLowerCase();
				bValue = (b.world_name || "").toLowerCase();
				// String comparison
				if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
				if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
				return 0;
			} else if (sortBy === "addition_at") {
				// Parse addition_at as Date if it's a string, otherwise use as number
				if (typeof a.addition_at === 'string') {
					aValue = new Date(a.addition_at).getTime();
				} else {
					aValue = Number(a.addition_at || a.created_at || 0);
				}
				
				if (typeof b.addition_at === 'string') {
					bValue = new Date(b.addition_at).getTime();
				} else {
					bValue = Number(b.addition_at || b.created_at || 0);
				}
				
				// Numeric comparison for timestamps
				return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
			}

			return 0;
		});

		// Show first 5 items after sorting when sorting by addition_at
		if (sortBy === "addition_at" && sorted.length > 0) {
			console.log('✅ First 5 items after sorting:');
			for (let i = 0; i < Math.min(5, sorted.length); i++) {
				const item = sorted[i];
				console.log(`${i + 1}. ${item.world_name} - addition_at: ${item.addition_at}`);
			}
		}
		
		console.log('✅ Sorted data length:', sorted.length);
		return sorted;
	}

	function updateSorting(newSortBy) {
		console.log('🔀 updateSorting called with:', newSortBy);
		console.log('📝 Current state - sortBy:', sortBy, 'sortOrder:', sortOrder);
		
		if (sortBy === newSortBy) {
			// Toggle order if same field
			sortOrder = sortOrder === "asc" ? "desc" : "asc";
			console.log('🔄 Toggled order to:', sortOrder);
		} else {
			// Set new field and default to desc for date, asc for name
			sortBy = newSortBy;
			sortOrder = newSortBy === "world_name" ? "asc" : "desc";
			console.log('📋 New sorting - sortBy:', sortBy, 'sortOrder:', sortOrder);
		}

		// Re-sort and update display - call sortWorldsData directly and then filter
		if (allWorldsData.length > 0) {
			console.log('🔄 Re-sorting allWorldsData with length:', allWorldsData.length);
			allWorldsData = sortWorldsData(allWorldsData);
			// Force reactivity update for allWorldsData
			allWorldsData = [...allWorldsData];
			filterWorldsData();
		} else {
			console.log('⚠️ No data to sort');
		}
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

		if (trimmedInput.startsWith("wrld_")) {
			return trimmedInput;
		}

		const urlPatterns = [
			/vrchat\.com\/home\/content\/worlds\/(wrld_[a-f0-9\-]+)/,
			/vrchat\.com\/home\/world\/(wrld_[a-f0-9\-]+)/,
			/vrchat\.com\/home\/launch\?.*worldId=(wrld_[a-f0-9\-]+)/,
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
			success = "";
		}, 3000);
	}

	function showError(message) {
		error = message;
		// Auto-dismiss error after 8 seconds
		setTimeout(() => {
			if (error === message) {
				// Only clear if the error hasn't changed
				error = "";
			}
		}, 8000);
	}

	// Event handlers
	async function loadData() {
		loading = true;
		error = "";


		try {
			const foldersData = await apiService.fetchFolders(authToken);
			folders = foldersData;

			// Update currentFolder reference to the latest data
			if (currentFolder) {
				const updatedCurrentFolder = folders.find(
					(f) => f.id === currentFolder.id,
				);
				if (updatedCurrentFolder) {
					currentFolder = updatedCurrentFolder;
				} else {
					// Current folder was deleted, select the first available folder
					currentFolder = folders.length > 0 ? folders[0] : null;
				}
			} else if (folders.length > 0) {
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

			const worldsDataResult = await apiService.fetchFolderItems(
				authToken,
				currentFolder.id,
			);
			resetPagination();
			searchQuery = ""; // Reset search query when changing folders
			clearSearchFlag = !clearSearchFlag; // Toggle to trigger SearchBox reset
			setWorldsData(worldsDataResult);
		} catch (err) {
			console.error("Error loading worlds:", err);
			showError("ワールドの読み込みに失敗しました。");
		}
	}

	function handleSelectFolder(data) {
		const folderId = data.folderId;
		const folder = folders.find((f) => f.id == folderId);
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
		if (
			confirm("このフォルダーとその中のすべてのワールドを削除しますか？")
		) {
			try {
				await apiService.deleteFolder(authToken, folderId);
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
				await apiService.addWorldToMaster(authToken, worldId);
			} catch (err) {
				if (!err.message.includes("409")) {
					throw err;
				}
			}

			await apiService.addWorldToFolder(authToken, currentFolder.id, {
				world_id: worldId,
			});

			showSuccess("ワールドを追加しました。");
			await loadWorldsForCurrentFolder();
		} catch (err) {
			console.error("Error adding world:", err);
			if (err.message.includes("404")) {
				showError(
					"ワールドが見つかりません。ワールドIDを確認してください。",
				);
			} else {
				showError("ワールドの追加に失敗しました。");
			}
		}
	}

	async function handleSaveComment(data) {
		const { worldId, comment } = data;

		try {
			await apiService.updateWorldComment(
				authToken,
				currentFolder.id,
				worldId,
				comment,
			);

			// Update local state
			const world = allWorldsData.find((w) => w.world_id === worldId);
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
				await apiService.removeWorldFromFolder(
					authToken,
					currentFolder.id,
					worldId,
				);
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
		const worldData = allWorldsData.find((w) => w.world_id === worldId);
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

	function handleSearch(event) {
		const query = event.detail?.query || "";
		searchQuery = query;
		filterWorldsData();
	}

	function handleCloseWorldDetails() {
		showWorldDetailsModal = false;
		selectedWorldData = null;
	}

	async function handleAddToFolderFromModal(data) {
		const { folderId, worldId, comment } = data;

		try {
			await apiService.addWorldToFolder(authToken, folderId, {
				world_id: worldId,
				comment: comment,
			});

			showSuccess("ワールドをフォルダーに追加しました。");

			// Update main dashboard if the folder is currently selected
			if (currentFolder && currentFolder.id == folderId) {
				await loadWorldsForCurrentFolder();
			}
		} catch (err) {
			console.error("Error adding to folder:", err);
			showError("フォルダーへの追加に失敗しました。");
		}
	}

	async function handleRemoveFromFolderFromModal(data) {
		const { folderId, worldId } = data;

		try {
			await apiService.removeWorldFromFolder(
				authToken,
				folderId,
				worldId,
			);
			showSuccess("フォルダーからワールドを削除しました。");

			// Update main dashboard if the folder is currently selected
			if (currentFolder && currentFolder.id == folderId) {
				await loadWorldsForCurrentFolder();
			}
		} catch (err) {
			console.error("Error removing from folder:", err);
			showError("フォルダーからの削除に失敗しました。");
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
				await apiService.updateFolder(authToken, folderId, folderData);
				showSuccess("フォルダーを更新しました。");
			} else {
				await apiService.createFolder(authToken, folderData);
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
			authToken = "legacy"; // Use a placeholder for legacy mode
			loadData();
			return;
		}

		// Check new Cognito authentication (auth_tokens format)
		try {
			const authTokensStr = localStorage.getItem("auth_tokens");
			if (authTokensStr) {
				const authTokens = JSON.parse(authTokensStr);
				const idToken = authTokens.idToken;

				if (!idToken) {
					console.error("No idToken in auth_tokens");
					window.location.href = "/";
					return;
				}

				// Verify token is not expired
				const tokenPayload = JSON.parse(atob(idToken.split(".")[1]));
				if (tokenPayload.exp * 1000 < Date.now()) {
					localStorage.removeItem("auth_tokens");
					window.location.href = "/";
					return;
				}

				// Extract user info from token
				const userEmail =
					tokenPayload.email || tokenPayload["cognito:username"];
				userId = userEmail;
				cognitoSubUserId = tokenPayload.sub || userEmail;
				authToken = idToken;

				loadData();
				return;
			}
		} catch (error) {
			console.error("Error parsing auth_tokens:", error);
		}

		// Fallback: Check old format for backward compatibility
		const idToken = localStorage.getItem("idToken");
		const userEmail = localStorage.getItem("userEmail");

		if (!idToken || !userEmail) {
			window.location.href = "/";
			return;
		}

		// Verify token is not expired
		try {
			const tokenPayload = JSON.parse(atob(idToken.split(".")[1]));
			if (tokenPayload.exp * 1000 < Date.now()) {
				localStorage.removeItem("idToken");
				localStorage.removeItem("accessToken");
				localStorage.removeItem("refreshToken");
				localStorage.removeItem("userEmail");
				window.location.href = "/";
				return;
			}

			userId = userEmail;
			cognitoSubUserId = tokenPayload.sub || userEmail;
			authToken = idToken;
			loadData();
		} catch (error) {
			console.error("Authentication check failed:", error);
			window.location.href = "/";
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
			{:else}
				{#if error}
					<div class="error">
						<div class="error-icon">⚠️</div>
						<div class="error-content">
							<div class="error-title">エラーが発生しました</div>
							<div class="error-message">{error}</div>
							<button
								class="error-dismiss"
								on:click={() => (error = "")}>×</button
							>
						</div>
					</div>
				{/if}

				{#if success}
					<div class="success">
						<div class="success-icon">✅</div>
						<div class="success-content">
							<span>{success}</span>
							<button
								class="success-dismiss"
								on:click={() => (success = "")}>×</button
							>
						</div>
					</div>
				{/if}

				<WorldInput
					disabled={!currentFolder}
					onaddWorld={handleAddWorld}
				/>

				<Stats
					totalWorlds={totalCount}
					disabled={!currentFolder}
					clearSearch={clearSearchFlag}
					on:search={handleSearch}
				/>

				<!-- Sorting Controls -->
				{#if currentFolder}
					<div class="sorting-controls">
						<div class="sort-label">並べ替え:</div>
						<button
							class="sort-btn"
							class:active={sortBy === "world_name"}
							on:click={() => updateSorting("world_name")}
						>
							ワールド名
							{#if sortBy === "world_name"}
								<span class="sort-icon"
									>{sortOrder === "asc" ? "↑" : "↓"}</span
								>
							{/if}
						</button>
						<button
							class="sort-btn"
							class:active={sortBy === "addition_at"}
							on:click={() => updateSorting("addition_at")}
						>
							追加日時
							{#if sortBy === "addition_at"}
								<span class="sort-icon"
									>{sortOrder === "asc" ? "↑" : "↓"}</span
								>
							{/if}
						</button>
					</div>
				{/if}

				{#key `${sortBy}-${sortOrder}-${currentPage}-${worldsData.length}`}
					<WorldsGrid
						{worldsData}
						onopenWorldDetails={handleOpenWorldDetails}
						onsaveComment={handleSaveComment}
						onremoveFromFolder={handleRemoveFromFolder}
					/>
				{/key}

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
		userId={cognitoSubUserId || userId}
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
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
			sans-serif;
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
		border: 1px solid #f5b7b1;
		border-radius: 8px;
		margin-bottom: 1rem;
		box-shadow: 0 2px 4px rgba(220, 53, 69, 0.1);
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1rem;
		position: relative;
		animation: slideIn 0.3s ease-out;
	}

	.error-icon {
		font-size: 1.2rem;
		flex-shrink: 0;
		margin-top: 0.1rem;
	}

	.error-content {
		flex: 1;
		min-width: 0;
	}

	.error-title {
		font-weight: 600;
		font-size: 0.95rem;
		margin-bottom: 0.25rem;
	}

	.error-message {
		font-size: 0.9rem;
		line-height: 1.4;
		opacity: 0.9;
	}

	.error-dismiss {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: none;
		border: none;
		font-size: 1.2rem;
		cursor: pointer;
		color: #c33;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s;
	}

	.error-dismiss:hover {
		background: rgba(220, 53, 69, 0.1);
	}

	.success {
		background: #d4edda;
		color: #28a745;
		border: 1px solid #b7f5b7;
		border-radius: 8px;
		margin-bottom: 1rem;
		box-shadow: 0 2px 4px rgba(40, 167, 69, 0.1);
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		position: relative;
		animation: slideIn 0.3s ease-out;
	}

	.success-icon {
		font-size: 1.2rem;
		flex-shrink: 0;
	}

	.success-content {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.success-dismiss {
		background: none;
		border: none;
		font-size: 1.2rem;
		cursor: pointer;
		color: #28a745;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s;
		flex-shrink: 0;
	}

	.success-dismiss:hover {
		background: rgba(40, 167, 69, 0.1);
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Sorting Controls */
	.sorting-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 0;
		margin-bottom: 1rem;
		border-bottom: 1px solid #eee;
	}

	.sort-label {
		font-weight: 600;
		color: #333;
		font-size: 0.9rem;
	}

	.sort-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		background: white;
		color: #666;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.sort-btn:hover {
		border-color: #667eea;
		color: #667eea;
		transform: translateY(-1px);
	}

	.sort-btn.active {
		border-color: #667eea;
		background: #667eea;
		color: white;
	}

	.sort-btn.active:hover {
		background: #5a67d8;
		border-color: #5a67d8;
	}

	.sort-icon {
		font-size: 0.8rem;
		font-weight: bold;
	}

	@media (max-width: 768px) {
		.main-container {
			flex-direction: column;
			gap: 1rem;
		}
	}
</style>
