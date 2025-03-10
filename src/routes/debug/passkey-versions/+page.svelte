<script>
  import { onMount } from 'svelte';
  import * as browser from '@simplewebauthn/browser';
  
  let serverVersions = $state({
    loading: true,
    data: null,
    error: null
  });
  
  onMount(async () => {
    try {
      const response = await fetch('/api/debug/passkey-versions');
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      serverVersions.data = await response.json();
    } catch (err) {
      serverVersions.error = err.message;
      console.error('Failed to fetch server versions:', err);
    } finally {
      serverVersions.loading = false;
    }
  });
</script>

<div class="container p-8">
  <h1 class="text-2xl font-bold mb-6">SimpleWebAuthn Versions</h1>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="p-4 border rounded-lg">
      <h2 class="text-lg font-semibold mb-3">Browser Package</h2>
      <div class="font-mono text-sm">
        <p>Version: {browser?.browserId ?? 'Unknown'}</p>
      </div>
    </div>
    
    <div class="p-4 border rounded-lg">
      <h2 class="text-lg font-semibold mb-3">Server Package</h2>
      {#if serverVersions.loading}
        <p>Loading server information...</p>
      {:else if serverVersions.error}
        <p class="text-red-500">Error: {serverVersions.error}</p>
      {:else}
        <div class="font-mono text-sm">
          <p>Server Version: {serverVersions.data?.serverVersion ?? 'Unknown'}</p>
          <p>Node Version: {serverVersions.data?.nodeVersion ?? 'Unknown'}</p>
          <p>Bun Version: {serverVersions.data?.bunVersion ?? 'Unknown'}</p>
        </div>
      {/if}
    </div>
  </div>
  
  <div class="mt-6 bg-gray-50 p-4 rounded-lg">
    <h2 class="text-lg font-semibold mb-3">Environment Information</h2>
    <div class="font-mono text-sm">
      <p>User Agent: {navigator.userAgent}</p>
      <p>Platform: {navigator.platform}</p>
    </div>
  </div>
</div>
