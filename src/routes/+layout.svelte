<script>
	import "../app.pcss";
    import { Languages } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { page } from "$app/stores";
	import { browser } from "$app/environment";
	import { onMount } from "svelte";
	import { setContext } from "svelte";
	import { afterNavigate } from '$app/navigation';
	import { invalidateAll } from '$app/navigation';
	import { initializeFromStorage } from '$lib/stores/translationStore';
	import { userStore } from '$lib/stores/user.svelte.js';
	import wikidataCountries from '$lib/data/wikidata-countries.json';
	import UserNav from '$lib/components/UserNav.svelte';
	
	// Create context for user state that components can access
	setContext('user', userStore);
	
	/** @type {{children?: import('svelte').Snippet}} */
    let allProps = $props();
	let { children } = allProps;
	
	// Get the country code and find country info directly from JSON
	const countryCode = $derived($page.data.ip_country || '');
	const hasCountryCode = $derived(!!countryCode && countryCode.trim() !== '');
	const countryInfo = $derived(hasCountryCode 
		? wikidataCountries.find(c => c.iso === countryCode.toLowerCase()) 
		: null);
	const countryFlag = $derived(countryInfo?.flag || '');
	
	onMount(() => {
		if (browser && $page.data.user) {
			userStore.setAuthState($page.data.user);
			
			// Initialize user preferences from server data if available
			if ($page.data.userPreferences) {
				userStore.initializeFromServerData($page.data.userPreferences);
			}
		}
	});

	// Initialize store from localStorage if in browser
	if (browser) {
		initializeFromStorage();
	}
	
	// Function to sync server data
	function syncServerData() {
		if ($page.data?.user) {
			const userData = $page.data.user;
			
			// Always sync auth state from server
			userStore.setAuthState(userData);
			
			// Always load server preferences if they exist
			if ($page.data.userPreferences) {
				userStore.loadServerPreferences($page.data.userPreferences);
			}
		}
	}

	// Load server data on mount
	onMount(() => {
		syncServerData();
	});

	// Also sync after navigation (includes login redirects and data fetches)
	afterNavigate(() => {
		syncServerData();
	});

	
	// Access auth state directly from userStore - Svelte 5 will track reactivity automatically
</script>

<svelte:head>
	<link rel="icon" href="/favicon.ico" sizes="32x32">
	<link rel="icon" href="/icon.svg" type="image/svg+xml">
	<link rel="apple-touch-icon" href="/icon-180.png">
	<link rel="manifest" href="/manifest.webmanifest">
</svelte:head>

<nav class="main-navbar">
  <ul class="navbar-list">
    <li><a href="/" class:active={$page.url.pathname === '/'}>Translate</a></li>
    <li><a href="/review" class:active={$page.url.pathname.startsWith('/review')}>Review</a></li>
    <li><a href="/languages" class:active={$page.url.pathname.startsWith('/languages')} title="Languages"><Languages size={20}/></a></li>
    <UserNav />
  </ul>
</nav>

{@render children?.()}


<style>
.main-navbar {
  background: rgba(255,255,255,0.85);
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px 0 rgba(0,0,0,0.03);
  padding: 0.5rem 0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 40;
  /* Prevent any movement on mobile */
  touch-action: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
.navbar-list {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  align-items: center;
  margin: 0;
  padding: 0;
  list-style: none;
}
.navbar-list li {
  margin: 0;
}
.navbar-list a {
  display: block;
  padding: 0.5em 1.1em;
  border-radius: 999px;
  color: #222;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
  position: relative;
}
.navbar-list a:hover {
  background: #f3f4f6;
  color: #3730a3;
  box-shadow: 0 2px 8px 0 rgba(55,48,163,0.07);
}
.navbar-list a.active {
  background: #3730a3;
  color: #fff;
  box-shadow: 0 2px 8px 0 rgba(55,48,163,0.13);
}

@media (max-width: 600px) {
  .navbar-list {
    gap: 0.5rem;
  }
  .navbar-list a {
    padding: 0.5em 0.7em;
    font-size: 0.98em;
  }
}

</style>