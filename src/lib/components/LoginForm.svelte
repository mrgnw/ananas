<script>
  import { authenticateWithPasskey } from '$lib/client/webauthn.js';
  import { setAuthenticatedUser } from '$lib/client/authStore.js';
  import { auth } from '$lib/client/authStore.js';

  let username = $state('');
  let authStatus = $state({
    loading: false,
    error: null
  });
  
  let usePasskeyOnly = $state(false);

  async function handleLogin(event) {
    event.preventDefault();
    
    if (!usePasskeyOnly && !username) {
      authStatus.error = 'Username is required';
      return;
    }
    
    authStatus.loading = true;
    authStatus.error = null;
    
    try {
      // For passkey-only authentication, we pass null as the username
      const usernameToUse = usePasskeyOnly ? null : username;
      const result = await authenticateWithPasskey(usernameToUse);
      
      if (result.verified) {
        setAuthenticatedUser(result.username);
      } else {
        authStatus.error = result.error || 'Authentication failed';
      }
    } catch (error) {
      authStatus.error = error.message || 'An error occurred during authentication';
      console.error('Authentication error:', error);
    } finally {
      authStatus.loading = false;
    }
  }
  
  function togglePasskeyOnly() {
    usePasskeyOnly = !usePasskeyOnly;
    if (usePasskeyOnly) {
      username = '';
    }
  }
</script>

<div class="login-form">
  <h2>Sign In</h2>
  
  <form on:submit={handleLogin}>
    <div class="passkey-toggle">
      <label>
        <input 
          type="checkbox" 
          bind:checked={usePasskeyOnly}
          on:change={togglePasskeyOnly}
        />
        Sign in with passkey only
      </label>
    </div>
    
    {#if !usePasskeyOnly}
      <div class="form-group">
        <label for="login-username">Username</label>
        <input 
          type="text" 
          id="login-username" 
          bind:value={username} 
          placeholder="Enter username" 
          disabled={authStatus.loading}
          required
        />
      </div>
    {/if}
    
    <button 
      type="submit" 
      disabled={authStatus.loading || (!usePasskeyOnly && !username)}
    >
      {#if authStatus.loading}
        Authenticating...
      {:else if usePasskeyOnly}
        Continue with Passkey
      {:else}
        Continue with Username
      {/if}
    </button>
    
    {#if authStatus.error}
      <div class="error-message">
        {authStatus.error}
      </div>
    {/if}
  </form>
  
  <div class="info-text">
    <p>
      {#if usePasskeyOnly}
        Your browser will prompt you to select a passkey.
      {:else}
        Enter your username and you'll be prompted for your passkey.
      {/if}
    </p>
  </div>
</div>

<style>
  .login-form {
    max-width: 400px;
    margin: 0 auto;
    padding: 20px;
  }

  .form-group {
    margin-bottom: 15px;
  }

  .passkey-toggle {
    margin-bottom: 15px;
  }

  label {
    display: block;
    margin-bottom: 5px;
  }

  input[type="text"] {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  button {
    background-color: #2196F3;
    color: white;
    padding: 10px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    width: 100%;
    margin-top: 10px;
  }

  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  .error-message {
    color: #f44336;
    margin-top: 10px;
  }
  
  .info-text {
    margin-top: 20px;
    font-size: 0.9em;
    color: #666;
  }
</style>
