<script>
  import { onMount } from 'svelte';
  import { registerPasskey, authenticateWithPasskey } from '$lib/client/webauthn.js';

  let username = $state('test-user');
  let status = $state('Ready');
  let lastError = $state(null);
  let logs = $state([]);
  
  function addLog(message, type = 'info') {
    logs = [...logs, { message, type, timestamp: new Date().toISOString() }];
  }
  
  async function testRegister() {
    status = 'Registering...';
    lastError = null;
    
    try {
      addLog(`Starting registration for ${username}`);
      const result = await registerPasskey(username);
      
      if (result.verified) {
        status = 'Registration successful';
        addLog('Registration successful', 'success');
      } else {
        status = 'Registration failed';
        lastError = result.error || 'Unknown error';
        addLog(`Registration failed: ${lastError}`, 'error');
      }
    } catch (error) {
      status = 'Registration error';
      lastError = error.message;
      addLog(`Registration error: ${error.message}`, 'error');
      console.error('Registration error:', error);
    }
  }
  
  async function testLogin() {
    status = 'Authenticating...';
    lastError = null;
    
    try {
      addLog(`Starting authentication for ${username}`);
      const result = await authenticateWithPasskey(username);
      
      if (result.verified) {
        status = 'Authentication successful';
        addLog('Authentication successful', 'success');
      } else {
        status = 'Authentication failed';
        lastError = result.error || 'Unknown error';
        addLog(`Authentication failed: ${lastError}`, 'error');
      }
    } catch (error) {
      status = 'Authentication error';
      lastError = error.message;
      addLog(`Authentication error: ${error.message}`, 'error');
      console.error('Authentication error:', error);
    }
  }
  
  function clearLogs() {
    logs = [];
  }
</script>

<div class="container p-8">
  <h1 class="text-2xl font-bold mb-6">PassKey Debug Test Console</h1>
  
  <div class="mb-6">
    <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <p>Status: <strong>{status}</strong></p>
      {#if lastError}
        <p class="text-red-600 mt-2">Error: {lastError}</p>
      {/if}
    </div>
  </div>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
    <div class="p-4 border rounded-lg">
      <h2 class="text-xl font-semibold mb-4">Register Test</h2>
      <div class="mb-4">
        <label class="block mb-2">Username:</label>
        <input 
          type="text" 
          bind:value={username} 
          class="w-full p-2 border rounded"
        />
      </div>
      <button 
        onclick={testRegister} 
        class="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700"
      >
        Test Registration
      </button>
    </div>
    
    <div class="p-4 border rounded-lg">
      <h2 class="text-xl font-semibold mb-4">Authentication Test</h2>
      <div class="mb-4">
        <p class="mb-2">Will attempt to authenticate with the username above.</p>
      </div>
      <button 
        onclick={testLogin} 
        class="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
      >
        Test Authentication
      </button>
    </div>
  </div>
  
  <div class="mb-4 flex justify-between items-center">
    <h2 class="text-xl font-semibold">Operation Logs</h2>
    <button 
      onclick={clearLogs}
      class="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
    >
      Clear
    </button>
  </div>
  
  <div class="p-4 bg-black text-white font-mono text-sm rounded-lg h-80 overflow-y-auto">
    {#if logs.length === 0}
      <p class="text-gray-400">No logs yet. Run a test operation.</p>
    {:else}
      {#each logs as log}
        <div class={log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-blue-200'}>
          <span class="text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</span> {log.message}
        </div>
      {/each}
    {/if}
  </div>
</div>
