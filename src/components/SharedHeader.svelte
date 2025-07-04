<script>
	import { onMount } from "svelte";
	import { firebaseAuth } from "../lib/firebase-auth";
	import { apiService } from "../lib/api-service";
	import UserNameModal from "./UserNameModal.svelte";

	let isLoggedIn = false;
	let currentUserId = "";
	let currentPath = "";
	let userInfo = null;
	let unsubscribe = null;
	let userProfile = null;
	let displayUserName = "未設定";
	let showUserNameModal = false;

	// ユーザープロフィールを読み込む
	async function loadUserProfile() {
		try {
			const response = await apiService.getUserProfile();
			if (response.success && response.data) {
				userProfile = response.data;
				displayUserName = userProfile.user_name || "未設定";
				
				// ユーザー名が設定されていない場合にモーダルを表示
				if (!userProfile.user_name || userProfile.user_name.trim() === "") {
					showUserNameModal = true;
				}
			} else {
				displayUserName = "未設定";
				// プロフィール取得に失敗した場合もモーダルを表示
				showUserNameModal = true;
			}
		} catch (error) {
			console.error("Error loading user profile:", error);
			displayUserName = "未設定";
			// エラーが発生した場合もモーダルを表示
			showUserNameModal = true;
		}
	}

	onMount(() => {
		currentPath = window.location.pathname;

		// Firebase認証状態の監視
		unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
			if (user) {
				isLoggedIn = true;
				userInfo = firebaseAuth.getUserInfo();
				currentUserId =
					userInfo?.displayName || userInfo?.email || "ユーザー";
				// ユーザープロフィールを読み込み
				await loadUserProfile();
			} else {
				isLoggedIn = false;
				currentUserId = "";
				userInfo = null;
				userProfile = null;
				displayUserName = "未設定";
			}
		});

		// Cleanup function
		return () => {
			if (unsubscribe) {
				unsubscribe();
			}
		};
	});

	function goToDashboard() {
		window.location.href = "/dashboard";
	}

	function goToLogin() {
		window.location.href = "/";
	}

	function goToSettings() {
		window.location.href = "/settings";
	}

	async function logout() {
		try {
			const result = await firebaseAuth.signOut();
			if (result.success) {
				window.location.href = "/";
			} else {
				console.error("Logout error:", result.error);
				// Force logout by redirecting anyway
				window.location.href = "/";
			}
		} catch (error) {
			console.error("Logout error:", error);
			// Force logout by redirecting anyway
			window.location.href = "/";
		}
	}

	// Check if current page is dashboard
	$: isDashboardPage = currentPath === "/dashboard";
	
	// ユーザー名モーダルのイベントハンドラー
	function handleUserNameModalClose() {
		showUserNameModal = false;
	}
	
	function handleUserNameModalSave(event) {
		const { userName } = event.detail;
		displayUserName = userName;
		showUserNameModal = false;
		
		// ユーザープロフィールを更新
		if (userProfile) {
			userProfile.user_name = userName;
		}
	}
</script>

<div class="header">
	<div class="header-content">
		<h1>VRC Worlds Dashboard</h1>
		<div class="nav-info">
			{#if isLoggedIn}
				<span class="user-display">ユーザー: {displayUserName}</span>
				{#if !isDashboardPage}
					<button class="nav-btn" on:click={goToDashboard}
						>ダッシュボード</button
					>
				{/if}
				<button class="nav-btn" on:click={goToSettings}>設定</button>
				<button class="nav-btn logout-btn" on:click={logout}
					>ログアウト</button
				>
			{:else}
				<button class="nav-btn" on:click={goToLogin}>ログイン</button>
			{/if}
		</div>
	</div>
</div>

<!-- ユーザー名設定モーダル -->
<UserNameModal
	isVisible={showUserNameModal}
	userName={displayUserName}
	on:close={handleUserNameModalClose}
	on:save={handleUserNameModalSave}
/>

<style>
	.header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 1rem 0;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.header-content {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.header h1 {
		font-size: 1.5rem;
		font-weight: 600;
	}

	.nav-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.user-display {
		font-size: 0.9rem;
		opacity: 0.9;
	}

	.nav-btn {
		background: rgba(255, 255, 255, 0.2);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.3);
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		transition: background-color 0.3s ease;
		font-size: 0.9rem;
	}

	.nav-btn:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	/* スマートフォン向けスタイル */
	@media (max-width: 768px) {
		.header-content {
			padding: 0 0.5rem;
		}

		.header h1 {
			font-size: 1.2rem;
		}

		.nav-info {
			flex-wrap: wrap;
			gap: 0.5rem;
		}

		.user-display {
			font-size: 0.8rem;
		}

		.nav-btn {
			padding: 0.4rem 0.8rem;
			font-size: 0.8rem;
		}
	}
</style>
