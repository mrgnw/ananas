<script lang="ts">
  import "../app.css";
  import SettingsButton from "$lib/components/SettingsButton.svelte";
  import DebugButton from "$lib/components/DebugButton.svelte";
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import { initializeFromStorage } from '$lib/stores/translationStore';
  import { signOut } from "@auth/sveltekit/client";

  /** @type {{children?: import('svelte').Snippet}} */
  let { children } = $props();

  // Log Cloudflare data to console on client
  onMount(() => {
    if (browser && page && page.data) {
      console.log('[CLIENT] Page data:', page.data);
    }
  });

  // Initialize store from localStorage if in browser
  if (browser) {
    initializeFromStorage();
  }

  // Get session data from page store
  $effect(() => {
    console.log("Auth session:", $page.data.session);
  });
</script>
<svelte:head>
    <link rel="icon" href="/favicon.ico" sizes="32x32">
        <link rel="icon" href="/icon.svg" type="image/svg+xml">
          <link rel="apple-touch-icon" href="/icon-180.png">
	<link rel="manifest" href="/manifest.webmanifest">
    </svelte:head>
    {@render children?.()}
    {#if browser}
    <div class="fixed bottom-4 right-4 flex gap-2 z-50 bg-white/50 p-2 rounded-lg">
      <DebugButton 
        title="Cloudflare Data" 
        data={page.data} 
      />
      <SettingsButton />
    </div>
    {/if}
  </main>

  <footer>
    <p>Auth.js with SvelteKit 5 Demo</p>
  </footer>
</div>

<svelte:head>
  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="icon" href="/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/icon-180.png">
  <link rel="manifest" href="/manifest.webmanifest">
</svelte:head>

<style>
  .app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  header {
    background-color: #4f46e5;
    color: white;
    padding: 1rem;
  }

  nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  .logo a {
    color: white;
    font-size: 1.5rem;
    font-weight: bold;
    text-decoration: none;
  }

  .nav-links {
    display: flex;
    gap: 1.5rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .nav-links a {
    color: white;
    text-decoration: none;
  }

  .nav-links a:hover {
    text-decoration: underline;
  }

  .nav-links button {
    background: none;
    border: 1px solid white;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    cursor: pointer;
  }

  .nav-links button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  main {
    flex: 1;
    padding: 1rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  footer {
    background-color: #f3f4f6;
    padding: 1rem;
    text-align: center;
  }
</style>
