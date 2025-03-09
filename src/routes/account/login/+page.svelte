<script>
  import { onMount } from 'svelte';
  import { auth, initAuth } from '$lib/client/authStore.js';
  import LoginForm from '$lib/components/LoginForm.svelte';
  import { goto } from '$app/navigation';

  onMount(async () => {
    await initAuth();
    if (auth.isAuthenticated) {
      goto('/account');
    }
  });
</script>

<div class="container">
  <h1>Sign In</h1>

  {#if auth.loading}
    <div class="loading">
      <p>Loading...</p>
    </div>
  {:else}
    <LoginForm />
    
    <div class="register-link">
      <p>Don't have an account? <a href="/account/register">Register</a></p>
    </div>
  {/if}
  
  {#if auth.error}
    <div class="global-error">
      <p>{auth.error}</p>
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 500px;
    margin: 40px auto;
    padding: 20px;
  }

  h1 {
    text-align: center;
    margin-bottom: 30px;
  }

  .loading {
    text-align: center;
    margin: 30px 0;
  }

  .register-link {
    text-align: center;
    margin-top: 20px;
  }

  .global-error {
    background-color: #ffebee;
    color: #b71c1c;
    padding: 10px;
    margin-top: 20px;
    border-radius: 4px;
    text-align: center;
  }
</style>
