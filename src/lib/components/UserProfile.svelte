<script>
  import { auth, logoutUser } from '$lib/client/authStore.js';
  
  async function handleLogout() {
    await logoutUser();
  }
</script>

<div class="user-profile">
  <h2>Welcome, {auth.user?.username}!</h2>
  
  <div class="profile-info">
    <p>You are successfully authenticated with a passkey.</p>
  </div>
  
  <button class="logout-button" on:click={handleLogout}>
    Sign Out
  </button>
</div>

<style>
  .user-profile {
    max-width: 400px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .profile-info {
    margin-top: 15px;
    margin-bottom: 20px;
  }
  
  .logout-button {
    background-color: #f44336;
    color: white;
    padding: 10px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
</style>
