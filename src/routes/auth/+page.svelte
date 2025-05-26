<script>
  import { getContext } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { encodeBase64url, decodeBase64url } from '@oslojs/encoding';
  import { slide } from 'svelte/transition';
  
  const userStore = getContext('user');
  
  let email = $state('');
  let password = $state('');
  let errorMessage = $state('');
  let isLoading = $state(false);
  let isCheckingEmail = $state(false);
  let emailExists = $state(null);
  let showPasswordField = $state(false);
  const supportsWebAuthn = browser && navigator.credentials?.create && navigator.credentials?.get;
  const isLogin = $derived(emailExists === true);
  
  let emailCheckTimeout;
  
  function handleEmailInput(event) {
    const emailValue = event.target.value;
    
    if (!emailValue?.includes('@')) {
      emailExists = null;
      showPasswordField = false;
      return;
    }
    
    clearTimeout(emailCheckTimeout);
    emailCheckTimeout = setTimeout(() => checkEmailExists(emailValue), 500);
  }
  
  async function checkEmailExists(emailToCheck = email) {
    if (!emailToCheck?.includes('@')) return false;
    
    isCheckingEmail = true;
    
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToCheck })
      });
      
      if (response.ok) {
        const result = await response.json();
        emailExists = result.exists;
        return true;
      } else {
        emailExists = null;
        return false;
      }
    } catch (error) {
      console.error('Email check failed:', error);
      emailExists = null;
      return false;
    } finally {
      isCheckingEmail = false;
    }
  }
  
  async function ensureEmailChecked() {
    if (emailExists === null && email.includes('@')) {
      const success = await checkEmailExists();
      if (!success) {
        throw new Error('Failed to verify email. Please try again.');
      }
    }
  }
  
  async function handlePasswordAuth(e) {
    e.preventDefault();
    
    if (isLoading) return;
    
    if (!email || !password) {
      errorMessage = 'Please enter both email and password';
      return;
    }
    
    isLoading = true;
    errorMessage = '';
    
    try {
      await ensureEmailChecked();
      
      const endpoint = emailExists ? '/api/auth/login' : '/api/auth/signup';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        await userStore.setAuthState(result.user);
        goto('/', { replaceState: true });
      } else {
        errorMessage = result.message || 'Authentication failed. Please check your credentials.';
      }
    } catch (error) {
      console.error('Auth error:', error);
      errorMessage = error.message || 'An unexpected error occurred. Please try again.';
    } finally {
      isLoading = false;
    }
  }
  
  async function handlePasskeyAuth() {
    if (isLoading) return;
    
    if (!email) {
      errorMessage = 'Email is required for passkey authentication';
      return;
    }
    
    if (!supportsWebAuthn) {
      errorMessage = 'Your browser does not support passkeys. Please use password authentication instead.';
      return;
    }
    
    isLoading = true;
    errorMessage = '';
    
    try {
      await ensureEmailChecked();
      
      if (emailExists) {
        // Login flow
        await handlePasskeyLogin();
      } else {
        // Register flow
        await handlePasskeyRegister();
      }
    } catch (error) {
      console.error('Passkey auth error:', error);
      errorMessage = error.message || 'An unexpected error occurred. Please try again.';
    } finally {
      isLoading = false;
    }
  }
  
  async function handlePasskeyLogin() {
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
    
    const challenge = decodeBase64url(beginResult.options.challenge).buffer;
    
    function safeDecodeBase64url(str) {
      try {
        return decodeBase64url(str).buffer;
      } catch (error) {
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
    
    const allowCredentials = beginResult.options.allowCredentials.map(cred => ({
      ...cred,
      id: safeDecodeBase64url(cred.id)
    }));
    
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
      if (verifyResult.user) {
        await userStore.setAuthState(verifyResult.user);
      }
      goto('/', { replaceState: true });
    } else {
      errorMessage = verifyResult.message || 'Passkey authentication failed';
    }
  }
  
  async function handlePasskeyRegister() {
    const beginResponse = await fetch('/api/auth/passkey/register/begin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const beginResult = await beginResponse.json();
    
    if (!beginResponse.ok || !beginResult.success) {
      errorMessage = beginResult.message || 'Failed to start passkey registration';
      return;
    }
    
    const challenge = decodeBase64url(beginResult.options.challenge).buffer;
    const userId = decodeBase64url(beginResult.options.user.id).buffer;
    
    const credential = await navigator.credentials.create({
      publicKey: {
        ...beginResult.options,
        challenge,
        user: {
          ...beginResult.options.user,
          id: userId
        }
      }
    });
    
    if (!credential) {
      errorMessage = 'Passkey registration was cancelled or failed';
      return;
    }
    
    const credentialForServer = {
      id: credential.id,
      rawId: encodeBase64url(new Uint8Array(credential.rawId)),
      type: credential.type,
      response: {
        clientDataJSON: encodeBase64url(new Uint8Array(credential.response.clientDataJSON)),
        attestationObject: encodeBase64url(new Uint8Array(credential.response.attestationObject)),
        transports: credential.response.getTransports ? credential.response.getTransports() : []
      }
    };
    
    const verifyResponse = await fetch('/api/auth/passkey/register/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeId: beginResult.challengeId,
        credential: credentialForServer
      })
    });
    
    const verifyResult = await verifyResponse.json();
    
    if (verifyResponse.ok && verifyResult.success) {
      if (verifyResult.user) {
        await userStore.setAuthState(verifyResult.user);
      }
      goto('/', { replaceState: true });
    } else {
      errorMessage = verifyResult.message || 'Passkey registration failed';
    }
  }
</script>

<div class="auth-container">
  <div class="auth-card">
    <h1>Log in</h1>
    
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
          oninput={handleEmailInput}
          required 
          placeholder="Enter your email"
          disabled={isLoading}
        />
      </div>
      
      {#if supportsWebAuthn}
          <button 
            type="button" 
            class="auth-button passkey" 
            onclick={handlePasskeyAuth}
            disabled={isLoading || showPasswordField}
          >
            {isLoading ? 'Authenticating...' : '🔐 with Passkey'}
          </button>
        {/if}
        
        {#if showPasswordField}
          <div class="form-group" transition:slide={{ duration: 200 }}>
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              bind:value={password} 
              placeholder={isLogin ? "Enter your password" : "Create a password (min. 8 characters)"}
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
            🔑 with Password
          </button>
        {/if}
        
        {#if showPasswordField}
          <form onsubmit={handlePasswordAuth}>
            <button type="submit" class="auth-button primary" disabled={isLoading}>
              {#if isLoading}
                {isLogin ? 'Signing in...' : 'Creating account...'}
              {:else}
                {isLogin ? 'Sign In' : 'Create Account'}
              {/if}
            </button>
          </form>
        {/if}
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
  
  .checking-indicator {
    font-size: 0.8rem;
    color: #6b7280;
    font-style: italic;
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
    width: 100%;
  }
  
  .auth-button:hover {
    background: #4f46e5;
  }
  
  .auth-button:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
  
  .auth-button.passkey {
    background: #059669;
  }
  
  .auth-button.passkey:hover {
    background: #047857;
  }
  
  .auth-button.secondary {
    background: #6b7280;
  }
  
  .auth-button.secondary:hover {
    background: #4b5563;
  }
  
  .auth-button.primary {
    background: #3730a3;
    margin-top: 0.5rem;
  }
  
  .auth-button.primary:hover {
    background: #4f46e5;
  }
  
  .error-message {
    background: #fee2e2;
    color: #b91c1c;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }
</style>