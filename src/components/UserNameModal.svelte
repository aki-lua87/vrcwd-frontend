<script>
	import { createEventDispatcher } from 'svelte';
	import { apiService } from '../lib/api-service';
	
	export let isVisible = false;
	export let userName = '';
	
	const dispatch = createEventDispatcher();
	
	let inputUserName = userName;
	let isLoading = false;
	let error = '';
	
	$: if (isVisible) {
		inputUserName = userName;
		error = '';
	}
	
	function handleClose() {
		if (!isLoading) {
			dispatch('close');
		}
	}
	
	async function handleSave() {
		if (!inputUserName.trim()) {
			error = 'ユーザー名を入力してください。';
			return;
		}
		
		if (inputUserName.trim().length > 50) {
			error = 'ユーザー名は50文字以内で入力してください。';
			return;
		}
		
		isLoading = true;
		error = '';
		
		try {
			const response = await apiService.updateUserProfile({
				user_name: inputUserName.trim()
			});
			
			if (response.success) {
				dispatch('save', { userName: inputUserName.trim() });
			} else {
				error = response.error || 'ユーザー名の更新に失敗しました。';
			}
		} catch (err) {
			error = 'ユーザー名の更新中にエラーが発生しました。';
			console.error('Error updating user name:', err);
		} finally {
			isLoading = false;
		}
	}
	
	function handleKeydown(event) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSave();
		} else if (event.key === 'Escape') {
			handleClose();
		}
	}
</script>

{#if isVisible}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-overlay" on:click={handleClose}>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="modal-content" on:click|stopPropagation>
			<div class="modal-header">
				<h2>ユーザー名の設定</h2>
				<button class="close-button" on:click={handleClose} disabled={isLoading}>
					×
				</button>
			</div>
			
			<div class="modal-body">
				<div class="welcome-message">
					<p>🎉 ようこそ！</p>
					<p>ダッシュボードで使用するユーザー名を設定してください。</p>
				</div>
				
				<div class="input-group">
					<label for="userName">ユーザー名</label>
					<input
						id="userName"
						type="text"
						bind:value={inputUserName}
						on:keydown={handleKeydown}
						placeholder="ユーザー名を入力してください"
						maxlength="50"
						disabled={isLoading}
						class:error={error}
					/>
					{#if error}
						<div class="error-message">{error}</div>
					{/if}
				</div>
				
				<div class="modal-actions">
					<button
						class="btn btn-secondary"
						on:click={handleClose}
						disabled={isLoading}
					>
						スキップ
					</button>
					<button
						class="btn btn-primary"
						on:click={handleSave}
						disabled={isLoading || !inputUserName.trim()}
					>
						{#if isLoading}
							保存中...
						{:else}
							保存
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
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
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
		animation: modalSlideIn 0.3s ease-out;
	}

	@keyframes modalSlideIn {
		from {
			transform: translateY(-20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem 2rem 1rem;
		border-bottom: 1px solid #eee;
	}

	.modal-header h2 {
		margin: 0;
		color: #333;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.close-button {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #666;
		padding: 0.25rem;
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.close-button:hover:not(:disabled) {
		background: #f0f0f0;
		color: #333;
	}

	.close-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.modal-body {
		padding: 2rem;
	}

	.welcome-message {
		text-align: center;
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: linear-gradient(135deg, #f8f9ff 0%, #e9ecff 100%);
		border-radius: 8px;
		border-left: 4px solid #667eea;
	}

	.welcome-message p {
		margin: 0;
		color: #333;
		line-height: 1.6;
	}

	.welcome-message p:first-child {
		font-size: 1.1rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.input-group {
		margin-bottom: 1.5rem;
	}

	.input-group label {
		display: block;
		margin-bottom: 0.5rem;
		color: #333;
		font-weight: 500;
	}

	.input-group input {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #ddd;
		border-radius: 6px;
		font-size: 1rem;
		transition: border-color 0.2s ease;
		box-sizing: border-box;
	}

	.input-group input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.input-group input.error {
		border-color: #e53e3e;
	}

	.input-group input:disabled {
		background: #f5f5f5;
		opacity: 0.6;
	}

	.error-message {
		color: #e53e3e;
		font-size: 0.875rem;
		margin-top: 0.5rem;
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
		transition: all 0.2s ease;
		min-width: 80px;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: #f8f9fa;
		color: #666;
		border: 1px solid #ddd;
	}

	.btn-secondary:hover:not(:disabled) {
		background: #e9ecef;
		color: #333;
	}

	.btn-primary {
		background: #667eea;
		color: white;
		box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
	}

	.btn-primary:hover:not(:disabled) {
		background: #5a67d8;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
	}

	@media (max-width: 768px) {
		.modal-content {
			margin: 0.5rem;
			max-width: calc(100% - 1rem);
		}

		.modal-header {
			padding: 1rem 1.5rem 0.5rem;
		}

		.modal-body {
			padding: 1.5rem;
		}

		.welcome-message {
			padding: 1rem;
			margin-bottom: 1.5rem;
		}

		.modal-actions {
			flex-direction: column;
			gap: 0.5rem;
		}

		.btn {
			width: 100%;
		}
	}
</style>