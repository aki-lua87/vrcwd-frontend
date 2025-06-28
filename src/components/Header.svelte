<script>
	import { CognitoAuthService } from '../lib/cognito-auth.ts';
	
	export let userId = '';
	
	async function logout() {
		try {
			// Check for legacy userId first
			const storedUserId = localStorage.getItem("userId");
			if (storedUserId) {
				localStorage.removeItem("userId");
				window.location.href = "/";
				return;
			}

			// Cognito logout
			const cognitoConfig = {
				region: import.meta.env.COGNITO_REGION || 'us-east-1',
				userPoolId: import.meta.env.COGNITO_USER_POOL_ID || '',
				clientId: import.meta.env.COGNITO_CLIENT_ID || '',
			};

			const authService = new CognitoAuthService(cognitoConfig);
			await authService.signOut();
			
			window.location.href = "/login";
		} catch (error) {
			console.error('Logout error:', error);
			// Force logout by clearing local storage and redirecting
			localStorage.clear();
			window.location.href = "/login";
		}
	}
</script>

<div class="header">
	<div class="header-content">
		<h1>VRChat Worlds Dashboard</h1>
		<div class="user-info">
			<span id="userDisplay">ユーザー: {userId}</span>
			<button class="logout-btn" on:click={logout}>ログアウト</button>
		</div>
	</div>
</div>

<style>
	.header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 1rem 0;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.header-content {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.header h1 {
		font-size: 1.5rem;
		font-weight: 600;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.logout-btn {
		background: rgba(255, 255, 255, 0.2);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.3);
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		transition: background-color 0.3s ease;
	}

	.logout-btn:hover {
		background: rgba(255, 255, 255, 0.3);
	}
</style>