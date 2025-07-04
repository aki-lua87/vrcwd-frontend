<script>
	import { onMount } from "svelte";
	import { firebaseAuth } from "../lib/firebase-auth";
	import { apiService } from "../lib/api-service";
	import SharedHeader from "./SharedHeader.svelte";
	import FolderSidebar from "./FolderSidebar.svelte";
	import FavoritesSidebar from "./FavoritesSidebar.svelte";
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
	let userInfo = null;
	let loading = true;
	let error = "";
	let success = "";
	let searchQuery = "";
	let clearSearchFlag = false;
	let favoritesFolders = [];

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
		PAGE_SIZE: 10,
		DEFAULT_PAGE: 1,
	};

	// Helper functions
	function formatFolderId(folderId) {
		if (!folderId || folderId === null || folderId === undefined) return "";
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
		worldsData = filteredWorldsData.slice(startIndex, endIndex);
		// Force reactivity update
		worldsData = [...worldsData];
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
		filterWorldsData();
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

		// Re-sort and update display - call sortWorldsData directly and then filter
		if (allWorldsData.length > 0) {
			allWorldsData = sortWorldsData(allWorldsData);
			// Force reactivity update for allWorldsData
			allWorldsData = [...allWorldsData];
			filterWorldsData();
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

	// 公開フォルダ情報取得のヘルパー関数
	async function fetchPublicFolderInfo(folderId) {
		const formattedId = formatFolderId(folderId);
		if (!formattedId) {
			throw new Error("無効なフォルダIDです。");
		}
		const url = `${import.meta.env.PUBLIC_API_BASE_URL || "https://backend.jmnt34deg.workers.dev"}/v2/folders/${formattedId}/info`;
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
		const url = `${import.meta.env.PUBLIC_API_BASE_URL || "https://backend.jmnt34deg.workers.dev"}/v2/u/${userId}/folders/${formattedId}/items`;
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

	// Event handlers
	async function loadData() {
		loading = true;
		error = "";

		try {
			// フォルダ一覧を取得
			const foldersResponse = await apiService.getFolders();
			if (foldersResponse.success) {
				folders = foldersResponse.data || [];
			}

			// お気に入りフォルダ一覧を取得
			const favoritesResponse = await apiService.getFavorites();
			if (favoritesResponse.success) {
				favoritesFolders = favoritesResponse.data || [];
			}

			// フォルダが無い場合の処理
			if (folders.length === 0) {
				// フォルダが存在しない場合はnullに設定
				currentFolder = null;
				setWorldsData([]);
			} else if (!currentFolder) {
				// フォルダが存在するが選択されていない場合は最初のフォルダを選択
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

			const response = await apiService.getFolderItems(currentFolder.id);
			if (!response.success) {
				throw new Error(
					response.error || "ワールドの取得に失敗しました",
				);
			}

			resetPagination();
			searchQuery = ""; // Reset search query when changing folders
			clearSearchFlag = !clearSearchFlag; // Toggle to trigger SearchBox reset

			setWorldsData(response.data || []);
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

	async function handleSelectFavoriteFolder(data) {
		const { folderId, userId: ownerId } = data;
		// お気に入りフォルダの内容を取得してダッシュボードに表示
		try {
			loading = true;
			error = "";

			// お気に入りフォルダの情報を取得
			const folderInfo = await fetchPublicFolderInfo(folderId);

			if (folderInfo.is_private) {
				throw new Error("このフォルダは非公開になっています。");
			}

			// お気に入りフォルダをcurrentFolderとして設定
			currentFolder = {
				id: formatFolderId(folderInfo.folder_id),
				folder_name: folderInfo.folder_name,
				comment: folderInfo.comment || "",
				is_private: folderInfo.is_private,
				user_id: folderInfo.user_id,
				world_count: folderInfo.world_count,
				is_favorite: true, // お気に入りフォルダであることを示すフラグ
				owner_user_id: ownerId,
			};

			// お気に入りフォルダの中身を取得
			const worlds = await fetchPublicFolderItems(ownerId, folderId);
			resetPagination();
			searchQuery = ""; // Reset search query when changing folders
			clearSearchFlag = !clearSearchFlag; // Toggle to trigger SearchBox reset
			setWorldsData(worlds);

			loading = false;
		} catch (err) {
			console.error("Error loading favorite folder:", err);
			showError(
				"お気に入りフォルダの読み込みに失敗しました: " + err.message,
			);
			loading = false;
		}
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
		if (confirm("このフォルダとその中のすべてのワールドを削除しますか？")) {
			try {
				const response = await apiService.deleteFolder(folderId);
				if (!response.success) {
					throw new Error(
						response.error || "フォルダの削除に失敗しました",
					);
				}
				showSuccess("フォルダを削除しました。");
				await loadData();
			} catch (err) {
				console.error("Error deleting folder:", err);
				showError("フォルダの削除に失敗しました。");
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
			const response = await apiService.addWorldToFolder(
				currentFolder.id,
				{
					world_id: worldId,
				},
			);

			if (!response.success) {
				throw new Error(
					response.error || "ワールドの追加に失敗しました",
				);
			}

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
			const response = await apiService.updateWorldComment(
				currentFolder.id,
				worldId,
				comment,
			);

			if (!response.success) {
				throw new Error(
					response.error || "コメントの更新に失敗しました",
				);
			}

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

		if (confirm("このワールドをフォルダから削除しますか？")) {
			try {
				const response = await apiService.removeWorldFromFolder(
					currentFolder.id,
					worldId,
				);

				if (!response.success) {
					throw new Error(
						response.error || "ワールドの削除に失敗しました",
					);
				}

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

			showSuccess("ワールドをフォルダに追加しました。");

			// Update main dashboard if the folder is currently selected
			if (currentFolder && currentFolder.id == folderId) {
				await loadWorldsForCurrentFolder();
			}
		} catch (err) {
			console.error("Error adding to folder:", err);
			showError("フォルダへの追加に失敗しました。");
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
			showSuccess("フォルダからワールドを削除しました。");

			// Update main dashboard if the folder is currently selected
			if (currentFolder && currentFolder.id == folderId) {
				await loadWorldsForCurrentFolder();
			}
		} catch (err) {
			console.error("Error removing from folder:", err);
			showError("フォルダからの削除に失敗しました。");
		}
	}

	function handleCloseFolderModal() {
		showFolderModal = false;
		editingFolder = null;
	}

	async function handleSaveFolder(data) {
		const { folderData, isEditing, folderId } = data;

		try {
			let response;
			if (isEditing) {
				response = await apiService.updateFolder(folderId, folderData);
				if (!response.success) {
					throw new Error(
						response.error || "フォルダの更新に失敗しました",
					);
				}
				showSuccess("フォルダを更新しました。");
			} else {
				response = await apiService.createFolder(folderData);
				if (!response.success) {
					throw new Error(
						response.error || "フォルダの作成に失敗しました",
					);
				}
				showSuccess("フォルダを作成しました。");
			}

			// Reload data to reflect changes
			await loadData();

			// Update current folder reference to reflect the latest data
			if (currentFolder && isEditing) {
				const updatedFolder = folders.find(
					(f) => f.id === currentFolder.id,
				);
				if (updatedFolder) {
					currentFolder = updatedFolder;
				}
			} else if (!isEditing && folders.length > 0) {
				// 新しいフォルダが作成された場合、最初のフォルダを選択
				currentFolder = folders[0];
			}
		} catch (err) {
			console.error("Error saving folder:", err);
			showError("フォルダの保存に失敗しました。");
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

	async function handleRemoveFromFavorites(data) {
		const folderId = data.folderId;
		if (confirm("このフォルダをお気に入りから削除しますか？")) {
			try {
				const response = await apiService.removeFromFavorites(
					parseInt(folderId),
				);
				if (response.success) {
					showSuccess("フォルダをお気に入りから削除しました。");
					// お気に入りフォルダリストを更新
					const favoritesResponse = await apiService.getFavorites();
					if (favoritesResponse.success) {
						favoritesFolders = favoritesResponse.data || [];
					}
					// 現在表示中のフォルダがお気に入りから削除された場合、最初のフォルダに戻る
					if (
						currentFolder &&
						currentFolder.is_favorite &&
						currentFolder.id == formatFolderId(folderId)
					) {
						if (folders.length > 0) {
							currentFolder = folders[0];
							await loadWorldsForCurrentFolder();
						} else {
							currentFolder = null;
							setWorldsData([]);
						}
					}
				} else {
					throw new Error(
						response.error || "お気に入りから削除に失敗しました",
					);
				}
			} catch (error) {
				console.error("Error removing from favorites:", error);
				showError("お気に入りから削除に失敗しました: " + error.message);
			}
		}
	}

	// Initialize on mount
	onMount(async () => {
		// 初回認証状態チェック
		const currentUser = await firebaseAuth.getCurrentUser();

		if (!currentUser) {
			// 認証されていない場合はログインページにリダイレクト（一度だけ）
			window.location.href = "/";
			return;
		}

		// ユーザー情報を設定
		userInfo = firebaseAuth.getUserInfo();
		userId = currentUser.uid;

		// 認証状態の変更を監視（ログアウト時のみ処理）
		const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
			if (!user && userInfo) {
				// ログアウトされた場合のみリダイレクト
				window.location.href = "/";
				return;
			}
		});

		try {
			// データを読み込み
			await loadData();
		} catch (error) {
			console.error("Data loading failed:", error);
			showError("データの読み込みに失敗しました。");
		}

		// Cleanup function
		return () => {
			unsubscribe();
		};
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
		onremoveFromFavorites={handleRemoveFromFavorites}
	/>

	<div class="main-container">
		<div class="sidebar-container">
			<FolderSidebar
				{folders}
				{currentFolder}
				onselectFolder={handleSelectFolder}
				oncreateFolder={handleCreateFolder}
				oneditFolder={handleEditFolder}
				ondeleteFolder={handleDeleteFolder}
			/>

			<FavoritesSidebar
				{favoritesFolders}
				{currentFolder}
				onselectFavoriteFolder={handleSelectFavoriteFolder}
				onremoveFromFavorites={handleRemoveFromFavorites}
			/>
		</div>

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

				{#if folders.length === 0}
					<!-- フォルダが無い場合の表示 -->
					<div class="no-folders-message">
						<div class="no-folders-icon">📁</div>
						<h3>フォルダがありません</h3>
						<p>
							まずは新しいフォルダを作成してワールドを整理しましょう。
						</p>
						<button
							class="btn btn-primary create-first-folder-btn"
							on:click={handleCreateFolder}
						>
							最初のフォルダを作成
						</button>
					</div>
				{:else}
					{#if currentFolder && !currentFolder.is_favorite}
						<WorldInput
							onaddWorld={handleAddWorld}
						/>
					{/if}

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
									<span class="sort-order"
										>({sortOrder === "asc"
											? "降順"
											: "昇順"})</span
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
										>({sortOrder === "asc"
											? "古い順"
											: "新しい順"})</span
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
		userId={userId}
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

	.sidebar-container {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		min-width: 280px;
		align-self: flex-start;
		position: sticky;
		top: 2rem;
		max-height: calc(100vh - 4rem);
		overflow-y: auto;
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

	.sort-order {
		font-size: 0.75rem;
		font-weight: normal;
		opacity: 0.8;
		margin-left: 0.25rem;
	}

	.no-folders-message {
		text-align: center;
		padding: 4rem 2rem;
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		margin: 2rem auto;
		max-width: 600px;
	}

	.no-folders-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.no-folders-message h3 {
		margin: 0 0 1rem 0;
		font-size: 1.5rem;
		color: #333;
	}

	.no-folders-message p {
		margin: 0 0 2rem 0;
		color: #666;
		font-size: 1.1rem;
		line-height: 1.6;
	}

	.create-first-folder-btn {
		font-size: 1.1rem;
		padding: 1rem 2rem;
	}

	@media (max-width: 768px) {
		.main-container {
			flex-direction: column;
			gap: 1rem;
			padding: 1rem 0.5rem;
		}

		.sidebar-container {
			min-width: unset;
		}

	}
</style>
