<script lang="ts">
  import { page } from "$app/stores";
  import { signOut } from "@auth/sveltekit/client";
  import { goto } from "$app/navigation";

  // Get session from page store
  const session = $page.data.session;

  function handleLogout() {
    signOut({ redirect: false }).then(() => {
      goto('/user/login');
    });
  }
</script>

<div class="profile-container">
  <h1>Profile</h1>
  
  {#if session?.user}
    <div class="profile-info">
      <p><strong>ID:</strong> {session.user.id}</p>
      <p><strong>Name:</strong> {session.user.name}</p>
      <p><strong>Email:</strong> {session.user.email}</p>
    </div>

    <button class="logout-button" on:click={handleLogout}>
      Logout
    </button>
  {:else}
    <p>You are not logged in. Please <a href="/user/login">log in</a> to view your profile.</p>
  {/if}
</div>

<style>
  .profile-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }

  .profile-info {
    background-color: #f5f7fa;
    padding: 20px;
    border-radius: 8px;
    margin: 20px 0;
  }

  .logout-button {
    background-color: #ef4444;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 10px 20px;
    cursor: pointer;
  }

  .logout-button:hover {
    background-color: #dc2626;
  }
</style>
