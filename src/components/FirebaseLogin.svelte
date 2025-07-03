<script lang="ts">
  import { onMount } from 'svelte';
  import { firebaseAuth } from '../lib/firebase-auth';
  // Firebase User type will be handled inline

  export let onAuthSuccess: ((user: any) => void) | undefined = undefined;
  export let onAuthError: ((error: string) => void) | undefined = undefined;

  let isLoading = false;
  let error = '';
  let user: any = null;

  onMount(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((authUser) => {
      user = authUser;
      // 認証状態の表示のみを行い、自動リダイレクトはしない
      // リダイレクトはログインボタンクリック時のみ実行
    });

    return () => {
      unsubscribe();
    };
  });

  async function handleGoogleSignIn() {
    isLoading = true;
    error = '';

    try {
      const result = await firebaseAuth.signInWithGoogle();
      
      if (result.success && result.user) {
        // 認証成功時はダッシュボードにリダイレクト
        if (typeof onAuthSuccess === 'function') {
          onAuthSuccess(result.user);
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        error = result.error || 'ログインに失敗しました';
        if (typeof onAuthError === 'function') {
          onAuthError(error);
        }
      }
    } catch (err: any) {
      error = err.message || 'エラーが発生しました';
      if (typeof onAuthError === 'function') {
        onAuthError(error);
      }
    } finally {
      isLoading = false;
    }
  }

  async function handleSignOut() {
    isLoading = true;
    error = '';

    try {
      const result = await firebaseAuth.signOut();
      
      if (!result.success) {
        error = result.error || 'ログアウトに失敗しました';
        if (typeof onAuthError === 'function') {
          onAuthError(error);
        }
      }
    } catch (err: any) {
      error = err.message || 'エラーが発生しました';
      if (typeof onAuthError === 'function') {
        onAuthError(error);
      }
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="firebase-auth-container">
  {#if user}
    <div class="user-info">
      <div class="user-profile">
        {#if user.photoURL}
          <img src={user.photoURL} alt="Profile" class="profile-image" />
        {/if}
        <div class="user-details">
          <h3>{user.displayName || 'ユーザー'}</h3>
          <p>{user.email}</p>
        </div>
      </div>
      
      <button 
        class="btn btn-secondary" 
        on:click={handleSignOut}
        disabled={isLoading}
      >
        {isLoading ? 'ログアウト中...' : 'ログアウト'}
      </button>
    </div>
  {:else}
    <div class="login-form">
      <h2>ログイン</h2>
      <p>Googleアカウントでログインしてください</p>
      
      {#if error}
        <div class="error-message">
          {error}
        </div>
      {/if}
      
      <button 
        class="btn btn-google" 
        on:click={handleGoogleSignIn}
        disabled={isLoading}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" class="google-icon">
          <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {isLoading ? 'ログイン中...' : 'Googleでログイン'}
      </button>
    </div>
  {/if}
</div>

<style>
  .firebase-auth-container {
    max-width: 400px;
    margin: 0 auto;
    padding: 2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .login-form {
    text-align: center;
  }

  .login-form h2 {
    margin-bottom: 0.5rem;
    color: #333;
    font-size: 1.5rem;
  }

  .login-form p {
    margin-bottom: 2rem;
    color: #666;
    font-size: 0.9rem;
  }

  .user-info {
    text-align: center;
  }

  .user-profile {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .profile-image {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
  }

  .user-details h3 {
    margin: 0 0 0.25rem 0;
    color: #333;
    font-size: 1.1rem;
  }

  .user-details p {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    min-width: 200px;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-google {
    background: #ffffff;
    color: #333;
    border: 2px solid #dadce0;
  }

  .btn-google:hover:not(:disabled) {
    background: #f8f9fa;
    border-color: #c4c7c5;
  }

  .btn-secondary {
    background: #6c757d;
    color: white;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #5a6268;
  }

  .google-icon {
    flex-shrink: 0;
  }

  .error-message {
    background: #f8d7da;
    color: #721c24;
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  @media (max-width: 480px) {
    .firebase-auth-container {
      padding: 1.5rem;
      margin: 1rem;
    }

    .user-profile {
      flex-direction: column;
      text-align: center;
    }
  }
</style>