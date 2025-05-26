<script>
  import { page } from '$app/stores';
  import { userStore } from '$lib/stores/user.svelte.js';
  
  // Access auth state reactively with Svelte 5 syntax
  const isAuthenticated = $derived(userStore.user.auth.isAuthenticated);
  const email = $derived(userStore.user.auth.email);
  const syncing = $derived(userStore.user.syncing);
</script>

{#if isAuthenticated}
  <li>
    <a href="/user" class:active={$page.url.pathname.startsWith('/user')} class="user-profile-link" title={email || 'Profile'}>
      <div class="profile-container">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        {#if syncing}
          <div class="sync-indicator" title="Syncing preferences...">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="spinner">
              <path d="M21 12a9 9 0 11-6.219-8.56"></path>
            </svg>
          </div>
        {/if}
      </div>
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

  .profile-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  .sync-indicator {
    position: absolute;
    top: -2px;
    right: -6px;
    background: #22c55e;
    border-radius: 50%;
    padding: 1px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>