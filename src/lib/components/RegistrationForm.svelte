<script>
  import { registerPasskey } from '$lib/client/webauthn.js';
  import { setAuthenticatedUser } from '$lib/client/authStore.js';

  let username = $state('');
  let registerStatus = $state({
    loading: false,
    success: false,
    error: null
  });

  async function handleRegister(event) {
    event.preventDefault();
    
    if (!username) {
      registerStatus.error = 'Username is required';
      return;
    }
    
    registerStatus.loading = true;
    registerStatus.error = null;
    registerStatus.success = false;
    
    try {
      const result = await registerPasskey(username);
      
      if (result.verified) {
        registerStatus.success = true;
        setAuthenticatedUser(result.username);
      } else {
        registerStatus.error = result.error || 'Registration failed';
      }
    } catch (error) {
      registerStatus.error = error.message || 'An error occurred during registration';
      console.error('Registration error:', error);
    } finally {
      registerStatus.loading = false;
    }
  }
</script>

<div class="register-form">
  <h2>Register with a Passkey</h2>
  
  <form onsubmit={handleRegister}>
    <div class="form-group">
      <label for="username">Username</label>
      <input 
        type="text" 
        id="username" 
        bind:value={username} 
        placeholder="Enter username" 
        disabled={registerStatus.loading}
        required
      />
    </div>
    
    <button 
      type="submit" 
      disabled={registerStatus.loading || !username}
    >
      {registerStatus.loading ? 'Registering...' : 'Register'}
    </button>
    
    {#if registerStatus.error}
      <div class="error-message">
        {registerStatus.error}
      </div>
    {/if}
    
    {#if registerStatus.success}
      <div class="success-message">
        Successfully registered with passkey!
      </div>
    {/if}
  </form>
  
  <div class="info-text">
    <p>
      This will create a new account and register a passkey for your device.
    </p>
  </div>
</div>

<style>
  .register-form {
    max-width: 400px;
    margin: 0 auto;
    padding: 20px;
  }

  .form-group {
    margin-bottom: 15px;
  }

  label {
    display: block;
    margin-bottom: 5px;
  }

  input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  button {
    background-color: #4CAF50;
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

  .success-message {
    color: #4CAF50;
    margin-top: 10px;
  }
  
  .info-text {
    margin-top: 20px;
    font-size: 0.9em;
    color: #666;
  }
</style>
