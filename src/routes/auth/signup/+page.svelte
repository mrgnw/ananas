<script>
  import { userStore } from '$lib/stores/user.svelte.js';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { encodeBase64url, decodeBase64url } from '@oslojs/encoding';
  
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let username = $state('');
  let errorMessage = $state('');
  let isLoading = $state(false);
  let supportsWebAuthn = $state(false);
  
  // Check WebAuthn support on mount
  if (browser) {
    supportsWebAuthn = !!(navigator.credentials && navigator.credentials.create);
  }
  
  async function handlePasswordSignup(e) {
    e.preventDefault();
    
    // Prevent double submission
    if (isLoading) return;
    
    // Validation
    if (!email || !password || !confirmPassword) {
      errorMessage = 'Please fill in all required fields';
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errorMessage = 'Please enter a valid email address';
      return;
    }
    
    // Password strength validation
    if (password.length < 8) {
      errorMessage = 'Password must be at least 8 characters long';
      return;
    }
    
    // Password confirmation check
    if (password !== confirmPassword) {
      errorMessage = 'Passwords do not match';
      return;
    }
    
    isLoading = true;
    errorMessage = '';
    
    try {
      // Use a local variable for the response to avoid reactivity issues
      const signupResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username })
      });
      
      const result = await signupResponse.json();
      
      if (signupResponse.ok && result.success) {
        // After signup, redirect to login page
        goto('/auth/login?registered=true');
      } else {
        errorMessage = result.message || 'Signup failed. Please try again.';
      }
    } catch (error) {
      console.error('Signup error:', error);
      errorMessage = 'An unexpected error occurred. Please try again.';
    } finally {
      isLoading = false;
    }
  }
  
  async function handlePasskeySignup() {
    // Prevent double submission
    if (isLoading) return;
    
    // Basic validation
    if (!email) {
      errorMessage = 'Email is required for passkey registration';
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errorMessage = 'Please enter a valid email address';
      return;
    }
    
    if (!supportsWebAuthn) {
      errorMessage = 'Your browser does not support passkeys. Please use password registration instead.';
      return;
    }
    
    isLoading = true;
    errorMessage = '';
    
    try {
      // Start passkey registration
      const beginResponse = await fetch('/api/auth/passkey/register/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username })
      });
      
      const beginResult = await beginResponse.json();
      
      if (!beginResponse.ok || !beginResult.success) {
        errorMessage = beginResult.message || 'Failed to start passkey registration';
        return;
      }
      
      // Convert challenge from base64url to ArrayBuffer for WebAuthn using @oslojs/encoding
      const challenge = decodeBase64url(beginResult.options.challenge).buffer;
      const userId = decodeBase64url(beginResult.options.user.id).buffer;
      
      // Create credential using WebAuthn
      console.log('WebAuthn create options:', {
        ...beginResult.options,
        challenge: challenge,
        user: {
          ...beginResult.options.user,
          id: userId
        }
      });
      
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
      
      console.log('WebAuthn credential created:', credential);
      
      if (!credential) {
        errorMessage = 'Passkey registration was cancelled or failed';
        return;
      }
      
      // Convert credential for sending to server using @oslojs/encoding
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
      
      // Complete registration on server
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
        // Set auth state and redirect
        if (verifyResult.user) {
          userStore.setAuthState(verifyResult.user);
        }
        goto('/', { replaceState: true });
      } else {
        errorMessage = verifyResult.message || 'Passkey registration failed';
      }
    } catch (error) {
      console.error('Passkey registration error:', error);
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Passkey registration was cancelled or not allowed';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Passkeys are not supported on this device';
      } else {
        errorMessage = 'An unexpected error occurred during passkey registration';
      }
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="auth-container">
  <div class="auth-card">
    <h1>Create Account</h1>
    
    {#if errorMessage}
      <div class="error-message">{errorMessage}</div>
    {/if}
    
    <div class="auth-form">
      <div class="form-group">
        <label for="email">Email <span class="required">*</span></label>
        <input 
          type="email" 
          id="email" 
          bind:value={email} 
          required 
          placeholder="Enter your email"
          disabled={isLoading}
        />
      </div>
      
      <div class="form-group">
        <label for="username">Username (optional)</label>
        <input 
          type="text" 
          id="username" 
          bind:value={username} 
          placeholder="Choose a username"
          disabled={isLoading}
        />
      </div>
      
      <!-- Password registration section -->
      <form onsubmit={handlePasswordSignup} class="password-form">
        <div class="form-section">
          <h3>Register with Password</h3>
          
          <div class="form-group">
            <label for="password">Password <span class="required">*</span></label>
            <input 
              type="password" 
              id="password" 
              bind:value={password} 
              placeholder="Create a password (min. 8 characters)"
              disabled={isLoading}
            />
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirm Password <span class="required">*</span></label>
            <input 
              type="password" 
              id="confirmPassword" 
              bind:value={confirmPassword} 
              placeholder="Confirm your password"
              disabled={isLoading}
            />
          </div>
          
          <button type="submit" class="auth-button" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Sign Up with Password'}
          </button>
        </div>
      </form>
      
      <!-- Passkey registration section -->
      {#if supportsWebAuthn}
        <div class="divider">
          <span>or</span>
        </div>
        
        <div class="form-section">
          <h3>Register with Passkey</h3>
          <p class="passkey-description">
            Use your device's built-in security (fingerprint, face, PIN) for secure, password-free access.
          </p>
          
          <button 
            type="button" 
            class="auth-button passkey-button" 
            onclick={handlePasskeySignup}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Passkey...' : '🔐 Sign Up with Passkey'}
          </button>
        </div>
      {/if}
    </div>
    
    <div class="auth-links">
      <p>Already have an account? <a href="/auth/login">Log in</a></p>
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
  
  .required {
    color: #dc2626;
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