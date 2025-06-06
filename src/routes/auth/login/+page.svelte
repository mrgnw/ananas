<script>
  import { getContext } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { encodeBase64url, decodeBase64url } from '@oslojs/encoding';
  import { slide } from 'svelte/transition';
  
  // Get user store from context
  const userStore = getContext('user');
  
  let email = $state('');
  let password = $state('');
  let errorMessage = $state('');
  let isLoading = $state(false);
  let supportsWebAuthn = $state(false);
  let showPasswordField = $state(false);
  
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
      
      // Convert challenge from base64url to ArrayBuffer for WebAuthn using @oslojs/encoding
      const challenge = decodeBase64url(beginResult.options.challenge).buffer;
      
      // Helper function to decode base64url with fallback
      function safeDecodeBase64url(str) {
        try {
          return decodeBase64url(str).buffer;
        } catch (error) {
          // Manual fallback for credential IDs that might not be perfectly formatted
          const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
          const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
          const binary = atob(padded);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          return bytes.buffer;
        }
      }
      
      // Convert allowCredentials
      const allowCredentials = beginResult.options.allowCredentials.map(cred => ({
        ...cred,
        id: safeDecodeBase64url(cred.id)
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
      
      // Convert credential for sending to server using @oslojs/encoding
      const credentialForServer = {
        id: credential.id,
        rawId: encodeBase64url(new Uint8Array(credential.rawId)),
        type: credential.type,
        response: {
          clientDataJSON: encodeBase64url(new Uint8Array(credential.response.clientDataJSON)),
          authenticatorData: encodeBase64url(new Uint8Array(credential.response.authenticatorData)),
          signature: encodeBase64url(new Uint8Array(credential.response.signature)),
          userHandle: credential.response.userHandle ? encodeBase64url(new Uint8Array(credential.response.userHandle)) : null
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
      
      {#if supportsWebAuthn}
        <button 
          type="button" 
          class="auth-button passkey" 
          onclick={handlePasskeyLogin}
          disabled={isLoading || showPasswordField}
        >
          {isLoading ? 'Authenticating...' : '🔐 Login with Passkey'}
        </button>
      {/if}
      
      {#if showPasswordField}
        <div class="form-group" transition:slide={{ duration: 200 }}>
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            bind:value={password} 
            placeholder="Enter your password"
            disabled={isLoading}
            autofocus
          />
        </div>
      {/if}
      
      {#if !showPasswordField}
        <button 
          type="button" 
          class="auth-button secondary" 
          onclick={() => showPasswordField = true}
          disabled={isLoading}
        >
          Login with Password
        </button>
      {/if}
      
      {#if showPasswordField}
        <form onsubmit={handlePasswordLogin}>
          <button type="submit" class="auth-button primary" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
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
    gap: 1rem;
  }
  
  .auth-button.passkey {
    background: #059669;
    width: 100%;
  }
  
  .auth-button.passkey:hover {
    background: #047857;
  }
  
  .auth-button.secondary {
    background: #6b7280;
    width: 100%;
  }
  
  .auth-button.secondary:hover {
    background: #4b5563;
  }
  
  .auth-button.primary {
    background: #3730a3;
    width: 100%;
    margin-top: 0.5rem;
  }
  
  .auth-button.primary:hover {
    background: #4f46e5;
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