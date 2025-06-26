<script>
	import { createEventDispatcher } from 'svelte';
	
	export let world;
	
	const dispatch = createEventDispatcher();
	
	let isEditingComment = false;
	let commentInput = world.comment || '';
	
	function openWorldDetails() {
		dispatch('openWorldDetails', { worldId: world.world_id });
	}
	
	function toggleCommentEdit() {
		isEditingComment = !isEditingComment;
		if (isEditingComment) {
			commentInput = world.comment || '';
		}
	}
	
	function cancelCommentEdit() {
		isEditingComment = false;
		commentInput = world.comment || '';
	}
	
	async function saveComment() {
		dispatch('saveComment', { 
			worldId: world.world_id, 
			comment: commentInput.trim() 
		});
		isEditingComment = false;
	}
	
	function removeFromFolder() {
		dispatch('removeFromFolder', { worldId: world.world_id });
	}
	
	function handleImageError(event) {
		event.target.style.display = 'none';
	}
</script>

<div class="world-card">
	<div class="content">
		<!-- サムネイル画像 -->
		<div class="thumbnail" on:click={openWorldDetails} on:keydown role="button" tabindex="0">
			<img 
				src={world.world_thumbnail_image_url} 
				alt={world.world_name}
				on:error={handleImageError}
			/>
		</div>
		
		<!-- ワールド名 -->
		<div class="name-section">
			<div class="label">🌍 ワールド名</div>
			<h3 class="name-title">{world.world_name}</h3>
		</div>
		
		<!-- 作者 -->
		<div class="author-section">
			<div class="author-label">👤 作者</div>
			<div class="author-name">{world.world_author_name}</div>
		</div>
		
		<!-- 説明 -->
		<div class="description-section">
			<div class="desc-label">📝 説明</div>
			<div class="description">{world.world_description}</div>
		</div>
		
		<!-- コメント -->
		<div class="comment-section">
			<div class="comment-header">
				<div class="comment-label">💬 コメント</div>
			</div>
			
			{#if isEditingComment}
				<div class="comment-edit">
					<textarea
						bind:value={commentInput}
						placeholder="コメントを入力してください"
					></textarea>
					<div class="edit-buttons">
						<button class="btn-cancel" on:click={cancelCommentEdit}>キャンセル</button>
						<button class="btn-save" on:click={saveComment}>保存</button>
					</div>
				</div>
			{:else}
				<div class="comment-display" class:empty={!world.comment}>
					{world.comment || 'コメントがありません'}
				</div>
			{/if}
			
			<div class="comment-buttons">
				<button class="btn-edit" on:click={toggleCommentEdit}>
					✏️ コメントを編集
				</button>
				<button class="btn-delete" on:click={removeFromFolder}>
					🗑️ フォルダから削除
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.world-card {
		background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 50%, #f0f2f5 100%);
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(0, 0, 0, 0.05);
		transition: transform 0.3s ease, box-shadow 0.3s ease;
		position: relative;
	}

	.world-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
	}

	.content {
		padding: 1.5rem;
	}

	.thumbnail {
		width: 100%;
		height: 250px;
		overflow: hidden;
		border-radius: 8px;
		margin-bottom: 1rem;
		background: #f0f0f0;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.thumbnail:hover {
		transform: scale(1.02);
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
	}

	.thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.name-section {
		margin-bottom: 0.75rem;
	}

	.label, .author-label, .desc-label, .comment-label {
		font-size: 0.75rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.label {
		color: #333;
	}

	.name-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: #333;
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		margin: 0;
	}

	.author-section {
		margin-bottom: 0.75rem;
	}

	.author-label {
		color: #667eea;
	}

	.author-name {
		color: #667eea;
		font-size: 0.9rem;
		font-weight: 500;
		padding: 0.5rem;
		background: #f8f9ff;
		border-radius: 4px;
		border-left: 3px solid #667eea;
	}

	.description-section {
		margin-bottom: 0.75rem;
	}

	.desc-label {
		color: #444;
	}

	.description {
		color: #444;
		font-size: 0.85rem;
		line-height: 1.6;
		padding: 0.75rem;
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		border-radius: 8px;
		border-left: 4px solid #667eea;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		display: -webkit-box;
		-webkit-line-clamp: 6;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.comment-section {
		margin-top: 1rem;
	}

	.comment-header {
		margin-bottom: 0.5rem;
	}

	.comment-label {
		color: #667eea;
	}

	.comment-display {
		color: #667eea;
		font-size: 0.9rem;
		padding: 0.75rem;
		background: #f0f4ff;
		border-radius: 6px;
		border-left: 3px solid #667eea;
		line-height: 1.5;
		min-height: 2.5rem;
	}

	.comment-display.empty {
		color: #999;
		font-style: italic;
	}

	.comment-edit textarea {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #667eea;
		border-radius: 6px;
		font-size: 0.9rem;
		line-height: 1.5;
		resize: vertical;
		min-height: 80px;
		font-family: inherit;
		box-sizing: border-box;
	}

	.edit-buttons {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.5rem;
		justify-content: flex-end;
	}

	.btn-cancel, .btn-save {
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		font-size: 0.8rem;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.btn-cancel {
		background: #ddd;
		color: #333;
	}

	.btn-cancel:hover {
		background: #ccc;
	}

	.btn-save {
		background: #667eea;
		color: white;
	}

	.btn-save:hover {
		background: #5a6fd8;
	}

	.comment-buttons {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.5rem;
		justify-content: flex-start;
	}

	.btn-edit, .btn-delete {
		border: none;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.btn-edit {
		background: #667eea;
		color: white;
	}

	.btn-edit:hover {
		background: #5a6fd8;
	}

	.btn-delete {
		background: #c33;
		color: white;
	}

	.btn-delete:hover {
		background: #a02622;
	}
</style>