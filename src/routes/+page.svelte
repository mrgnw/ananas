<script lang="ts">
	import type { PageData } from './$types';
	import NewLang from '$jibs/NewLang.svelte';
	import { translationInput } from '$lib/stores/translationStore';
	import { page } from "$app/stores";
	
	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<div class="container mx-auto p-4 max-w-5xl">
	<NewLang text={$translationInput} />
</div>

<div class="home-container">
  <h1>Welcome to Auth.js with SvelteKit 5</h1>
  
  {#if $page.data.session?.user}
    <div class="auth-status authenticated">
      <p>You are logged in as <strong>{$page.data.session.user.name}</strong></p>
      <p>Go to your <a href="/profile">profile</a> to see your user information.</p>
    </div>
  {:else}
    <div class="auth-status not-authenticated">
      <p>You are not logged in.</p>
      <div class="auth-buttons">
        <a href="/login" class="button login">Login</a>
        <a href="/register" class="button register">Register</a>
      </div>
    </div>
  {/if}
  
  <div class="features">
    <h2>Features Implemented</h2>
    <ul>
      <li>Secure user authentication with Auth.js</li>
      <li>Email and password registration</li>
      <li>Protected routes</li>
      <li>User profile page</li>
      <li>Responsive UI with Svelte 5</li>
    </ul>
  </div>
</div>

<style>
  .home-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }

  h1 {
    margin-bottom: 1.5rem;
  }

  .auth-status {
    padding: 20px;
    border-radius: 8px;
    margin: 20px 0;
  }

  .authenticated {
    background-color: #d1fae5;
    border: 1px solid #34d399;
  }

  .not-authenticated {
    background-color: #fee2e2;
    border: 1px solid #f87171;
  }

  .auth-buttons {
    display: flex;
    gap: 10px;
    margin-top: 15px;
  }

  .button {
    display: inline-block;
    padding: 10px 20px;
    border-radius: 4px;
    text-decoration: none;
    font-weight: bold;
  }

  .login {
    background-color: #4f46e5;
    color: white;
  }

  .register {
    background-color: #10b981;
    color: white;
  }

  .features {
    margin-top: 40px;
  }

  .features h2 {
    margin-bottom: 15px;
  }

  .features ul {
    line-height: 1.6;
  }
</style>