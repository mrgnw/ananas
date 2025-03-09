<script>
  import { onMount } from 'svelte';
  
  let users = $state([]);
  let loading = $state(true);
  let error = $state(null);
  
  onMount(async () => {
    try {
      const response = await fetch('/api/debug/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      users = await response.json();
    } catch (err) {
      error = err.message || 'An error occurred';
      console.error(err);
    } finally {
      loading = false;
    }
  });
</script>

<div class="container p-4">
  <h1>Debug: Registered Users</h1>
  
  {#if loading}
    <p>Loading user data...</p>
  {:else if error}
    <p class="error">Error: {error}</p>
  {:else if users.length === 0}
    <p>No users registered yet.</p>
  {:else}
    <table class="user-table">
      <thead>
        <tr>
          <th>Username</th>
          <th>User ID</th>
          <th>Credentials</th>
        </tr>
      </thead>
      <tbody>
        {#each users as user}
          <tr>
            <td>{user.username}</td>
            <td><code>{user.id}</code></td>
            <td>
              {#if user.credentials?.length}
                <details>
                  <summary>{user.credentials.length} credential(s)</summary>
                  <ul>
                    {#each user.credentials as cred}
                      <li>ID: <code>{cred.credentialIDBase64 || '(binary)'}</code></li>
                    {/each}
                  </ul>
                </details>
              {:else}
                No credentials
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .container {
    max-width: 1000px;
    margin: 0 auto;
  }
  
  .error {
    color: #f44336;
    font-weight: bold;
  }
  
  .user-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }
  
  .user-table th, .user-table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
  
  .user-table th {
    background-color: #f2f2f2;
  }
  
  code {
    background-color: #f5f5f5;
    padding: 2px 4px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9em;
  }
</style>
