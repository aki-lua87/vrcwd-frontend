<script>
	export let totalWorlds = 0;
</script>

<div class="stats">
	<div class="stat-card">
		<div class="stat-number">{totalWorlds}</div>
		<div class="stat-label">総ワールド数</div>
	</div>
</div>

<style>
	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		text-align: center;
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
</style>