<script>
  import { getContext } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  
  // Get user store from context
  const userStore = getContext('user');
  
  let email = $state('');
  let password = $state('');
  let errorMessage = $state('');
  let isLoading = $state(false);
  let supportsWebAuthn = $state(false);
  
  // Check WebAuthn support on mount
  if (browser) {
    supportsWebAuthn = !!(navigator.credentials && navigator.credentials.get);
  }
  
  async function handlePasswordLogin(e) {
    e.preventDefault();
    
    // Prevent double submission
    if (isLoading) return;
    
    if (!email || !password) {
      errorMessage = 'Please enter both email and password';
      return;
    }
    
    isLoading = true;
    errorMessage = '';
    
    try {
      // Use direct fetch instead of going through the store to avoid reactivity issues
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const result = await loginResponse.json();
      
      if (loginResponse.ok && result.success) {
        // Set the auth state using the result
        userStore.setAuthState(result.user);
        
        // Wait for state to update before navigation
        await Promise.resolve();
        
        // Redirect to homepage after successful login with a small delay
        setTimeout(() => {
          goto('/', { replaceState: true });
        }, 50);
      } else {
        errorMessage = result.message || 'Login failed. Please check your credentials.';
      }
    } catch (error) {
      console.error('Login error:', error);
      errorMessage = 'An unexpected error occurred. Please try again.';
    } finally {
      isLoading = false;
    }
  }
  
  async function handlePasskeyLogin() {
    // Prevent double submission
    if (isLoading) return;
    
    // Basic validation
    if (!email) {
      errorMessage = 'Email is required for passkey authentication';
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errorMessage = 'Please enter a valid email address';
      return;
    }
    
    if (!supportsWebAuthn) {
      errorMessage = 'Your browser does not support passkeys. Please use password login instead.';
      return;
    }
    
    isLoading = true;
    errorMessage = '';
    
    try {
      // Start passkey authentication
      const beginResponse = await fetch('/api/auth/passkey/login/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const beginResult = await beginResponse.json();
      
      if (!beginResponse.ok || !beginResult.success) {
        errorMessage = beginResult.message || 'Failed to start passkey authentication';
        return;
      }
      
      // Convert challenge to ArrayBuffer for WebAuthn
      const challenge = Uint8Array.from(atob(beginResult.options.challenge.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
      
      // Convert allowCredentials
      const allowCredentials = beginResult.options.allowCredentials.map(cred => ({
        ...cred,
        id: Uint8Array.from(atob(cred.id.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
      }));
      
      // Get credential using WebAuthn
      const credential = await navigator.credentials.get({
        publicKey: {
          ...beginResult.options,
          challenge,
          allowCredentials
        }
      });
      
      if (!credential) {
        errorMessage = 'Passkey authentication was cancelled or failed';
        return;
      }
      
      // Convert credential for sending to server
      const credentialForServer = {
        id: credential.id,
        rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''),
        type: credential.type,
        response: {
          clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(credential.response.clientDataJSON))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''),
          authenticatorData: btoa(String.fromCharCode(...new Uint8Array(credential.response.authenticatorData))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''),
          signature: btoa(String.fromCharCode(...new Uint8Array(credential.response.signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''),
          userHandle: credential.response.userHandle ? btoa(String.fromCharCode(...new Uint8Array(credential.response.userHandle))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '') : null
        }
      };
      
      // Complete authentication on server
      const verifyResponse = await fetch('/api/auth/passkey/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: beginResult.challengeId,
          credential: credentialForServer
        })
      });
      
      const verifyResult = await verifyResponse.json();
      
      if (verifyResponse.ok && verifyResult.success) {
        // Set auth state and redirect
        if (verifyResult.user) {
          userStore.setAuthState(verifyResult.user);
        }
        goto('/', { replaceState: true });
      } else {
        errorMessage = verifyResult.message || 'Passkey authentication failed';
      }
    } catch (error) {
      console.error('Passkey authentication error:', error);
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Passkey authentication was cancelled or not allowed';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Passkeys are not supported on this device';
      } else {
        errorMessage = 'An unexpected error occurred during passkey authentication';
      }
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="auth-container">
  <div class="auth-card">
    <h1>Login</h1>
    
    {#if errorMessage}
      <div class="error-message">{errorMessage}</div>
    {/if}
    
    <div class="auth-form">
      <div class="form-group">
        <label for="email">Email</label>
        <input 
          type="email" 
          id="email" 
          bind:value={email} 
          required 
          placeholder="Enter your email"
          disabled={isLoading}
        />
      </div>
      
      <!-- Password login section -->
      <form onsubmit={handlePasswordLogin} class="password-form">
        <div class="form-section">
          <h3>Login with Password</h3>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              bind:value={password} 
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>
          
          <button type="submit" class="auth-button" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login with Password'}
          </button>
        </div>
      </form>
      
      <!-- Passkey login section -->
      {#if supportsWebAuthn}
        <div class="divider">
          <span>or</span>
        </div>
        
        <div class="form-section">
          <h3>Login with Passkey</h3>
          <p class="passkey-description">
            Use your device's built-in security for quick, secure access.
          </p>
          
          <button 
            type="button" 
            class="auth-button passkey-button" 
            onclick={handlePasskeyLogin}
            disabled={isLoading}
          >
            {isLoading ? 'Authenticating...' : '🔐 Login with Passkey'}
          </button>
        </div>
      {/if}
    </div>
    
    <div class="auth-links">
      <p>Don't have an account? <a href="/auth/signup">Sign up</a></p>
    </div>
  </div>
</div>

<style>
  .auth-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem 1rem;
    min-height: calc(100vh - 200px);
  }
  
  .auth-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
    padding: 2rem;
    width: 100%;
    max-width: 400px;
  }
  
  .auth-card h1 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    font-weight: 600;
    text-align: center;
  }
  
  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  
  .password-form {
    display: contents;
  }
  
  .form-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }
  
  .form-section h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  .divider {
    display: flex;
    align-items: center;
    text-align: center;
    margin: 1rem 0;
  }
  
  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e5e7eb;
  }
  
  .divider span {
    padding: 0 1rem;
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .passkey-description {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.4;
  }
  
  .passkey-button {
    background: #059669 !important;
  }
  
  .passkey-button:hover {
    background: #047857 !important;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .form-group label {
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .form-group input {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    transition: all 0.15s ease;
  }
  
  .form-group input:focus {
    background: white;
    border-color: #3730a3;
    box-shadow: 0 0 0 3px rgba(55, 48, 163, 0.1);
    outline: none;
  }
  
  .auth-button {
    background: #3730a3;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s ease;
    margin-top: 0.5rem;
  }
  
  .auth-button:hover {
    background: #4f46e5;
  }
  
  .auth-button:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
  
  .error-message {
    background: #fee2e2;
    color: #b91c1c;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }
  
  .auth-links {
    margin-top: 1.5rem;
    text-align: center;
    font-size: 0.875rem;
    color: #4b5563;
  }
  
  .auth-links a {
    color: #3730a3;
    text-decoration: none;
    font-weight: 500;
  }
  
  .auth-links a:hover {
    text-decoration: underline;
  }
</style>