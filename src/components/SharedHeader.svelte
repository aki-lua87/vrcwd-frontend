<script>
	import { onMount } from 'svelte';
	import { CognitoAuthService } from '../lib/cognito-auth.ts';
	
	let isLoggedIn = false;
	let currentUserId = '';
	let currentPath = '';
	
	onMount(async () => {
		currentPath = window.location.pathname;
		await checkAuthStatus();
	});
	
	async function checkAuthStatus() {
		try {
			// Check for legacy userId first
			const storedUserId = localStorage.getItem("userId");
			if (storedUserId) {
				isLoggedIn = true;
				currentUserId = storedUserId;
				return;
			}

			// Check Cognito authentication
			const idToken = localStorage.getItem('idToken');
			const userEmail = localStorage.getItem('userEmail');
			
			if (idToken && userEmail) {
				// Verify token is not expired
				const tokenPayload = JSON.parse(atob(idToken.split('.')[1]));
				if (tokenPayload.exp * 1000 > Date.now()) {
					isLoggedIn = true;
					currentUserId = userEmail;
				}
			}
		} catch (error) {
			console.error('Auth check error:', error);
			isLoggedIn = false;
			currentUserId = '';
		}
	}
	
	function goToDashboard() {
		window.location.href = "/dashboard";
	}
	
	function goToLogin() {
		window.location.href = "/login";
	}
	
	function goToSettings() {
		window.location.href = "/settings";
	}
	
	async function logout() {
		try {
			// Check for legacy userId first
			const storedUserId = localStorage.getItem("userId");
			if (storedUserId) {
				localStorage.removeItem("userId");
				window.location.href = "/";
				return;
			}

			// Cognito logout - just clear tokens
			localStorage.removeItem('idToken');
			localStorage.removeItem('accessToken');
			localStorage.removeItem('refreshToken');
			localStorage.removeItem('userEmail');
			
			window.location.href = "/";
		} catch (error) {
			console.error('Logout error:', error);
			// Force logout by clearing local storage and redirecting
			localStorage.clear();
			window.location.href = "/";
		}
	}
	
	// Check if current page is dashboard
	$: isDashboardPage = currentPath === '/dashboard';
</script>

<div class="header">
	<div class="header-content">
		<h1>VRChat Worlds Dashboard</h1>
		<div class="nav-info">
			{#if isLoggedIn}
				<span class="user-display">ユーザー: {currentUserId}</span>
				{#if !isDashboardPage}
					<button class="nav-btn" on:click={goToDashboard}>ダッシュボード</button>
				{/if}
				<button class="nav-btn" on:click={goToSettings}>設定</button>
				<button class="nav-btn logout-btn" on:click={logout}>ログアウト</button>
			{:else}
				<button class="nav-btn" on:click={goToLogin}>ログイン</button>
			{/if}
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

	.nav-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.user-display {
		font-size: 0.9rem;
		opacity: 0.9;
	}

	.nav-btn {
		background: rgba(255, 255, 255, 0.2);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.3);
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		transition: background-color 0.3s ease;
		font-size: 0.9rem;
	}

	.nav-btn:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	/* スマートフォン向けスタイル */
	@media (max-width: 768px) {
		.header-content {
			padding: 0 0.5rem;
		}
		
		.header h1 {
			font-size: 1.2rem;
		}
		
		.nav-info {
			flex-wrap: wrap;
			gap: 0.5rem;
		}
		
		.user-display {
			font-size: 0.8rem;
		}
		
		.nav-btn {
			padding: 0.4rem 0.8rem;
			font-size: 0.8rem;
		}
	}
</style>