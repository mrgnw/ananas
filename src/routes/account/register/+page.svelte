<script>
  import { onMount } from 'svelte';
  import { auth, initAuth } from '$lib/client/authStore.js';
  import RegistrationForm from '$lib/components/RegistrationForm.svelte';
  import { goto } from '$app/navigation';

  onMount(async () => {
    await initAuth();
    if (auth.isAuthenticated) {
      goto('/account');
    }
  });
</script>

<div class="container">
  <h1>Register</h1>

  {#if auth.loading}
    <div class="loading">
      <p>Loading...</p>
    </div>
  {:else}
    <RegistrationForm />
    
    <div class="login-link">
      <p>Already have an account? <a href="/account/login">Sign in</a></p>
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

  .login-link {
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
