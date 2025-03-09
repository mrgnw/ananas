<script>
  import { auth, initAuth } from '$lib/client/authStore.js';
  import { onMount } from 'svelte';

  onMount(async () => {
    await initAuth();
  });
</script>

<div class="account-layout">
  <nav class="account-nav">
    <div class="nav-brand">
      <a href="/">Passkey Demo</a>
    </div>
    <div class="nav-links">
      {#if auth.isAuthenticated}
        <a href="/account/profile">Profile</a>
      {:else}
        <a href="/account/login">Sign In</a>
        <a href="/account/register">Register</a>
      {/if}
    </div>
  </nav>

  <main>
    <slot />
  </main>

  <footer>
    <p>Secure Authentication with WebAuthn and Passkeys</p>
  </footer>
</div>

<style>
  .account-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }

  .account-nav {
    background-color: #2196F3;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    height: 60px;
  }

  .nav-brand a {
    color: white;
    font-size: 1.2rem;
    font-weight: bold;
    text-decoration: none;
  }

  .nav-links {
    display: flex;
    gap: 20px;
  }

  .nav-links a {
    color: white;
    text-decoration: none;
  }

  .nav-links a:hover {
    text-decoration: underline;
  }

  main {
    flex: 1;
    background-color: #f5f5f5;
  }

  footer {
    background-color: #333;
    color: white;
    text-align: center;
    padding: 15px 0;
  }
</style>
