<script>
  import { userStore } from '$lib/stores/user.svelte.js';
  import { goto } from '$app/navigation';
  
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let username = $state('');
  let errorMessage = $state('');
  let isLoading = $state(false);
  
  async function handleSignup(e) {
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
</script>

<div class="auth-container">
  <div class="auth-card">
    <h1>Create Account</h1>
    
    <form onsubmit={handleSignup} class="auth-form">
      {#if errorMessage}
        <div class="error-message">{errorMessage}</div>
      {/if}
      
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
      
      <div class="form-group">
        <label for="password">Password <span class="required">*</span></label>
        <input 
          type="password" 
          id="password" 
          bind:value={password} 
          required 
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
          required 
          placeholder="Confirm your password"
          disabled={isLoading}
        />
      </div>
      
      <button type="submit" class="auth-button" disabled={isLoading}>
        {isLoading ? 'Creating Account...' : 'Sign Up'}
      </button>
    </form>
    
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