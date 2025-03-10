<script>
    import { onMount } from 'svelte';
    
    let credentials = $state([]);
    let loading = $state(true);
    let error = $state(null);
    let username = $state('');
    let resetResult = $state(null);
    
    onMount(async () => {
      await fetchCredentials();
    });
    
    async function fetchCredentials() {
      try {
        loading = true;
        error = null;
        resetResult = null;
        
        const url = username ? 
          `/api/auth/credential-inspection?username=${encodeURIComponent(username)}` : 
          '/api/auth/credential-inspection';
          
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch credentials');
        }
        
        credentials = await response.json();
      } catch (err) {
        error = err.message || 'An error occurred';
        console.error(err);
      } finally {
        loading = false;
      }
    }
    
    async function resetUserCredentials(username) {
      try {
        loading = true;
        error = null;
        resetResult = null;
        
        const response = await fetch('/api/auth/reset-credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to reset credentials');
        }
        
        resetResult = await response.json();
        await fetchCredentials(); // Refresh the data
      } catch (err) {
        error = err.message || 'An error occurred';
        console.error(err);
      } finally {
        loading = false;
      }
    }

    async function repairAllCredentials() {
      try {
        loading = true;
        error = null;
        resetResult = null;
        
        const response = await fetch('/api/auth/repair-credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to repair credentials');
        }
        
        resetResult = await response.json();
        await fetchCredentials(); // Refresh the data
      } catch (err) {
        error = err.message || 'An error occurred';
        console.error(err);
      } finally {
        loading = false;
      }
    }
  </script>
  
  <div class="container p-4">
    <h1 class="text-2xl font-bold mb-4">Credential Inspection Tool</h1>
    
    <div class="flex justify-between items-center mb-4">
      <div class="filter-form">
        <label>
          Filter by username:
          <input 
            bind:value={username} 
            type="text" 
            class="border p-2 ml-2" 
            placeholder="Enter username"
          />
        </label>
        <button 
          onclick={fetchCredentials} 
          class="bg-blue-500 text-white p-2 ml-2 rounded"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Filter'}
        </button>
      </div>
      
      <button 
        onclick={repairAllCredentials} 
        class="bg-green-500 text-white p-2 rounded"
        disabled={loading}
      >
        Repair All Credentials
      </button>
    </div>
    
    {#if resetResult}
      <div class="bg-green-100 p-4 mb-4 border-l-4 border-green-500">
        <p>{resetResult.message}</p>
      </div>
    {/if}
    
    {#if error}
      <div class="bg-red-100 p-4 mb-4 border-l-4 border-red-500">
        <p>Error: {error}</p>
      </div>
    {/if}
    
    {#if loading}
      <p>Loading credential data...</p>
    {:else if Array.isArray(credentials)}
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white">
          <thead class="bg-gray-100">
            <tr>
              <th class="p-3 text-left">Username</th>
              <th class="p-3 text-left">Credentials</th>
              <th class="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each credentials as user}
              <tr class="border-t">
                <td class="p-3">{user.username}</td>
                <td class="p-3">
                  {#if user.credentials?.length}
                    <details>
                      <summary>{user.credentialCount} credential(s)</summary>
                      <ul class="ml-4 mt-2">
                        {#each user.credentials as cred}
                          <li class="mb-2 p-2 border rounded {!cred.hasPublicKey || cred.publicKeyLength === 0 ? 'bg-red-50' : 'bg-green-50'}">
                            <div>ID: <code class="bg-gray-100 p-1 text-sm">{cred.id}</code></div>
                            <div>Public Key: 
                              {#if cred.hasPublicKey && cred.publicKeyLength > 0}
                                <span class="text-green-600">Valid</span> ({cred.publicKeyLength} bytes, starts with {cred.publicKeyFirstBytes})
                              {:else}
                                <span class="text-red-600">Invalid/Empty</span>
                              {/if}
                            </div>
                            <div>Counter: {cred.counter}</div>
                          </li>
                        {/each}
                      </ul>
                    </details>
                  {:else}
                    No credentials
                  {/if}
                </td>
                <td class="p-3">
                  <button 
                    onclick={() => resetUserCredentials(user.username)}
                    class="bg-red-500 text-white p-2 rounded text-sm"
                    disabled={loading}
                  >
                    Clean Invalid Credentials
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else if credentials.username}
      <div class="bg-white p-4 rounded shadow">
        <h2 class="text-xl font-bold">{credentials.username}</h2>
        <p>Total credentials: {credentials.credentialCount}</p>
        
        {#if credentials.credentials?.length}
          <div class="mt-4">
            <h3 class="text-lg font-semibold">Credentials:</h3>
            <ul class="mt-2 space-y-4">
              {#each credentials.credentials as cred}
                <li class="p-3 border rounded {!cred.hasPublicKey || cred.publicKeyLength === 0 ? 'bg-red-50' : 'bg-green-50'}">
                  <div>ID: <code class="bg-gray-100 p-1 text-sm">{cred.id}</code></div>
                  <div>Public Key: 
                    {#if cred.hasPublicKey && cred.publicKeyLength > 0}
                      <span class="text-green-600">Valid</span> ({cred.publicKeyLength} bytes, starts with {cred.publicKeyFirstBytes})
                    {:else}
                      <span class="text-red-600">Invalid/Empty</span>
                    {/if}
                  </div>
                  <div>Counter: {cred.counter}</div>
                  <div>Transports: {cred.transports.join(', ') || 'none'}</div>
                </li>
              {/each}
            </ul>
          </div>
          
          <button 
            onclick={() => resetUserCredentials(credentials.username)}
            class="mt-4 bg-red-500 text-white p-2 rounded"
            disabled={loading}
          >
            Clean Invalid Credentials
          </button>
        {:else}
          <p>No credentials found.</p>
        {/if}
      </div>
    {:else}
      <p>No credential data available.</p>
    {/if}
  </div>
