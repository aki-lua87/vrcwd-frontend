<script>
	import { createEventDispatcher } from 'svelte';
	import { apiService } from '../lib/api-service';

	const dispatch = createEventDispatcher();

	export let selectedWorlds = [];
	export let folders = [];
	export let currentFolder = null;

	let showBulkMenu = false;
	let isProcessing = false;
	let processMessage = '';

	// バルク操作メニューのオプション
	const bulkOptions = [
		{ id: 'move', label: '選択したワールドを移動', icon: '📁' },
		{ id: 'copy', label: '選択したワールドをコピー', icon: '📋' },
		{ id: 'remove', label: '選択したワールドを削除', icon: '🗑️' },
		{ id: 'export', label: '選択したワールドをエクスポート', icon: '💾' },
		{ id: 'tag', label: '選択したワールドにタグ追加', icon: '🏷️' }
	];

	// フォルダ選択モーダル
	let showFolderSelector = false;
	let selectedTargetFolder = null;
	let currentOperation = null;

	// タグ追加モーダル
	let showTagModal = false;
	let newTagName = '';
	let newTagColor = '#667eea';

	// エクスポート設定
	let exportFormat = 'json';

	// バルク操作実行
	async function executeBulkOperation(operation) {
		if (selectedWorlds.length === 0) {
			alert('ワールドが選択されていません。');
			return;
		}

		currentOperation = operation;

		switch (operation) {
			case 'move':
			case 'copy':
				showFolderSelector = true;
				break;
			case 'remove':
				if (confirm(`選択した${selectedWorlds.length}個のワールドを削除しますか？`)) {
					await performBulkRemove();
				}
				break;
			case 'export':
				await performBulkExport();
				break;
			case 'tag':
				showTagModal = true;
				break;
		}

		showBulkMenu = false;
	}

	// フォルダへの移動/コピー実行
	async function performFolderOperation() {
		if (!selectedTargetFolder) {
			alert('移動先フォルダを選択してください。');
			return;
		}

		isProcessing = true;
		processMessage = currentOperation === 'move' ? 'ワールドを移動中...' : 'ワールドをコピー中...';

		try {
			const worldIds = selectedWorlds.map(world => world.world_id);

			if (currentOperation === 'move') {
				// 移動の場合は現在のフォルダから削除してから新しいフォルダに追加
				if (currentFolder) {
					await apiService.bulkRemoveWorldsFromFolder(currentFolder.id, worldIds);
				}
			}

			// 新しいフォルダに追加
			const response = await apiService.bulkAddWorldsToFolder(selectedTargetFolder.id, worldIds);

			if (response.success) {
				const action = currentOperation === 'move' ? '移動' : 'コピー';
				alert(`${selectedWorlds.length}個のワールドを${action}しました。`);
				dispatch('bulkOperationComplete', { 
					type: currentOperation, 
					count: selectedWorlds.length 
				});
			} else {
				throw new Error(response.error || '操作に失敗しました');
			}
		} catch (error) {
			console.error('Bulk operation error:', error);
			alert(`操作に失敗しました: ${error.message}`);
		} finally {
			isProcessing = false;
			processMessage = '';
			showFolderSelector = false;
			selectedTargetFolder = null;
		}
	}

	// バルク削除実行
	async function performBulkRemove() {
		if (!currentFolder) return;

		isProcessing = true;
		processMessage = 'ワールドを削除中...';

		try {
			const worldIds = selectedWorlds.map(world => world.world_id);
			const response = await apiService.bulkRemoveWorldsFromFolder(currentFolder.id, worldIds);

			if (response.success) {
				alert(`${selectedWorlds.length}個のワールドを削除しました。`);
				dispatch('bulkOperationComplete', { 
					type: 'remove', 
					count: selectedWorlds.length 
				});
			} else {
				throw new Error(response.error || '削除に失敗しました');
			}
		} catch (error) {
			console.error('Bulk remove error:', error);
			alert(`削除に失敗しました: ${error.message}`);
		} finally {
			isProcessing = false;
			processMessage = '';
		}
	}

	// バルクエクスポート実行
	async function performBulkExport() {
		isProcessing = true;
		processMessage = 'データをエクスポート中...';

		try {
			// 選択されたワールドのデータを作成
			const exportData = {
				worlds: selectedWorlds,
				exported_at: new Date().toISOString(),
				total_count: selectedWorlds.length
			};

			// ファイル形式に応じてデータを変換
			let fileContent, mimeType, filename;

			switch (exportFormat) {
				case 'json':
					fileContent = JSON.stringify(exportData, null, 2);
					mimeType = 'application/json';
					filename = `vrchat_worlds_${new Date().toISOString().split('T')[0]}.json`;
					break;
				case 'csv':
					const csvHeader = 'World ID,World Name,Author,Description,Tags\n';
					const csvRows = selectedWorlds.map(world => 
						`"${world.world_id}","${world.world_name || ''}","${world.world_author_name || ''}","${(world.world_description || '').replace(/"/g, '""')}","${(world.tags || []).join(', ')}"`
					).join('\n');
					fileContent = csvHeader + csvRows;
					mimeType = 'text/csv';
					filename = `vrchat_worlds_${new Date().toISOString().split('T')[0]}.csv`;
					break;
			}

			// ファイルダウンロード
			const blob = new Blob([fileContent], { type: mimeType });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			alert(`${selectedWorlds.length}個のワールドをエクスポートしました。`);
		} catch (error) {
			console.error('Export error:', error);
			alert(`エクスポートに失敗しました: ${error.message}`);
		} finally {
			isProcessing = false;
			processMessage = '';
		}
	}

	// バルクタグ追加実行
	async function performBulkTagging() {
		if (!newTagName.trim()) {
			alert('タグ名を入力してください。');
			return;
		}

		isProcessing = true;
		processMessage = 'タグを追加中...';

		try {
			let successCount = 0;
			
			for (const world of selectedWorlds) {
				try {
					const response = await apiService.addWorldTag(world.world_id, newTagName.trim());
					if (response.success) {
						successCount++;
					}
				} catch (error) {
					console.warn(`Failed to add tag to world ${world.world_id}:`, error);
				}
			}

			alert(`${successCount}個のワールドにタグ「${newTagName.trim()}」を追加しました。`);
			dispatch('bulkOperationComplete', { 
				type: 'tag', 
				count: successCount,
				tag: newTagName.trim()
			});
		} catch (error) {
			console.error('Bulk tagging error:', error);
			alert(`タグ追加に失敗しました: ${error.message}`);
		} finally {
			isProcessing = false;
			processMessage = '';
			showTagModal = false;
			newTagName = '';
		}
	}

	// 全選択/全解除
	function toggleSelectAll() {
		dispatch('toggleSelectAll');
	}

	// モーダルを閉じる
	function closeModals() {
		showFolderSelector = false;
		showTagModal = false;
		selectedTargetFolder = null;
		currentOperation = null;
		newTagName = '';
	}
