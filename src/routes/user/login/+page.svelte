<script lang="ts">
  import { signIn } from "@auth/sveltekit/client";
  import { goto } from "$app/navigation";

  let email = $state("");
  let password = $state("");
  let error = $state<string | null>(null);
  let loading = $state(false);

  async function handleSubmit() {
    loading = true;
    error = null;
    
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false
      });
      
      if (result?.error) {
        error = "Invalid email or password";
      } else {
        // Redirect to home page on successful login
        goto("/user/profile");
      }
    } catch (e) {
      error = "An error occurred during login";
      console.error(e);
    } finally {
      loading = false;
    }
  }
</script>

<div class="login-container">
  <h1>Login</h1>
  
  {#if error}
    <div class="error">{error}</div>
  {/if}
  
  <form on:submit|preventDefault={handleSubmit}>
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
      />
    </div>
    
    <button type="submit" disabled={loading}>
      {loading ? 'Logging in...' : 'Login'}
    </button>
  </form>
  
  <p>Don't have an account? <a href="/user/register">Register</a></p>
</div>

<style>
  .login-container {
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
</style>
