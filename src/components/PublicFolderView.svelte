<script>
	import { onMount } from "svelte";
	import WorldCard from "./WorldCard.svelte";
	import SharedHeader from "./SharedHeader.svelte";
	import WorldDetailsModal from "./WorldDetailsModal.svelte";

	export let userId = "";
	export let folderId = "";

	let folderData = null;
	let worldsData = [];
	let loading = true;
	let error = "";
	let currentPage = 1;
	let totalPages = 1;
	let totalCount = 0;

	// Authentication state
	let isAuthenticated = false;
	let authToken = "";
	let userFolders = [];

	// Modal state
	let showWorldDetailsModal = false;
	let selectedWorldData = null;

	// Sorting state
	let sortBy = "addition_at"; // 'world_name' or 'addition_at'
	let sortOrder = "desc"; // 'asc' or 'desc'

	const CONFIG = {
		API_BASE_URL:
			import.meta.env.PUBLIC_API_BASE_URL || "http://localhost:8787",
		PAGE_SIZE: 12,
	};

	// API Service for public endpoints
	class PublicApiService {
		constructor(baseUrl) {
			this.baseUrl = baseUrl;
		}

		async fetchFolderInfo(folderId) {
			const formattedId = String(folderId).padStart(8, "0");
			const url = `${this.baseUrl}/v2/folders/${formattedId}/info`;
			const response = await fetch(url);
			if (!response.ok) {
				if (response.status === 400) {
					throw new Error("無効なフォルダID形式です。");
				} else if (response.status === 404) {
					throw new Error("フォルダーが見つかりません。");
				}
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.json();
		}

		async fetchPublicFolderItems(userId, folderId) {
			const formattedId = String(folderId).padStart(8, "0");
			const url = `${this.baseUrl}/v2/u/${userId}/folders/${formattedId}/items`;
			const response = await fetch(url);
			if (!response.ok) {
				if (response.status === 404) {
					throw new Error(
						"フォルダーが見つからないか、非公開に設定されています。",
					);
				} else if (response.status === 403) {
					throw new Error("このフォルダーは非公開です。");
				}
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.json();
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
	}

	const apiService = new PublicApiService(CONFIG.API_BASE_URL);

	let allWorldsData = [];

	function updateCurrentPageData() {
		const startIndex = (currentPage - 1) * CONFIG.PAGE_SIZE;
		const endIndex = startIndex + CONFIG.PAGE_SIZE;
		worldsData = allWorldsData.slice(startIndex, endIndex);
	}

	function setWorldsData(data) {
		allWorldsData = sortWorldsData(data);
		totalCount = allWorldsData.length;
		totalPages = Math.ceil(allWorldsData.length / CONFIG.PAGE_SIZE);
		updateCurrentPageData();
	}

	function sortWorldsData(data) {
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
				// Use addition_at for folder items, fall back to created_at, then current time
				aValue = Number(a.addition_at || a.created_at || 0);
				bValue = Number(b.addition_at || b.created_at || 0);
				// Numeric comparison for timestamps
				return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
			}

			return 0;
		});

		return sorted;
	}

	function updateSorting(newSortBy) {
		if (sortBy === newSortBy) {
			// Toggle order if same field
			sortOrder = sortOrder === "asc" ? "desc" : "asc";
		} else {
			// Set new field and default to desc for date, asc for name
			sortBy = newSortBy;
			sortOrder = newSortBy === "world_name" ? "asc" : "desc";
		}

		// Re-sort and update display - call sortWorldsData directly
		if (allWorldsData.length > 0) {
			allWorldsData = sortWorldsData(allWorldsData);
			updateCurrentPageData();
		}
	}

	function setCurrentPage(page) {
		currentPage = Math.max(1, Math.min(page, totalPages));
		updateCurrentPageData();
		// Scroll to top of page
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	async function loadData() {
		loading = true;
		error = "";

		try {
			// First, get folder information using the new API
			const folderInfo = await apiService.fetchFolderInfo(folderId);

			// Check if folder is private
			if (folderInfo.is_private) {
				error = "このフォルダーは非公開です。";
				loading = false;
				return;
			}

			// Set folder data from API response
			folderData = {
				id: folderInfo.folder_id,
				folder_name: folderInfo.folder_name,
				comment: folderInfo.comment || "",
				is_private: folderInfo.is_private,
				user_id: folderInfo.user_id,
				world_count: folderInfo.world_count,
				created_at: folderInfo.created_at,
				updated_at: folderInfo.updated_at,
			};

			// Load worlds data using the user_id from folder info
			const worlds = await apiService.fetchPublicFolderItems(
				folderInfo.user_id,
				folderId,
			);
			setWorldsData(worlds);

			loading = false;
		} catch (err) {
			console.error("Error loading public folder:", err);
			error = `Error loading public folder: ${err.message}`;
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

	// Check authentication status
	function checkAuthStatus() {
		const idToken = localStorage.getItem("idToken");
		const userEmail = localStorage.getItem("userEmail");

		if (idToken && userEmail) {
			try {
				const tokenPayload = JSON.parse(atob(idToken.split(".")[1]));
				if (tokenPayload.exp * 1000 > Date.now()) {
					isAuthenticated = true;
					authToken = idToken;
					loadUserFolders();
				}
			} catch (error) {
				console.warn("Invalid token:", error);
			}
		}
	}

	async function loadUserFolders() {
		if (!isAuthenticated) return;

		try {
			userFolders = await apiService.fetchFolders(authToken);
		} catch (error) {
			console.warn("Failed to load user folders:", error);
		}
	}

	// Handlers for WorldCard events
	function handleOpenWorldDetails(data) {
		const { worldId } = data;
		const world = allWorldsData.find((w) => w.world_id === worldId);

		if (world) {
			if (isAuthenticated) {
				// Show modal for authenticated users
				selectedWorldData = world;
				showWorldDetailsModal = true;
			} else {
				// Redirect to VRChat for non-authenticated users
				const vrchatUrl = `https://vrchat.com/home/world/${worldId}/info`;
				window.open(vrchatUrl, "_blank");
			}
		}
	}

	function handleCloseWorldDetailsModal() {
		showWorldDetailsModal = false;
		selectedWorldData = null;
	}

	async function handleAddToFolder(data) {
		const { folderId, worldId, comment } = data;

		try {
			await apiService.addWorldToFolder(authToken, folderId, {
				world_id: worldId,
				comment: comment || null,
			});
			alert("フォルダーに追加しました！");
		} catch (error) {
			console.error("Error adding to folder:", error);
			alert("フォルダーへの追加に失敗しました。");
		}
	}

	function handleRemoveFromFolder() {
		// Not implemented for public view
	}

	onMount(() => {
		checkAuthStatus();

		if (folderId) {
			loadData();
		} else {
			error = "フォルダーIDが指定されていません。";
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
					<span class="count">🌍 {totalCount} ワールド</span>
				</div>
			</div>
		</div>

		<!-- Sorting Controls -->
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
							onsaveComment={() => {}}
							onremoveFromFolder={handleRemoveFromFolder}
							readonly={!isAuthenticated}
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
							{currentPage} / {totalPages} ページ (総 {totalCount}
							件)
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

	<!-- World Details Modal (only for authenticated users) -->
	{#if isAuthenticated}
		<WorldDetailsModal
			isVisible={showWorldDetailsModal}
			worldData={selectedWorldData}
			folders={userFolders}
			{userId}
			onclose={handleCloseWorldDetailsModal}
			onaddToFolder={handleAddToFolder}
			onremoveFromFolder={handleRemoveFromFolder}
		/>
	{/if}
</div>

<style>
	.public-folder-view {
		min-height: 100vh;
		background: #f5f7fa;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
			sans-serif;
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

	/* Sorting Controls */
	.sorting-controls {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 1.5rem;
		margin: 1rem auto;
		max-width: 1400px;
		background: white;
		border-radius: 12px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
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
