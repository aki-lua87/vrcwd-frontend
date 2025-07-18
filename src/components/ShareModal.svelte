<script>
	export let isVisible = false;
	export let folderData = null;
	export let userId = "";

	// Svelte 5 event props
	export let onclose = () => {};

	let shareUrl = "";
	let apiUrl = "";
	let copySuccess = false;
	let copyApiSuccess = false;

	function formatFolderId(folderId) {
		if (!folderId || folderId === null || folderId === undefined) return "";
		return String(folderId).padStart(8, "0");
	}

	$: if (isVisible && folderData && userId) {
		const baseUrl = window.location.origin;
		const formattedFolderId = formatFolderId(folderData.id);
		if (formattedFolderId) {
			shareUrl = `${baseUrl}/share/${encodeURIComponent(userId)}/${encodeURIComponent(formattedFolderId)}`;
			apiUrl = `${baseUrl}/api/users/${encodeURIComponent(userId)}/folders/${encodeURIComponent(formattedFolderId)}/items`;
		} else {
			shareUrl = "";
			apiUrl = "";
		}
	}

	function closeModal() {
		isVisible = false;
		copySuccess = false;
		copyApiSuccess = false;
		onclose();
	}

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			copySuccess = true;
			setTimeout(() => {
				copySuccess = false;
			}, 2000);
		} catch (err) {
			// Fallback for older browsers
			const textArea = document.createElement("textarea");
			textArea.value = shareUrl;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand("copy");
			document.body.removeChild(textArea);
			copySuccess = true;
			setTimeout(() => {
				copySuccess = false;
			}, 2000);
		}
	}

	async function copyApiToClipboard() {
		try {
			await navigator.clipboard.writeText(apiUrl);
			copyApiSuccess = true;
			setTimeout(() => {
				copyApiSuccess = false;
			}, 2000);
		} catch (err) {
			// Fallback for older browsers
			const textArea = document.createElement("textarea");
			textArea.value = apiUrl;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand("copy");
			document.body.removeChild(textArea);
			copyApiSuccess = true;
			setTimeout(() => {
				copyApiSuccess = false;
			}, 2000);
		}
	}

	function openInNewTab() {
		window.open(shareUrl, "_blank");
	}

	function handleModalClick(event) {
		if (event.target === event.currentTarget) {
			closeModal();
		}
	}

	function handleKeydown(event) {
		if (event.key === "Escape") {
			closeModal();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isVisible && folderData}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal" on:click={handleModalClick}>
		<div class="modal-content">
			<div class="modal-header">
				<h3 class="modal-title">🔗 フォルダを共有</h3>
				<button class="close-btn" on:click={closeModal}>×</button>
			</div>

			<div class="modal-body">
				<div class="folder-info">
					<div class="folder-header">
						<div class="folder-name">
							{folderData.folder_name}
						</div>
						<div class="folder-id">
							ID: {formatFolderId(folderData.id)}
						</div>
					</div>
					{#if folderData.comment}
						<div class="folder-comment">{folderData.comment}</div>
					{/if}
				</div>

				<div class="share-section">
					<p class="share-description">
						この共有URLを使用すると、誰でもこのフォルダの内容を閲覧できます。
						{#if folderData.is_private}
							<strong class="warning"
								>注意:
								このフォルダは現在非公開に設定されています。共有するには公開設定に変更してください。</strong
							>
						{/if}
					</p>

					<div class="url-section">
						<label class="url-label">共有ページURL</label>
						<div class="url-container">
							<input
								type="text"
								class="share-url-input"
								value={shareUrl}
								readonly
							/>
							<button
								class="copy-btn"
								class:success={copySuccess}
								on:click={copyToClipboard}
							>
								{copySuccess ? "✓ コピー済み" : "コピー"}
							</button>
						</div>
					</div>

					<div class="url-section">
						<label class="url-label">JSON API エンドポイント</label>
						<div class="url-container">
							<input
								type="text"
								class="share-url-input"
								value={apiUrl}
								readonly
							/>
							<button
								class="copy-btn"
								class:success={copyApiSuccess}
								on:click={copyApiToClipboard}
							>
								{copyApiSuccess ? "✓ コピー済み" : "コピー"}
							</button>
						</div>
					</div>
				</div>
			</div>

			<div class="modal-footer">
				<button class="btn btn-primary" on:click={closeModal}>
					閉じる
				</button>
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
		max-width: 600px;
		width: 90%;
		max-height: 80vh;
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
		font-size: 1.3rem;
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

	.modal-body {
		padding: 1.5rem;
	}

	.folder-info {
		background: #f8f9fa;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.folder-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}

	.folder-name {
		font-size: 1.1rem;
		font-weight: 600;
		color: #333;
	}

	.folder-id {
		font-size: 0.8rem;
		color: #667eea;
		font-family: monospace;
		background: #e3f2fd;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		white-space: nowrap;
	}

	.folder-comment {
		font-size: 0.9rem;
		color: #666;
		font-style: italic;
	}

	.share-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.url-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.url-label {
		font-size: 0.9rem;
		font-weight: 600;
		color: #333;
	}

	.share-description {
		font-size: 0.9rem;
		color: #555;
		line-height: 1.5;
		margin: 0;
	}

	.warning {
		color: #dc3545;
		display: block;
		margin-top: 0.5rem;
	}

	.url-container {
		display: flex;
		gap: 0.5rem;
		align-items: stretch;
	}

	.share-url-input {
		flex: 1;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 0.9rem;
		font-family: monospace;
		background: #f8f9fa;
	}

	.copy-btn {
		padding: 0.75rem 1rem;
		border: none;
		border-radius: 6px;
		background: #28a745;
		color: white;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 0.9rem;
		font-weight: 500;
		white-space: nowrap;
	}

	.copy-btn:hover {
		background: #218838;
	}

	.copy-btn.success {
		background: #155724;
	}

	.modal-footer {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		padding: 1.5rem;
		border-top: 1px solid #eee;
		background: #f8f9fa;
		border-radius: 0 0 12px 12px;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 0.9rem;
		font-weight: 500;
		min-width: 80px;
	}

	.btn-secondary {
		background: white;
		color: #333;
		border: 1px solid #ddd;
	}

	.btn-secondary:hover {
		background: #f5f5f5;
		border-color: #ccc;
	}

	.btn-primary {
		background: #667eea;
		color: white;
	}

	.btn-primary:hover {
		background: #764ba2;
	}

	@media (max-width: 480px) {
		.modal-content {
			width: 95%;
			margin: 1rem;
		}

		.modal-header,
		.modal-body,
		.modal-footer {
			padding: 1rem;
		}

		.url-container {
			flex-direction: column;
		}

		.modal-footer {
			flex-direction: column;
		}
	}
</style>
