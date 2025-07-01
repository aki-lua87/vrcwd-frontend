<script>
	export let currentPage = 1;
	export let totalPages = 1;
	export let totalCount = 0;
	
	// Svelte 5 event props
	export let onpageChange = () => {};
	
	function previousPage() {
		if (currentPage > 1) {
			onpageChange({ page: currentPage - 1 });
			// Scroll to top of page
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}
	
	function nextPage() {
		if (currentPage < totalPages) {
			onpageChange({ page: currentPage + 1 });
			// Scroll to top of page
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}
	
	$: showPagination = totalPages > 1;
</script>

{#if showPagination}
	<div class="pagination">
		<button 
			class="btn btn-secondary" 
			on:click={previousPage}
			disabled={currentPage <= 1}
		>
			← 前のページ
		</button>
		
		<div class="page-info">
			{currentPage} / {totalPages} ページ (総 {totalCount} 件)
		</div>
		
		<button 
			class="btn btn-secondary" 
			on:click={nextPage}
			disabled={currentPage >= totalPages}
		>
			次のページ →
		</button>
	</div>
{/if}

<style>
	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		margin-top: 2rem;
		padding: 1rem;
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

	.btn-secondary {
		background: white;
		color: #333;
		border: 1px solid #eee;
	}

	.btn-secondary:hover:not(:disabled) {
		background: #f5f7fa;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.page-info {
		font-weight: 500;
		color: #333;
	}
</style>