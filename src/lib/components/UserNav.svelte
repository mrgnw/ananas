<script>
  import { getContext } from 'svelte';
  import { page } from '$app/stores';
  
  // Get user store from context
  const userStore = getContext('user');
  
  // Access auth state reactively with Svelte 5 syntax
  const isAuthenticated = $derived(userStore.user.auth.isAuthenticated);
  const email = $derived(userStore.user.auth.email);
</script>

{#if isAuthenticated}
  <li>
    <a href="/user" class:active={$page.url.pathname.startsWith('/user')} class="user-profile-link" title={email || 'Profile'}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    </a>
  </li>
{:else}
  <li><a href="/auth" class:active={$page.url.pathname.startsWith('/auth')}>Sign In</a></li>
{/if}

<style>
  .user-profile-link {
    display: flex;
    align-items: center;
    color: #4b5563;
    transition: color 0.15s ease;
  }
  
  .user-profile-link:hover {
    color: #3730a3;
  }
  
  .user-profile-link.active {
    color: #3730a3;
  }
</style>