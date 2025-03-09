<script>
  import { onMount } from 'svelte';
  import { auth, initAuth } from '$lib/client/authStore.js';
  import RegistrationForm from '$lib/components/RegistrationForm.svelte';
  import LoginForm from '$lib/components/LoginForm.svelte';
  import UserProfile from '$lib/components/UserProfile.svelte';
  
  let activeTab = $state('login');
  
  onMount(async () => {
    await initAuth();
  });
  
  function switchTab(tab) {
    activeTab = tab;
  }
</script>

<div class="container">
  <h1>Passkey Authentication</h1>
  
  {#if auth.loading}
    <div class="loading">
      <p>Loading...</p>
    </div>
  {:else if auth.isAuthenticated}
    <UserProfile />
  {:else}
    <div class="auth-container">
      <div class="tab-header">
        <button 
          class={activeTab === 'login' ? 'active' : ''} 
          onclick={() => switchTab('login')}
        >
          Sign In
        </button>
        <button 
          class={activeTab === 'register' ? 'active' : ''} 
          onclick={() => switchTab('register')}
        >
          Register
        </button>
      </div>
      
      <div class="tab-content">
        {#if activeTab === 'login'}
          <LoginForm />
        {:else}
          <RegistrationForm />
        {/if}
      </div>
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
    max-width: 800px;
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

  .auth-container {
    max-width: 500px;
    margin: 0 auto;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
  }

  .tab-header {
    display: flex;
    border-bottom: 1px solid #ddd;
  }

  .tab-header button {
    flex: 1;
    background: #f5f5f5;
    border: none;
    padding: 15px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
  }

  .tab-header button:hover {
    background: #e9e9e9;
  }

  .tab-header button.active {
    background: white;
    font-weight: bold;
    border-bottom: 2px solid #2196F3;
  }

  .tab-content {
    background: white;
    padding: 20px;
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
