<script>
  import { getContext } from 'svelte';
  import { LogOut, User, Settings } from 'lucide-svelte';
  import { Button } from "$lib/components/ui/button";
  import { toast } from "svelte-sonner";
  import { defaultLanguages } from '$lib/utils/languages.js';
  
  // Get user store from context
  const userStore = getContext('user');
  
  // Access userStore directly instead of destructuring to maintain reactivity
  let isLoggingOut = $state(false);
  
  function removeLanguage(code) {
    userStore.removeLanguage(code);
  }
  
  async function handleLogout() {
    isLoggingOut = true;
    try {
      const result = await userStore.logout();
      if (!result.success) {
        console.error('Logout failed:', result.error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      isLoggingOut = false;
    }
  }

  // Settings functions moved from SettingsButton
  function clearCache() {
    try {
      localStorage.clear();
      toast.success("Cache cleared successfully");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to clear cache");
      console.error("Error clearing cache:", error);
    }
  }

  function addDefaultLanguages() {
    Object.keys(defaultLanguages).forEach(code => userStore.addLanguage(code));
    toast.success("Added default languages");
  }

  function resetLanguages() {
    userStore.user.selectedLanguages.slice().forEach(code => userStore.removeLanguage(code));
    Object.keys(defaultLanguages).forEach(code => userStore.addLanguage(code));
    toast.success("Reset to default languages");
  }

  function clearAllLanguages() {
    userStore.user.selectedLanguages.slice().forEach(code => userStore.removeLanguage(code));
    toast.success("Cleared all languages");
  }
</script>

<section class="user-info">
  <div class="profile-header">
    <h2>User Profile</h2>
    
    {#if userStore.user.auth.isAuthenticated}
      <div class="profile-card">
        <div class="profile-icon">
          <User size={32} />
        </div>
        <div class="profile-details">
          <h3>{userStore.user.auth.username || 'User'}</h3>
          <p class="email">{userStore.user.auth.email}</p>
        </div>
        <button class="logout-button" onclick={handleLogout} disabled={isLoggingOut}>
          <LogOut size={18} />
          <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>
      </div>
    {:else}
      <p class="not-authenticated">
        You are not logged in. Please <a href="/auth">sign in or create an account</a>.
      </p>
    {/if}
  </div>
  
  <div class="user-details">
    <h3>Selected languages:</h3>
    {#if userStore.user.selectedLanguages?.length}
      <ul class="lang-list">
        {#each userStore.user.selectedLanguages as code}
          <li>
            <button class="remove-btn" onclick={() => removeLanguage(code)} title="Remove language">✕</button>
            <span class="lang-code">{code}</span>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="empty">No languages selected.</p>
    {/if}
  </div>

  <div class="settings-section">
    <h3><Settings size={20} style="display: inline; margin-right: 0.5rem;" />Settings & Tools</h3>
    
    <div class="settings-group">
      <h4>Language Management</h4>
      <div class="settings-buttons">
        <Button variant="outline" onclick={addDefaultLanguages}>
          Add Default Languages
        </Button>
        <Button variant="outline" onclick={resetLanguages}>
          Reset to Defaults
        </Button>
        <Button variant="destructive" onclick={clearAllLanguages}>
          Clear All Languages
        </Button>
      </div>
    </div>

    <div class="settings-group">
      <h4>System</h4>
      <div class="settings-buttons">
        <Button variant="destructive" onclick={clearCache}>
          Clear Cache
        </Button>
      </div>
    </div>

  </div>
</section>


<style>
.user-info {
  max-width: 480px;
  margin: 2rem auto;
  background: rgba(255,255,255,0.95);
  border-radius: 1.2em;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.07);
  padding: 2em 2em 1.5em 2em;
}

.profile-header {
  margin-bottom: 2rem;
}

.profile-header h2 {
  margin-top: 0;
  margin-bottom: 1.2rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.profile-card {
  display: flex;
  align-items: center;
  background: #f9fafb;
  padding: 1rem;
  border-radius: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.profile-icon {
  width: 48px;
  height: 48px;
  background: #ddd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  color: #3730a3;
  background: rgba(55, 48, 163, 0.1);
}

.profile-details {
  flex: 1;
}

.profile-details h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.profile-details .email {
  margin: 0.2rem 0 0 0;
  font-size: 0.9rem;
  color: #666;
}

.logout-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f3f4f6;
  color: #4b5563;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.logout-button:hover {
  background: #e0e7ff;
  color: #3730a3;
}

.logout-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.not-authenticated {
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  text-align: center;
  color: #555;
}

.not-authenticated a {
  color: #3730a3;
  font-weight: 500;
  text-decoration: none;
}

.not-authenticated a:hover {
  text-decoration: underline;
}

.user-details h3 {
  margin-bottom: 0.7em;
  font-weight: 600;
}
.lang-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.lang-list li {
  display: flex;
  align-items: center;
  gap: 0.7em;
  margin-bottom: 0.5em;
  background: #f3f4f6;
  border-radius: 0.7em;
  padding: 0.4em 0.9em;
  transition: background 0.15s;
}
.lang-list li:hover {
  background: #e0e7ff;
}
.remove-btn {
  background: #f87171;
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 2em;
  height: 2em;
  font-size: 1.1em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.remove-btn:hover {
  background: #dc2626;
}
.lang-code {
  font-family: monospace;
  font-size: 1.08em;
  color: #3730a3;
}
.empty {
  color: #888;
  font-style: italic;
  margin-top: 0.5em;
}
@media (max-width: 600px) {
  .user-info {
    padding: 1em 0.5em 1em 0.5em;
  }
}

.settings-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.settings-section h3 {
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.settings-group {
  margin-bottom: 1.5rem;
}

.settings-group h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #4b5563;
}

.settings-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}


@media (max-width: 600px) {
  .settings-buttons {
    flex-direction: column;
  }
}
</style>