<script>
	import { onMount } from "svelte";
	import { firebaseAuth } from "../lib/firebase-auth";
	import { apiService } from "../lib/api-service";
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
	let favoritesFolders = [];
	let isFavorited = false;

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

	// 公開API用のヘルパー関数
	function formatFolderId(folderId) {
		if (!folderId || folderId === null || folderId === undefined) return "";
		return String(folderId).padStart(8, "0");
	}

	async function fetchFolderInfo(folderId) {
		const formattedId = formatFolderId(folderId);
		if (!formattedId) {
			throw new Error("無効なフォルダIDです。");
		}
		const url = `${CONFIG.API_BASE_URL}/v2/folders/${formattedId}/info`;
		const response = await fetch(url);
		if (!response.ok) {
			if (response.status === 400) {
				throw new Error("無効なフォルダID形式です。");
			} else if (response.status === 404) {
				throw new Error("フォルダが見つかりません。");
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		return await response.json();
	}

	async function fetchPublicFolderItems(userId, folderId) {
		const formattedId = formatFolderId(folderId);
		if (!formattedId) {
			throw new Error("無効なフォルダIDです。");
		}
		const url = `${CONFIG.API_BASE_URL}/v2/u/${userId}/folders/${formattedId}/items`;
		const response = await fetch(url);
		if (!response.ok) {
			if (response.status === 404) {
				throw new Error(
					"フォルダが見つからないか、非公開に設定されています。",
				);
			} else if (response.status === 403) {
				throw new Error("このフォルダは非公開です。");
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		return await response.json();
	}

	let allWorldsData = [];

	function updateCurrentPageData() {
		const startIndex = (currentPage - 1) * CONFIG.PAGE_SIZE;
		const endIndex = startIndex + CONFIG.PAGE_SIZE;
		worldsData = allWorldsData.slice(startIndex, endIndex);
	}

	function setWorldsData(data) {
		// データの整合性を確保し、必要なプロパティの存在を保証
		const safeData = data.map((item) => {
			return {
				...item,
				addition_at: item.addition_at || null,
				// プロパティアクセスを強制してオブジェクト構造を確定
				world_name: item.world_name || "",
				world_description: item.world_description || "",
				world_author_name: item.world_author_name || "",
			};
		});

		allWorldsData = sortWorldsData(safeData);
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
				// より堅牢な日付解析
				aValue = parseTimestamp(a.addition_at);
				bValue = parseTimestamp(b.addition_at);

				// Numeric comparison for timestamps
				return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
			}

			return 0;
		});

		return sorted;
	}

	// 堅牢なタイムスタンプ解析関数
	function parseTimestamp(value) {
		if (!value) return 0;

		if (typeof value === "string") {
			const timestamp = new Date(value).getTime();
			return isNaN(timestamp) ? 0 : timestamp;
		}

		if (typeof value === "number") {
			return value;
		}

		return 0;
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
			const folderInfo = await fetchFolderInfo(folderId);

			// Check if folder is private
			if (folderInfo.is_private) {
				error = "このフォルダは非公開です。";
				loading = false;
				return;
			}

			// Check if path userId matches folder owner
			if (userId && folderInfo.user_id !== userId) {
				error = "エラー";
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
				user_name: folderInfo.user_name || "",
				world_count: folderInfo.world_count,
			};

			// Load worlds data using the user_id from folder info
			const worlds = await fetchPublicFolderItems(
				folderInfo.user_id,
				folderId,
			);
			setWorldsData(worlds);

			loading = false;
		} catch (err) {
			console.error("Error loading public folder:", err);
			error = `${err.message}`;
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
	async function checkAuthStatus() {
		try {
			const currentUser = await firebaseAuth.getCurrentUser();
			if (currentUser) {
				isAuthenticated = true;
				authToken = await currentUser.getIdToken();
			}
		} catch (error) {
			console.warn("Authentication check failed:", error);
		}
	}

	async function loadUserFolders() {
		if (!isAuthenticated) return;

		try {
			const response = await apiService.getFolders();
			if (response.success) {
				userFolders = response.data || [];
			}
		} catch (error) {
			console.error("Error loading user folders:", error);
		}
	}

	async function loadFavorites() {
		if (!isAuthenticated) return;

		try {
			const response = await apiService.getFavorites();
			if (response.success) {
				favoritesFolders = response.data || [];
				// 現在のフォルダがお気に入りに含まれているかチェック
				isFavorited = favoritesFolders.some(
					(f) =>
						formatFolderId(f.folder_id) ==
						formatFolderId(folderId),
				);
			}
		} catch (error) {
			console.error("Error loading favorites:", error);
		}
	}

	async function handleAddToFavorites() {
		if (!isAuthenticated || !folderData) return;

		try {
			const response = await apiService.addToFavorites(
				parseInt(folderId),
			);
			if (response.success) {
				isFavorited = true;
				alert("フォルダをお気に入りに追加しました！");
			} else {
				throw new Error(
					response.error || "お気に入り追加に失敗しました",
				);
			}
		} catch (error) {
			console.error("Error adding to favorites:", error);
			alert("お気に入り追加に失敗しました: " + error.message);
		}
	}

	async function handleRemoveFromFavorites() {
		if (!isAuthenticated || !folderData) return;

		try {
			const response = await apiService.removeFromFavorites(
				parseInt(folderId),
			);
			if (response.success) {
				isFavorited = false;
				alert("フォルダをお気に入りから削除しました。");
			} else {
				throw new Error(
					response.error || "お気に入り削除に失敗しました",
				);
			}
		} catch (error) {
			console.error("Error removing from favorites:", error);
			alert("お気に入り削除に失敗しました: " + error.message);
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
			// まずマスターにワールドを追加
			try {
				await apiService.createWorld({ world_id: worldId });
			} catch (err) {
				// 409エラー（既に存在）は無視
				if (!err.message.includes("409")) {
					throw err;
				}
			}

			// フォルダにワールドを追加
			const response = await apiService.addWorldToFolder(folderId, {
				world_id: worldId,
				comment: comment || null,
			});

			if (response.success) {
				alert("フォルダに追加しました！");
			} else {
				throw new Error(
					response.error || "フォルダへの追加に失敗しました",
				);
			}
		} catch (error) {
			console.error("Error adding to folder:", error);
			alert("フォルダへの追加に失敗しました。");
		}
	}

	function handleRemoveFromFolder() {
		// Not implemented for public view
	}

	onMount(async () => {
		await checkAuthStatus();

		if (isAuthenticated) {
			await loadUserFolders();
			await loadFavorites();
		}

		if (folderId) {
			await loadData();
		} else {
			error = "フォルダIDが指定されていません。";
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
				<div class="folder-info-content">
					<h2 class="folder-title">📁 {folderData.folder_name}</h2>
					{#if folderData.user_name && folderData.user_name.trim()}
						<p class="folder-author">👤 作者: {folderData.user_name}</p>
					{/if}
					{#if folderData.comment}
						<p class="folder-comment">{folderData.comment}</p>
					{/if}
					<div class="folder-meta">
						<span class="count">🌍 {totalCount} ワールド</span>
					</div>
				</div>
				{#if isAuthenticated}
					<div class="favorite-actions">
						{#if isFavorited}
							<button
								class="favorite-btn favorited"
								on:click={handleRemoveFromFavorites}
							>
								⭐ お気に入り済み
							</button>
						{:else}
							<button
								class="favorite-btn"
								on:click={handleAddToFavorites}
							>
								☆ お気に入りに追加
							</button>
						{/if}
					</div>
				{/if}
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
					<span class="sort-order"
						>({sortOrder === "asc" ? "降順" : "昇順"})</span
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
					<span class="sort-order"
						>({sortOrder === "asc" ? "古い順" : "新しい順"})</span
					>
				{/if}
			</button>
		</div>

		{#if worldsData.length === 0}
			<div class="empty-message">
				このフォルダにはワールドがありません。
			</div>
		{:else}
			<div class="worlds-container">
				{#key `${sortBy}-${sortOrder}-${currentPage}-${worldsData.length}`}
					<div class="worlds-grid">
						{#each worldsData as world (world.world_id)}
							<WorldCard
								{world}
								onopenWorldDetails={handleOpenWorldDetails}
								onsaveComment={() => {}}
								onremoveFromFolder={handleRemoveFromFolder}
								readonly={true}
							/>
						{/each}
					</div>
				{/key}

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
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.folder-info-content {
		flex: 1;
		text-align: center;
	}

	.favorite-actions {
		flex-shrink: 0;
	}

	.favorite-btn {
		background: #667eea;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
		transition: all 0.3s ease;
		box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
	}

	.favorite-btn:hover {
		background: #5a67d8;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
	}

	.favorite-btn.favorited {
		background: #f59e0b;
		color: white;
	}

	.favorite-btn.favorited:hover {
		background: #d97706;
	}

	.folder-title {
		font-size: 2rem;
		font-weight: 600;
		color: #333;
		margin: 0 0 1rem 0;
	}

	.folder-author {
		font-size: 1rem;
		color: #667eea;
		font-weight: 500;
		margin: 0 0 0.75rem 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
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
		max-width: 450px;
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

	.sort-order {
		font-size: 0.75rem;
		font-weight: normal;
		opacity: 0.8;
		margin-left: 0.25rem;
	}

	@media (max-width: 768px) {
		.folder-info {
			padding: 1rem 0.5rem 0.5rem;
		}

		.worlds-container {
			padding: 0.5rem;
		}

		.sorting-controls {
			padding: 1rem 0.5rem;
			margin: 0.5rem;
		}

		.folder-header {
			padding: 1.5rem 1rem;
		}

		.folder-title {
			font-size: 1.5rem;
		}

		.folder-author {
			font-size: 0.9rem;
			justify-content: center;
		}

		.worlds-grid {
			grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
			gap: 1rem;
		}

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

		.folder-header {
			flex-direction: column;
			align-items: center;
			text-align: center;
			gap: 1rem;
		}

		.favorite-actions {
			width: 100%;
		}

		.favorite-btn {
			width: 100%;
		}
	}
</style>
