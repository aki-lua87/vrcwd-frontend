<script>
	import { createEventDispatcher } from "svelte";

	const dispatch = createEventDispatcher();

	export let totalWorlds = 0;
	export let disabled = false;
	export let clearSearch = false;

	let searchQuery = "";

	// Watch for clearSearch changes
	$: if (clearSearch) {
		searchQuery = "";
		handleSearch();
	}

	function handleSearch() {
		const query = searchQuery || "";
		console.log("Stats: dispatching search event with query:", query);
		dispatch("search", { query: query });
	}

	function handleClear() {
		searchQuery = "";
		console.log("Stats: cleared search query");
		dispatch("search", { query: "" });
	}

	function handleKeyPress(event) {
		if (event.key === "Enter") {
			handleSearch();
		}
	}

	function handleInput() {
		const query = searchQuery || "";
		console.log("Stats: input changed to:", query);
		handleSearch();
	}
</script>

<div class="stats-container">
	<div class="stats-left">
		<div class="stat-card">
			<div class="stat-number">{totalWorlds}</div>
			<div class="stat-label">総ワールド数</div>
		</div>
	</div>

	<div class="stats-right">
		<div class="search-container">
			<div class="search-box">
				<input
					type="text"
					bind:value={searchQuery}
					on:input={handleInput}
					on:keypress={handleKeyPress}
					placeholder="フォルダ内をフィルタリング..."
					{disabled}
					class="search-input"
				/>
				{#if searchQuery}
					<button
						type="button"
						on:click={handleClear}
						class="clear-button"
						title="クリア"
					>
						×
					</button>
				{/if}
			</div>
			{#if searchQuery}
				<div class="search-info">
					検索中: "{searchQuery}"
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.stats-container {
		display: flex;
		align-items: stretch;
		gap: 2rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}

	.stats-left {
		flex: 0 0 auto;
	}

	.stats-right {
		flex: 1;
		min-width: 300px;
		display: flex;
	}

	.stat-card {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		text-align: center;
		min-width: 200px;
		height: fit-content;
	}

	.stat-number {
		font-size: 2rem;
		font-weight: bold;
		color: #667eea;
		margin-bottom: 0.5rem;
	}

	.stat-label {
		color: #666;
		font-size: 0.9rem;
	}

	.search-container {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		width: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.search-box {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem 2.5rem 0.75rem 1rem;
		border: 2px solid #e1e5e9;
		border-radius: 8px;
		font-size: 1rem;
		background: white;
		transition: border-color 0.2s;
	}

	.search-input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.search-input:disabled {
		background: #f8f9fa;
		color: #6c757d;
		cursor: not-allowed;
	}

	.clear-button {
		position: absolute;
		right: 0.5rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		font-size: 1.5rem;
		color: #6c757d;
		cursor: pointer;
		padding: 0.25rem;
		line-height: 1;
		border-radius: 4px;
		transition:
			color 0.2s,
			background-color 0.2s;
	}

	.clear-button:hover {
		color: #dc3545;
		background-color: #f8f9fa;
	}

	.search-info {
		margin-top: 0.5rem;
		font-size: 0.9rem;
		color: #6c757d;
		font-style: italic;
		min-height: 1.2rem;
	}

	@media (max-width: 768px) {
		.stats-container {
			flex-direction: column;
			gap: 1rem;
		}

		.stats-right {
			min-width: unset;
		}
	}
</style>
