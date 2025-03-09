<script>
  import { onMount } from 'svelte';
  import { auth, initAuth } from '$lib/client/authStore.js';
  import UserProfile from '$lib/components/UserProfile.svelte';
  import { goto } from '$app/navigation';

  onMount(async () => {
    await initAuth();
    if (!auth.isAuthenticated) {
      goto('/account/login');
    }
  });
</script>

<div class="container">
  <h1>Your Profile</h1>

  {#if auth.loading}
    <div class="loading">
      <p>Loading...</p>
    </div>
  {:else if auth.isAuthenticated}
    <UserProfile />
  {:else}
    <div class="not-authenticated">
      <p>You need to sign in to view your profile.</p>
      <a href="/account/login" class="btn-link">Sign In</a>
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

  .not-authenticated {
    text-align: center;
    margin: 30px 0;
  }

  .btn-link {
    display: inline-block;
    background-color: #2196F3;
    color: white;
    padding: 10px 15px;
    border-radius: 4px;
    text-decoration: none;
    margin-top: 15px;
  }
</style>
