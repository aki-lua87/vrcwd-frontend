<script>
	import { onMount } from "svelte";
	import { firebaseAuth } from "../lib/firebase-auth";
	import { apiService } from "../lib/api-service";

	let newUserName = "";
	let isLoading = false;

	// 現在のユーザー名をフィールドに設定
	async function loadUserProfile() {
		try {
			const response = await apiService.getUserProfile();
			if (response.success && response.data) {
				newUserName = response.data.user_name || "";
			}
		} catch (error) {
			console.error("Error loading user profile:", error);
		}
	}

	// ユーザー名変更
	async function handleSaveUserName() {
		if (!newUserName.trim()) {
			alert("ユーザー名を入力してください。");
			return;
		}

		isLoading = true;

		try {
			const response = await apiService.updateUserProfile({
				user_name: newUserName.trim(),
			});

			if (response.success) {
				alert("ユーザー名を変更しました。");
			} else {
				throw new Error(
					response.error || "ユーザー名の変更に失敗しました",
				);
			}
		} catch (error) {
			console.error("Error updating user name:", error);
			alert("ユーザー名の変更に失敗しました: " + error.message);
		} finally {
			isLoading = false;
		}
	}

	// ログアウト
	async function handleLogout() {
		if (confirm("ログアウトしますか？")) {
			try {
				const result = await firebaseAuth.signOut();
				if (result.success) {
					window.location.href = "/";
				} else {
					alert("ログアウトに失敗しました: " + result.error);
				}
			} catch (error) {
				console.error("Logout error:", error);
				alert("ログアウトに失敗しました");
			}
		}
	}

	onMount(async () => {
		// 認証チェック
		const currentUser = await firebaseAuth.getCurrentUser();
		if (!currentUser) {
			window.location.href = "/";
			return;
		}

		// 初期化
		await loadUserProfile();
	});
</script>

<div class="main-wrapper">
	<div class="container">
		<div class="header">
			<button class="back-button" on:click={() => history.back()}>
				←
			</button>
			<h1>設定</h1>
		</div>

		<div class="section">
			<h2>ユーザー名設定</h2>
			<div class="form-group">
				<label for="newUserName">ユーザー名</label>
				<input
					type="text"
					id="newUserName"
					bind:value={newUserName}
					placeholder="ユーザー名を入力してください"
				/>
			</div>
			<button
				class="save-button"
				disabled={isLoading}
				on:click={handleSaveUserName}
			>
				{isLoading ? "変更中..." : "ユーザー名を変更"}
			</button>
		</div>

		<div class="section">
			<h2>アカウント管理</h2>
			<p>Googleアカウントで認証しています。</p>
			<button class="logout-button" on:click={handleLogout}>
				ログアウト
			</button>
		</div>
	</div>
</div>

<style>
	.main-wrapper {
		flex: 1;
		padding: 20px;
		display: flex;
		flex-direction: column;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
			sans-serif;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		min-height: 100vh;
		color: #333;
	}

	.container {
		max-width: 600px;
		margin: 0 auto;
		background: white;
		padding: 2rem;
		border-radius: 12px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
		flex: 1;
		width: 100%;
		box-sizing: border-box;
	}

	.header {
		display: flex;
		align-items: center;
		margin-bottom: 2rem;
	}

	.back-button {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		margin-right: 1rem;
		padding: 0.5rem;
		border-radius: 6px;
		transition: background-color 0.3s ease;
	}

	.back-button:hover {
		background-color: #f0f0f0;
	}

	h1 {
		color: #333;
		margin: 0;
		font-size: 1.8rem;
	}

	.section {
		margin-bottom: 2rem;
		padding: 1.5rem;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		background: #fafafa;
	}

	.section h2 {
		color: #555;
		margin-top: 0;
		margin-bottom: 1rem;
		font-size: 1.2rem;
	}

	.logout-button {
		background: #dc3545;
		color: white;
		border: none;
		padding: 0.75rem 2rem;
		font-size: 1rem;
		font-weight: 600;
		border-radius: 6px;
		cursor: pointer;
		transition: background-color 0.3s ease;
		width: 100%;
	}

	.logout-button:hover {
		background: #c82333;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #333;
	}

	.form-group input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 1rem;
		box-sizing: border-box;
	}

	.form-group input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.save-button {
		background: #28a745;
		color: white;
		border: none;
		padding: 0.75rem 2rem;
		font-size: 1rem;
		font-weight: 600;
		border-radius: 6px;
		cursor: pointer;
		transition: background-color 0.3s ease;
	}

	.save-button:hover {
		background: #218838;
	}

	.save-button:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}
</style>