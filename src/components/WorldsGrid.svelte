<script>
	import WorldCard from "./WorldCard.svelte";

	export let worldsData = [];

	// Svelte 5 event props
	export let onopenWorldDetails = () => {};
	export let onsaveComment = () => {};
	export let onremoveFromFolder = () => {};
</script>

<div class="worlds-grid">
	{#if worldsData.length === 0}
		<div class="empty-message">このフォルダにはワールドがありません。</div>
	{:else}
		{#each worldsData as world (world.world_id)}
			<WorldCard
				{world}
				{onopenWorldDetails}
				{onsaveComment}
				{onremoveFromFolder}
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
