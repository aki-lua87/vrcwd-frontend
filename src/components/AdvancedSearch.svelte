<script>
	import { createEventDispatcher } from 'svelte';
	import { apiService } from '../lib/api-service';

	const dispatch = createEventDispatcher();

	// 検索オプション
	let searchQuery = '';
	let selectedTags = [];
	let authorQuery = '';
	let sortBy = 'recent';
	let sortOrder = 'desc';
	let showAdvanced = false;

	// 利用可能なタグ一覧
	let availableTags = [];
	let tagInput = '';
	let showTagSuggestions = false;

	// 検索結果
	let searchResults = [];
	let isSearching = false;
	let searchError = '';
	let currentPage = 1;
	let totalPages = 1;
	let totalCount = 0;

	const RESULTS_PER_PAGE = 12;

	const sortOptions = [
		{ value: 'recent', label: '最新順' },
		{ value: 'popularity', label: '人気順' },
		{ value: 'name', label: '名前順' },
		{ value: 'creation_date', label: '作成日順' }
	];

	// タグ一覧を読み込み
	async function loadTags() {
		try {
			const response = await apiService.getAllTags();
			if (response.success) {
				availableTags = response.data || [];
			}
		} catch (error) {
			console.error('Error loading tags:', error);
		}
	}

	// 検索実行
	async function performSearch(page = 1) {
		if (!searchQuery.trim() && selectedTags.length === 0 && !authorQuery.trim()) {
			searchResults = [];
			return;
		}

		isSearching = true;
		searchError = '';
		currentPage = page;

		try {
			const searchOptions = {
				query: searchQuery.trim() || undefined,
				tags: selectedTags.length > 0 ? selectedTags : undefined,
				author: authorQuery.trim() || undefined,
				sortBy,
				sortOrder,
				page: currentPage,
				limit: RESULTS_PER_PAGE
			};

			const response = await apiService.searchWorldsAdvanced(searchOptions);
			
			if (response.success) {
				searchResults = response.data.worlds || [];
				totalCount = response.data.total || 0;
				totalPages = Math.ceil(totalCount / RESULTS_PER_PAGE);
				
				// 検索結果をダッシュボードに送信
				dispatch('searchResults', {
					results: searchResults,
					totalCount,
					currentPage,
					totalPages
				});
			} else {
				throw new Error(response.error || '検索に失敗しました');
			}
		} catch (error) {
			console.error('Search error:', error);
			searchError = error.message;
			searchResults = [];
		} finally {
			isSearching = false;
		}
	}

	// タグ追加
	function addTag(tag) {
		if (!selectedTags.includes(tag)) {
			selectedTags = [...selectedTags, tag];
			tagInput = '';
			showTagSuggestions = false;
		}
	}

	// タグ削除
	function removeTag(tag) {
		selectedTags = selectedTags.filter(t => t !== tag);
	}

	// タグ候補フィルタリング
	$: tagSuggestions = availableTags.filter(tag => 
		tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
		!selectedTags.includes(tag.name)
	).slice(0, 10);

	// 検索条件変更時の自動検索
	$: if (searchQuery || selectedTags.length > 0 || authorQuery) {
		const timeoutId = setTimeout(() => {
			performSearch(1);
		}, 500);
		
		return () => clearTimeout(timeoutId);
	}

	// コンポーネント初期化
	import { onMount } from 'svelte';
	onMount(() => {
		loadTags();
	});

	// 検索クリア
	function clearSearch() {
		searchQuery = '';
		selectedTags = [];
		authorQuery = '';
		searchResults = [];
		currentPage = 1;
		totalPages = 1;
		totalCount = 0;
		dispatch('searchCleared');
	}

	// ページ変更
	function changePage(page) {
		if (page >= 1 && page <= totalPages) {
			performSearch(page);
		}
	}
</script>

