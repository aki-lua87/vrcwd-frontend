<script>
	import { createEventDispatcher } from 'svelte';
	import WorldCard from './WorldCard.svelte';
	
	export let worldsData = [];
	
	const dispatch = createEventDispatcher();
	
	function handleOpenWorldDetails(event) {
		dispatch('openWorldDetails', event.detail);
	}
	
	function handleSaveComment(event) {
		dispatch('saveComment', event.detail);
	}
	
	function handleRemoveFromFolder(event) {
		dispatch('removeFromFolder', event.detail);
	}
</script>

<div class="worlds-grid">
	{#if worldsData.length === 0}
		<div class="empty-message">
			このフォルダーにはワールドがありません。
		</div>
	{:else}
		{#each worldsData as world (world.world_id)}
			<WorldCard 
				{world}
				on:openWorldDetails={handleOpenWorldDetails}
				on:saveComment={handleSaveComment}
				on:removeFromFolder={handleRemoveFromFolder}
			/>
		{/each}
	{/if}
</div>

<style>
	.worlds-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1.5rem;
	}

	.empty-message {
		text-align: center;
		padding: 2rem;
		color: #666;
		grid-column: 1 / -1;
	}
</style>