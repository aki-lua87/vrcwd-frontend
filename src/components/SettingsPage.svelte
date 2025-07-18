<script>
	import { onMount } from "svelte";
	import { firebaseAuth } from "../lib/firebase-auth";
	import { apiService } from "../lib/api-service";

	let newUserName = "";
	let isLoading = false;
	let apiKey = "";
	let hasApiKey = false;
	let apiKeyCreatedAt = "";
	let isApiKeyLoading = false;
	let userId = "";

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

	// APIキー情報を取得
	async function loadApiKey() {
		try {
			const response = await apiService.getApiKey();
			if (response.success && response.data) {
				hasApiKey = true;
				apiKey = response.data.api_key || "";
				apiKeyCreatedAt = response.data.created_at || "";
			} else {
				hasApiKey = false;
				apiKey = "";
				apiKeyCreatedAt = "";
			}
		} catch (error) {
			console.error("Error loading API key:", error);
			hasApiKey = false;
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

	// APIキー作成
	async function handleCreateApiKey() {
		if (!confirm("新しいAPIキーを作成しますか？")) {
			return;
		}

		isApiKeyLoading = true;

		try {
			const response = await apiService.createApiKey();
			if (response.success) {
				alert("APIキーを作成しました。");
				await loadApiKey();
			} else {
				throw new Error(
					response.error || "APIキーの作成に失敗しました",
				);
			}
		} catch (error) {
			console.error("Error creating API key:", error);
			alert("APIキーの作成に失敗しました: " + error.message);
		} finally {
			isApiKeyLoading = false;
		}
	}

	// APIキー削除
	async function handleDeleteApiKey() {
		if (
			!confirm(
				"APIキーを削除しますか？\n削除すると、このAPIキーを使用している全てのアプリケーションが動作しなくなります。",
			)
		) {
			return;
		}

		isApiKeyLoading = true;

		try {
			const response = await apiService.deleteApiKey();
			if (response.success) {
				alert("APIキーを削除しました。");
				await loadApiKey();
			} else {
				throw new Error(
					response.error || "APIキーの削除に失敗しました",
				);
			}
		} catch (error) {
			console.error("Error deleting API key:", error);
			alert("APIキーの削除に失敗しました: " + error.message);
		} finally {
			isApiKeyLoading = false;
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

		// ユーザーIDを設定
		userId = currentUser.uid;

		// 初期化
		await loadUserProfile();
		await loadApiKey();
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
			<h2>表示名設定</h2>
			<div class="form-group">
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
			<h2>開発者向け</h2>
			<div class="api-docs-link">
				<a href="/api-docs">API仕様</a>
			</div>

			{#if hasApiKey}
				<div class="api-key-info">
					<div class="form-group">
						<label for="apiKey">APIキー</label>
						<div class="api-key-display">
							<input
								type="text"
								id="apiKey"
								bind:value={apiKey}
								readonly
								class="api-key-input"
							/>
							<button
								class="copy-button"
								on:click={() =>
									navigator.clipboard.writeText(apiKey)}
								title="コピー"
							>
								コピー
							</button>
						</div>
					</div>
					<button
						class="delete-button"
						disabled={isApiKeyLoading}
						on:click={handleDeleteApiKey}
					>
						{isApiKeyLoading ? "削除中..." : "APIキーを削除"}
					</button>
				</div>
			{:else}
				<div class="no-api-key">
					<p>APIキーが作成されていません。</p>
					<button
						class="create-button"
						disabled={isApiKeyLoading}
						on:click={handleCreateApiKey}
					>
						{isApiKeyLoading ? "作成中..." : "APIキーを作成"}
					</button>
				</div>
			{/if}
			<br /><br />
			{#if userId}
				<div class="form-group">
					<label for="userId">ユーザーID</label>
					<div class="user-id-display">
						<input
							type="text"
							id="userId"
							bind:value={userId}
							readonly
							class="user-id-input"
						/>
						<button
							class="copy-button"
							on:click={() =>
								navigator.clipboard.writeText(userId)}
							title="コピー"
						>
							コピー
						</button>
					</div>
				</div>
			{/if}
		</div>

		<div class="section">
			<h2>PortalLibrarySystem用互換URL</h2>
			<p>
				<a
					href="https://genkaikogyo.booth.pm/items/6659099"
					target="_blank"
					rel="noopener noreferrer">PortalLibrarySystem</a
				>のJSONモードにて利用できるAPIエンドポイントのURL。公開状態のフォルダの内容が表示されます。
			</p>
			<p class="notice">
				※ PortalLibrarySystem は 幻会興業 様より公開されている
				VRCのワールドに設置するポータルシステムです。本システムと直接の関係はございません。
			</p>
			{#if userId}
				<div class="form-group">
					<label for="wpplsUrl">URL</label>
					<div class="wppls-url-display">
						<input
							type="text"
							id="wpplsUrl"
							value={`${window.location.origin}/api/users/${userId}/wppls`}
							readonly
							class="wppls-url-input"
						/>
						<button
							class="copy-button"
							on:click={() =>
								navigator.clipboard.writeText(
									`${window.location.origin}/api/users/${userId}/wppls`,
								)}
							title="コピー"
						>
							コピー
						</button>
					</div>
				</div>
			{/if}
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

	.api-key-display {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.api-key-input {
		flex: 1;
		font-family: monospace;
		font-size: 0.9rem;
		background: #f8f9fa;
	}

	.copy-button {
		background: #6c757d;
		color: white;
		border: none;
		padding: 0.5rem;
		border-radius: 6px;
		cursor: pointer;
		transition: background-color 0.3s ease;
		font-size: 1rem;
	}

	.copy-button:hover {
		background: #5a6268;
	}

	.api-key-date {
		color: #666;
		font-size: 0.9rem;
		margin: 0.5rem 0;
	}

	.delete-button {
		background: #dc3545;
		color: white;
		border: none;
		padding: 0.75rem 2rem;
		font-size: 1rem;
		font-weight: 600;
		border-radius: 6px;
		cursor: pointer;
		transition: background-color 0.3s ease;
	}

	.delete-button:hover {
		background: #c82333;
	}

	.delete-button:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}

	.create-button {
		background: #007bff;
		color: white;
		border: none;
		padding: 0.75rem 2rem;
		font-size: 1rem;
		font-weight: 600;
		border-radius: 6px;
		cursor: pointer;
		transition: background-color 0.3s ease;
	}

	.create-button:hover {
		background: #0056b3;
	}

	.create-button:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}

	.api-docs-link {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e0e0e0;
	}

	.api-docs-link a {
		color: #007bff;
		text-decoration: none;
		font-weight: 600;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.api-docs-link a:hover {
		text-decoration: underline;
	}

	.user-id-display {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.user-id-input {
		flex: 1;
		font-family: monospace;
		font-size: 0.9rem;
		background: #f8f9fa;
	}

	.wppls-url-display {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.wppls-url-input {
		flex: 1;
		font-family: monospace;
		font-size: 0.9rem;
		background: #f8f9fa;
	}

	.notice {
		color: #666;
		font-size: 0.85rem;
		margin-top: 0.5rem;
		padding: 0.5rem;
		background: #f8f9fa;
		border-radius: 4px;
		border-left: 3px solid #007bff;
	}
</style>
