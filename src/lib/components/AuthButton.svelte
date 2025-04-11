<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  // Logout handler
  async function handleLogout() {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (response.ok) {
        await goto('/login'); // Redirect to login after logout
      } else {
        console.error('Logout failed:', await response.text());
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }
</script>

<div>
  {#if $page.data.user}
    <span>Welcome, {$page.data.user.username}</span>
    <button on:click={handleLogout}>Logout</button>
  {:else}
    <a href="/login">Login</a>
    <a href="/register">Register</a>
  {/if}
</div>

<style>
  div {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  span {
    font-weight: bold;
  }
  button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    cursor: pointer;
    border-radius: 4px;
  }
  button:hover {
    background-color: #0056b3;
  }
  a {
    text-decoration: none;
    color: #007bff;
  }
  a:hover {
    text-decoration: underline;
  }
</style>