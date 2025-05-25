<script>
  import { getContext } from 'svelte';
  import { page } from '$app/stores';
  
  // Get user store from context
  const userStore = getContext('user');
  
  // Access auth state reactively with Svelte 5 syntax
  const isAuthenticated = $derived(userStore.user.auth.isAuthenticated);
  const username = $derived(userStore.user.auth.username);
</script>

{#if isAuthenticated}
  <li>
    <a href="/user" class:active={$page.url.pathname.startsWith('/user')} class="user-profile-link">
      {#if username}
        {username}
      {:else}
        Profile
      {/if}
    </a>
  </li>
{:else}
  <li><a href="/auth" class:active={$page.url.pathname.startsWith('/auth')}>Sign In</a></li>
{/if}

<style>
  .user-profile-link {
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .user-profile-link::before {
    content: '';
    display: inline-block;
    width: 0.6rem;
    height: 0.6rem;
    background-color: #10b981;
    border-radius: 50%;
  }
</style>