<script>
	export let disabled = false;

	// Svelte 5 event props
	export let onaddWorld = () => {};

	let worldIdInput = "";

	function addWorld() {
		if (worldIdInput.trim()) {
			onaddWorld({ worldInput: worldIdInput.trim() });
			worldIdInput = "";
		}
	}

	function handleKeypress(event) {
		if (event.key === "Enter") {
			addWorld();
		}
	}
</script>

<div class="world-actions">
	<input
		type="text"
		bind:value={worldIdInput}
		class="world-input"
		placeholder="ワールドを追加するにはワールドID (wrld_...) またはURLを入力してください"
		on:keypress={handleKeypress}
		{disabled}
	/>
	<button class="btn btn-primary" on:click={addWorld} {disabled}>
		ワールド追加
	</button>
</div>

<style>
	.world-actions {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.world-input {
		padding: 0.5rem;
		border: 1px solid #eee;
		border-radius: 8px;
		flex: 1;
		min-width: 300px;
		font-size: 1rem;
	}

	.world-input:disabled {
		background: #f5f5f5;
		cursor: not-allowed;
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

	.btn-primary {
		background: #667eea;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #764ba2;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		.world-actions {
			flex-direction: column;
			align-items: stretch;
		}

		.world-input {
			min-width: auto;
		}
	}
</style>