<div class="advanced-search">
	<div class="search-header">
		<h3 class="search-title">🔍 ワールド検索</h3>
		<button 
			class="toggle-advanced"
			class:active={showAdvanced}
			on:click={() => showAdvanced = !showAdvanced}
		>
			{showAdvanced ? '簡易検索' : '高度な検索'}
		</button>
	</div>

	<div class="search-form">
		<!-- 基本検索 -->
		<div class="search-row">
			<div class="search-field">
				<label for="search-query">ワールド名・説明</label>
				<input
					id="search-query"
					type="text"
					placeholder="検索キーワードを入力..."
					bind:value={searchQuery}
					class="search-input"
				/>
			</div>
			
			{#if !showAdvanced}
				<button 
					class="search-btn"
					on:click={() => performSearch(1)}
					disabled={isSearching}
				>
					{isSearching ? '検索中...' : '検索'}
				</button>
			{/if}
		</div>

		{#if showAdvanced}
			<!-- 高度な検索オプション -->
			<div class="advanced-options">
				<!-- タグ検索 -->
				<div class="search-field">
					<label for="tag-input">タグ</label>
					<div class="tag-input-container">
						<input
							id="tag-input"
							type="text"
							placeholder="タグを入力..."
							bind:value={tagInput}
							on:focus={() => showTagSuggestions = true}
							on:blur={() => setTimeout(() => showTagSuggestions = false, 200)}
							class="search-input"
						/>
						
						{#if showTagSuggestions && tagSuggestions.length > 0}
							<div class="tag-suggestions">
								{#each tagSuggestions as tag}
									<button 
										class="tag-suggestion"
										on:click={() => addTag(tag.name)}
									>
										{tag.name}
									</button>
								{/each}
							</div>
						{/if}
					</div>
					
					{#if selectedTags.length > 0}
						<div class="selected-tags">
							{#each selectedTags as tag}
								<span class="tag-chip">
									{tag}
									<button on:click={() => removeTag(tag)}>×</button>
								</span>
							{/each}
						</div>
					{/if}
				</div>

				<!-- 作者検索 -->
				<div class="search-field">
					<label for="author-query">作者名</label>
					<input
						id="author-query"
						type="text"
						placeholder="作者名を入力..."
						bind:value={authorQuery}
						class="search-input"
					/>
				</div>

				<!-- ソート設定 -->
				<div class="sort-options">
					<div class="search-field">
						<label for="sort-by">並び順</label>
						<select id="sort-by" bind:value={sortBy} class="search-select">
							{#each sortOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>
					
					<div class="search-field">
						<label for="sort-order">順序</label>
						<select id="sort-order" bind:value={sortOrder} class="search-select">
							<option value="desc">降順</option>
							<option value="asc">昇順</option>
						</select>
					</div>
				</div>

				<!-- 検索・クリアボタン -->
				<div class="search-actions">
					<button 
						class="search-btn"
						on:click={() => performSearch(1)}
						disabled={isSearching}
					>
						{isSearching ? '検索中...' : '検索実行'}
					</button>
					<button 
						class="clear-btn"
						on:click={clearSearch}
					>
						クリア
					</button>
				</div>
			</div>
		{/if}
	</div>

	<!-- 検索結果表示 -->
	{#if searchError}
		<div class="search-error">
			❌ {searchError}
		</div>
	{/if}

	{#if searchResults.length > 0}
		<div class="search-results-info">
			<span class="results-count">
				🌍 {totalCount}件のワールドが見つかりました
			</span>
			
			{#if totalPages > 1}
				<div class="search-pagination">
					<button 
						class="page-btn"
						disabled={currentPage <= 1}
						on:click={() => changePage(currentPage - 1)}
					>
						← 前
					</button>
					
					<span class="page-info">
						{currentPage} / {totalPages}
					</span>
					
					<button 
						class="page-btn"
						disabled={currentPage >= totalPages}
						on:click={() => changePage(currentPage + 1)}
					>
						次 →
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.advanced-search {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	.search-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.search-title {
		margin: 0;
		font-size: 1.2rem;
		font-weight: 600;
		color: #333;
	}

	.toggle-advanced {
		background: #f8f9fa;
		border: 1px solid #ddd;
		border-radius: 6px;
		padding: 0.5rem 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.9rem;
	}

	.toggle-advanced:hover {
		background: #e9ecef;
	}

	.toggle-advanced.active {
		background: #667eea;
		color: white;
		border-color: #667eea;
	}

	.search-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.search-row {
		display: flex;
		gap: 1rem;
		align-items: end;
	}

	.search-field {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.search-field label {
		font-weight: 500;
		color: #555;
		font-size: 0.9rem;
	}

	.search-input, .search-select {
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 0.9rem;
		transition: border-color 0.2s ease;
	}

	.search-input:focus, .search-select:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.tag-input-container {
		position: relative;
	}

	.tag-suggestions {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: white;
		border: 1px solid #ddd;
		border-top: none;
		border-radius: 0 0 6px 6px;
		max-height: 200px;
		overflow-y: auto;
		z-index: 10;
	}

	.tag-suggestion {
		width: 100%;
		text-align: left;
		padding: 0.75rem;
		border: none;
		background: white;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.tag-suggestion:hover {
		background: #f8f9fa;
	}

	.selected-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.tag-chip {
		background: #667eea;
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.8rem;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.tag-chip button {
		background: none;
		border: none;
		color: white;
		cursor: pointer;
		font-size: 0.9rem;
		padding: 0;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.tag-chip button:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.advanced-options {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #eee;
	}

	.sort-options {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.search-actions {
		display: flex;
		gap: 1rem;
	}

	.search-btn, .clear-btn, .page-btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s ease;
		font-size: 0.9rem;
	}

	.search-btn {
		background: #667eea;
		color: white;
	}

	.search-btn:hover:not(:disabled) {
		background: #5a67d8;
		transform: translateY(-1px);
	}

	.search-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.clear-btn {
		background: #6c757d;
		color: white;
	}

	.clear-btn:hover {
		background: #5a6268;
		transform: translateY(-1px);
	}

	.page-btn {
		background: white;
		color: #333;
		border: 1px solid #ddd;
	}

	.page-btn:hover:not(:disabled) {
		background: #f8f9fa;
		transform: translateY(-1px);
	}

	.page-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	.search-error {
		background: #fee;
		color: #c33;
		padding: 1rem;
		border-radius: 6px;
		border-left: 4px solid #c33;
		margin-top: 1rem;
	}

	.search-results-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #eee;
	}

	.results-count {
		font-weight: 500;
		color: #333;
	}

	.search-pagination {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.page-info {
		font-weight: 500;
		color: #666;
		padding: 0 0.5rem;
	}

	@media (max-width: 768px) {
		.advanced-search {
			padding: 1rem;
		}

		.search-row {
			flex-direction: column;
		}

		.sort-options {
			grid-template-columns: 1fr;
		}

		.search-actions {
			flex-direction: column;
		}

		.search-results-info {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}

		.search-pagination {
			justify-content: center;
		}
	}
</style>