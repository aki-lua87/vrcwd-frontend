<script>
	export let isVisible = false;
	export let editingFolder = null;

	// Svelte 5 event props
	export let onclose = () => {};
	export let onsave = () => {};

	let folderName = "";
	let folderComment = "";
	let isPrivate = true;

	$: if (isVisible) {
		if (editingFolder) {
			// Editing existing folder
			folderName = editingFolder.folder_name || "";
			folderComment = editingFolder.comment || "";
			isPrivate = editingFolder.is_private === 1;
		} else {
			// Creating new folder
			folderName = "";
			folderComment = "";
			isPrivate = true;
		}
	}

	$: modalTitle = editingFolder ? "フォルダ編集" : "新しいフォルダ";

	function closeModal() {
		isVisible = false;
		onclose();
	}

	function saveFolder() {
		const trimmedName = folderName.trim();
		if (!trimmedName) {
			alert("フォルダ名を入力してください。");
			return;
		}

		const folderData = {
			folder_name: trimmedName,
			comment: folderComment.trim(),
			is_private: isPrivate ? 1 : 0,
		};

		onsave({
			folderData,
			isEditing: !!editingFolder,
			folderId: editingFolder?.id,
		});

		closeModal();
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

{#if isVisible}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal" on:click={handleModalClick}>
		<div class="modal-content">
			<div class="modal-header">
				<h3 class="modal-title">{modalTitle}</h3>
				<button class="close-btn" on:click={closeModal}>×</button>
			</div>

			<div class="modal-body">
				<div class="form-group">
					<label for="folderName">フォルダ名</label>
					<input
						type="text"
						id="folderName"
						bind:value={folderName}
						placeholder="フォルダ名を入力してください"
						required
					/>
				</div>

				<div class="form-group">
					<label for="folderComment">コメント</label>
					<textarea
						id="folderComment"
						bind:value={folderComment}
						placeholder="フォルダの説明やコメントを入力してください（任意）"
					></textarea>
				</div>

				<div class="form-group">
					<div class="checkbox-group">
						<input
							type="checkbox"
							id="folderPrivate"
							bind:checked={isPrivate}
						/>
						<label for="folderPrivate">プライベート</label>
					</div>
				</div>
			</div>

			<div class="modal-footer">
				<button class="btn btn-secondary" on:click={closeModal}>
					キャンセル
				</button>
				<button class="btn btn-primary" on:click={saveFolder}>
					保存
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
		max-width: 500px;
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

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group:last-child {
		margin-bottom: 0;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		color: #333;
		font-weight: 500;
		font-size: 0.9rem;
	}

	.form-group input[type="text"],
	.form-group textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.3s ease;
		box-sizing: border-box;
	}

	.form-group input[type="text"]:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.form-group textarea {
		resize: vertical;
		min-height: 100px;
		font-family: inherit;
	}

	.checkbox-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.checkbox-group input[type="checkbox"] {
		width: auto;
		margin: 0;
	}

	.checkbox-group label {
		margin: 0;
		cursor: pointer;
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

		.modal-footer {
			flex-direction: column;
		}
	}
</style>
