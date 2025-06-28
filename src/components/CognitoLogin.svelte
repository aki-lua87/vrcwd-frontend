<script>
  import { onMount } from 'svelte';
  import { CognitoAuthService } from '../lib/cognito-auth.ts';

  // Configuration from environment variables (passed as props)
  export let cognitoConfig = {
    region: '',
    userPoolId: '',
    clientId: '',
  };

  let authService;
  let isLoading = false;
  let error = '';
  let success = '';
  let mode = 'signin'; // 'signin', 'signup', 'confirm'

  // Form data
  let username = '';
  let password = '';
  let email = '';
  let confirmationCode = '';
  let confirmPassword = '';

  onMount(() => {
    // Validate Cognito configuration
    if (!cognitoConfig.userPoolId || !cognitoConfig.clientId) {
      showError('Cognito設定が不完全です。環境変数を確認してください。');
      return;
    }

    authService = new CognitoAuthService(cognitoConfig);
    
    // Check if already authenticated
    try {
      if (authService.isAuthenticated()) {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      console.warn('Authentication check failed:', err);
    }
  });

  async function handleSignIn() {
    if (!username.trim() || !password.trim()) {
      showError('ユーザー名とパスワードを入力してください。');
      return;
    }

    isLoading = true;
    error = '';

    try {
      await authService.signIn(username.trim(), password);
      showSuccess('ログインに成功しました。');
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } catch (err) {
      console.error('Sign in error:', err);
      showError(err.message);
    } finally {
      isLoading = false;
    }
  }

  async function handleSignUp() {
    if (!username.trim() || !email.trim() || !password.trim()) {
      showError('全ての必須項目を入力してください。');
      return;
    }

    if (password !== confirmPassword) {
      showError('パスワードが一致しません。');
      return;
    }

    if (password.length < 8) {
      showError('パスワードは8文字以上で入力してください。');
      return;
    }

    isLoading = true;
    error = '';

    try {
      await authService.signUp(username.trim(), password, email.trim());
      showSuccess('アカウントが作成されました。確認コードをメールでお送りしました。');
      mode = 'confirm';
    } catch (err) {
      console.error('Sign up error:', err);
      showError(err.message);
    } finally {
      isLoading = false;
    }
  }

  async function handleConfirmSignUp() {
    if (!username.trim() || !confirmationCode.trim()) {
      showError('ユーザー名と確認コードを入力してください。');
      return;
    }

    isLoading = true;
    error = '';

    try {
      await authService.confirmSignUp(username.trim(), confirmationCode.trim());
      showSuccess('アカウントの確認が完了しました。ログインしてください。');
      mode = 'signin';
      clearForm();
    } catch (err) {
      console.error('Confirm sign up error:', err);
      showError(err.message);
    } finally {
      isLoading = false;
    }
  }

  function showError(message) {
    error = message;
    success = '';
    setTimeout(() => {
      error = '';
    }, 5000);
  }

  function showSuccess(message) {
    success = message;
    error = '';
    setTimeout(() => {
      success = '';
    }, 5000);
  }

  function clearForm() {
    username = '';
    password = '';
    email = '';
    confirmationCode = '';
    confirmPassword = '';
  }

  function switchMode(newMode) {
    mode = newMode;
    error = '';
    success = '';
  }

  function handleKeypress(event) {
    if (event.key === 'Enter') {
      if (mode === 'signin') {
        handleSignIn();
      } else if (mode === 'signup') {
        handleSignUp();
      } else if (mode === 'confirm') {
        handleConfirmSignUp();
      }
    }
  }
</script>

<div class="auth-container">
  <div class="auth-card">
    <div class="auth-header">
      <h1>VRChat Worlds Dashboard</h1>
      {#if mode === 'signin'}
        <p>アカウントにログインしてください</p>
      {:else if mode === 'signup'}
        <p>新しいアカウントを作成してください</p>
      {:else if mode === 'confirm'}
        <p>確認コードを入力してください</p>
      {/if}
    </div>

    {#if error}
      <div class="error-message">{error}</div>
    {/if}

    {#if success}
      <div class="success-message">{success}</div>
    {/if}

    <form class="auth-form" on:submit|preventDefault>
      {#if mode === 'signin'}
        <div class="form-group">
          <label for="username">ユーザー名またはメールアドレス</label>
          <input
            type="text"
            id="username"
            bind:value={username}
            on:keypress={handleKeypress}
            placeholder="ユーザー名またはメールアドレスを入力"
            disabled={isLoading}
            required
          />
        </div>

        <div class="form-group">
          <label for="password">パスワード</label>
          <input
            type="password"
            id="password"
            bind:value={password}
            on:keypress={handleKeypress}
            placeholder="パスワードを入力"
            disabled={isLoading}
            required
          />
        </div>

        <button
          type="button"
          class="auth-button"
          on:click={handleSignIn}
          disabled={isLoading}
        >
          {isLoading ? 'ログイン中...' : 'ログイン'}
        </button>

        <div class="auth-links">
          <button type="button" class="link-button" on:click={() => switchMode('signup')}>
            アカウントをお持ちでない方はこちら
          </button>
        </div>

      {:else if mode === 'signup'}
        <div class="form-group">
          <label for="username">ユーザー名</label>
          <input
            type="text"
            id="username"
            bind:value={username}
            on:keypress={handleKeypress}
            placeholder="ユーザー名を入力"
            disabled={isLoading}
            required
          />
        </div>

        <div class="form-group">
          <label for="email">メールアドレス</label>
          <input
            type="email"
            id="email"
            bind:value={email}
            on:keypress={handleKeypress}
            placeholder="メールアドレスを入力"
            disabled={isLoading}
            required
          />
        </div>

        <div class="form-group">
          <label for="password">パスワード</label>
          <input
            type="password"
            id="password"
            bind:value={password}
            on:keypress={handleKeypress}
            placeholder="パスワードを入力（8文字以上）"
            disabled={isLoading}
            required
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">パスワード確認</label>
          <input
            type="password"
            id="confirmPassword"
            bind:value={confirmPassword}
            on:keypress={handleKeypress}
            placeholder="パスワードを再入力"
            disabled={isLoading}
            required
          />
        </div>

        <button
          type="button"
          class="auth-button"
          on:click={handleSignUp}
          disabled={isLoading}
        >
          {isLoading ? 'アカウント作成中...' : 'アカウント作成'}
        </button>

        <div class="auth-links">
          <button type="button" class="link-button" on:click={() => switchMode('signin')}>
            既にアカウントをお持ちの方はこちら
          </button>
        </div>

      {:else if mode === 'confirm'}
        <div class="form-group">
          <label for="username">ユーザー名</label>
          <input
            type="text"
            id="username"
            bind:value={username}
            on:keypress={handleKeypress}
            placeholder="ユーザー名を入力"
            disabled={isLoading}
            required
          />
        </div>

        <div class="form-group">
          <label for="confirmationCode">確認コード</label>
          <input
            type="text"
            id="confirmationCode"
            bind:value={confirmationCode}
            on:keypress={handleKeypress}
            placeholder="メールで送信された確認コードを入力"
            disabled={isLoading}
            required
          />
        </div>

        <button
          type="button"
          class="auth-button"
          on:click={handleConfirmSignUp}
          disabled={isLoading}
        >
          {isLoading ? '確認中...' : 'アカウント確認'}
        </button>

        <div class="auth-links">
          <button type="button" class="link-button" on:click={() => switchMode('signin')}>
            ログインページに戻る
          </button>
        </div>
      {/if}
    </form>
  </div>
</div>

<style>
  .auth-container {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 1rem;
  }

  .auth-card {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 400px;
  }

  .auth-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .auth-header h1 {
    color: #333;
    margin-bottom: 0.5rem;
    font-size: 1.8rem;
    font-weight: 600;
  }

  .auth-header p {
    color: #666;
    margin: 0;
    font-size: 0.9rem;
  }

  .error-message {
    background: #fee;
    color: #c33;
    padding: 0.75rem;
    border-radius: 6px;
    border-left: 4px solid #c33;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .success-message {
    background: #d4edda;
    color: #28a745;
    padding: 0.75rem;
    border-radius: 6px;
    border-left: 4px solid #28a745;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group label {
    margin-bottom: 0.5rem;
    color: #555;
    font-weight: 500;
    font-size: 0.9rem;
  }

  .form-group input {
    padding: 0.75rem;
    border: 2px solid #ddd;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
  }

  .form-group input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .form-group input:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }

  .auth-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    margin-top: 0.5rem;
  }

  .auth-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
  }

  .auth-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .auth-links {
    margin-top: 1rem;
    text-align: center;
  }

  .link-button {
    background: none;
    border: none;
    color: #667eea;
    font-size: 0.9rem;
    cursor: pointer;
    text-decoration: underline;
  }

  .link-button:hover {
    color: #764ba2;
  }

  @media (max-width: 480px) {
    .auth-card {
      padding: 1.5rem;
    }

    .auth-header h1 {
      font-size: 1.5rem;
    }
  }
</style>