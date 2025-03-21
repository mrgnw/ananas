<script lang="ts">
  import { goto } from "$app/navigation";

  let name = $state("");
  let email = $state("");
  let password = $state("");
  let confirmPassword = $state("");
  let error = $state<string | null>(null);
  let success = $state(false);
  let loading = $state(false);

  async function handleSubmit() {
    loading = true;
    error = null;
    
    // Basic validation
    if (password !== confirmPassword) {
      error = "Passwords do not match";
      loading = false;
      return;
    }
    
    if (password.length < 8) {
      error = "Password must be at least 8 characters long";
      loading = false;
      return;
    }
    
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        error = data.message || "Registration failed";
      } else {
        success = true;
        // Redirect to login page after a delay
        setTimeout(() => goto("/user/login"), 2000);
      }
    } catch (e) {
      error = "An error occurred during registration";
      console.error(e);
    } finally {
      loading = false;
    }
  }
</script>

<div class="register-container">
  <h1>Create Account</h1>
  
  {#if error}
    <div class="error">{error}</div>
  {/if}
  
  {#if success}
    <div class="success">
      Registration successful! Redirecting to login page...
    </div>
  {:else}
    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label for="name">Full Name</label>
        <input 
          type="text" 
          id="name" 
          bind:value={name} 
          required 
          disabled={loading}
        />
      </div>
      
      <div class="form-group">
        <label for="email">Email</label>
        <input 
          type="email" 
          id="email" 
          bind:value={email} 
          required 
          disabled={loading}
        />
      </div>
      
      <div class="form-group">
        <label for="password">Password</label>
        <input 
          type="password" 
          id="password" 
          bind:value={password} 
          required 
          disabled={loading}
          minlength="8"
        />
      </div>
      
      <div class="form-group">
        <label for="confirm-password">Confirm Password</label>
        <input 
          type="password" 
          id="confirm-password" 
          bind:value={confirmPassword} 
          required 
          disabled={loading}
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  {/if}
  
  <p>Already have an account? <a href="/user/login">Login</a></p>
</div>

<style>
  .register-container {
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
    width: 100%;
    padding: 10px;
    background-color: #4f46e5;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:disabled {
    background-color: #a5a5a5;
    cursor: not-allowed;
  }
  
  .error {
    color: red;
    margin-bottom: 15px;
    padding: 10px;
    background-color: #ffebee;
    border-radius: 4px;
  }
  
  .success {
    color: green;
    margin-bottom: 15px;
    padding: 10px;
    background-color: #e8f5e9;
    border-radius: 4px;
  }
</style>