</script>

<div class="bulk-operations">
	<div class="bulk-header">
		<div class="selection-info">
			<span class="selected-count">
				{selectedWorlds.length}個のワールドを選択中
			</span>
			<button 
				class="select-all-btn"
				on:click={toggleSelectAll}
			>
				全選択/解除
			</button>
		</div>

		{#if selectedWorlds.length > 0}
			<div class="bulk-actions">
				<button 
					class="bulk-menu-btn"
					on:click={() => showBulkMenu = !showBulkMenu}
					disabled={isProcessing}
				>
					⚙️ 一括操作
				</button>

				{#if showBulkMenu}
					<div class="bulk-menu">
						{#each bulkOptions as option}
							<button 
								class="bulk-option"
								on:click={() => executeBulkOperation(option.id)}
								disabled={isProcessing}
							>
								{option.icon} {option.label}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>

	{#if isProcessing}
		<div class="processing-indicator">
			<div class="spinner"></div>
			<span>{processMessage}</span>
		</div>
	{/if}
</div>

<!-- フォルダ選択モーダル -->
{#if showFolderSelector}
	<div class="modal-overlay" on:click={closeModals}>
		<div class="modal" on:click|stopPropagation>
			<div class="modal-header">
				<h3>
					{currentOperation === 'move' ? '移動先フォルダを選択' : 'コピー先フォルダを選択'}
				</h3>
				<button class="close-btn" on:click={closeModals}>×</button>
			</div>
			
			<div class="modal-content">
				<div class="folder-list">
					{#each folders.filter(f => f.id !== currentFolder?.id) as folder}
						<button 
							class="folder-option"
							class:selected={selectedTargetFolder?.id === folder.id}
							on:click={() => selectedTargetFolder = folder}
						>
							📁 {folder.folder_name || folder.name}
						</button>
					{/each}
				</div>
			</div>
			
			<div class="modal-actions">
				<button 
					class="confirm-btn"
					on:click={performFolderOperation}
					disabled={!selectedTargetFolder || isProcessing}
				>
					{currentOperation === 'move' ? '移動実行' : 'コピー実行'}
				</button>
				<button class="cancel-btn" on:click={closeModals}>
					キャンセル
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- タグ追加モーダル -->
{#if showTagModal}
	<div class="modal-overlay" on:click={closeModals}>
		<div class="modal" on:click|stopPropagation>
			<div class="modal-header">
				<h3>タグを追加</h3>
				<button class="close-btn" on:click={closeModals}>×</button>
			</div>
			
			<div class="modal-content">
				<div class="tag-form">
					<label for="tag-name">タグ名</label>
					<input 
						id="tag-name"
						type="text"
						placeholder="タグ名を入力..."
						bind:value={newTagName}
						class="tag-input"
					/>
					
					<label for="tag-color">タグ色</label>
					<input 
						id="tag-color"
						type="color"
						bind:value={newTagColor}
						class="color-input"
					/>
				</div>
			</div>
			
			<div class="modal-actions">
				<button 
					class="confirm-btn"
					on:click={performBulkTagging}
					disabled={!newTagName.trim() || isProcessing}
				>
					タグ追加
				</button>
				<button class="cancel-btn" on:click={closeModals}>
					キャンセル
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.bulk-operations {
		background: white;
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.bulk-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.selection-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.selected-count {
		font-weight: 500;
		color: #333;
	}

	.select-all-btn {
		background: #f8f9fa;
		border: 1px solid #ddd;
		border-radius: 4px;
		padding: 0.5rem 1rem;
		cursor: pointer;
		font-size: 0.8rem;
		transition: all 0.2s ease;
	}

	.select-all-btn:hover {
		background: #e9ecef;
	}

	.bulk-actions {
		position: relative;
	}

	.bulk-menu-btn {
		background: #667eea;
		color: white;
		border: none;
		border-radius: 6px;
		padding: 0.75rem 1.5rem;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.bulk-menu-btn:hover:not(:disabled) {
		background: #5a67d8;
		transform: translateY(-1px);
	}

	.bulk-menu-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.bulk-menu {
		position: absolute;
		top: 100%;
		right: 0;
		background: white;
		border: 1px solid #ddd;
		border-radius: 6px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		z-index: 10;
		min-width: 220px;
		margin-top: 0.5rem;
	}

	.bulk-option {
		width: 100%;
		text-align: left;
		padding: 0.75rem 1rem;
		border: none;
		background: white;
		cursor: pointer;
		transition: background-color 0.2s ease;
		font-size: 0.9rem;
	}

	.bulk-option:hover:not(:disabled) {
		background: #f8f9fa;
	}

	.bulk-option:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.bulk-option:first-child {
		border-radius: 6px 6px 0 0;
	}

	.bulk-option:last-child {
		border-radius: 0 0 6px 6px;
	}

	.processing-indicator {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-top: 1rem;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 6px;
		color: #666;
	}

	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid #ddd;
		border-top: 2px solid #667eea;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: white;
		border-radius: 12px;
		max-width: 500px;
		width: 90vw;
		max-height: 80vh;
		overflow-y: auto;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #eee;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 1.2rem;
		color: #333;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #666;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-btn:hover {
		background: #f8f9fa;
	}

	.modal-content {
		padding: 1.5rem;
	}

	.folder-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 300px;
		overflow-y: auto;
	}

	.folder-option {
		width: 100%;
		text-align: left;
		padding: 1rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		background: white;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.folder-option:hover {
		background: #f8f9fa;
		border-color: #667eea;
	}

	.folder-option.selected {
		background: #667eea;
		color: white;
		border-color: #667eea;
	}

	.tag-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.tag-form label {
		font-weight: 500;
		color: #333;
	}

	.tag-input {
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 0.9rem;
	}

	.tag-input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.color-input {
		width: 60px;
		height: 40px;
		border: 1px solid #ddd;
		border-radius: 6px;
		cursor: pointer;
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
		padding: 1.5rem;
		border-top: 1px solid #eee;
		justify-content: flex-end;
	}

	.confirm-btn, .cancel-btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.confirm-btn {
		background: #667eea;
		color: white;
	}

	.confirm-btn:hover:not(:disabled) {
		background: #5a67d8;
		transform: translateY(-1px);
	}

	.confirm-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.cancel-btn {
		background: #6c757d;
		color: white;
	}

	.cancel-btn:hover {
		background: #5a6268;
		transform: translateY(-1px);
	}

	@media (max-width: 768px) {
		.bulk-header {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.selection-info {
			justify-content: space-between;
		}

		.bulk-menu {
			position: static;
			margin-top: 1rem;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		}

		.modal {
			width: 95vw;
			margin: 1rem;
		}

		.modal-actions {
			flex-direction: column;
		}
	}
</style>