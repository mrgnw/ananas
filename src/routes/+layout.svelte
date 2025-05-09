<script>
	import "../app.pcss";
	import SettingsButton from "$lib/components/SettingsButton.svelte";
    import { Languages } from 'lucide-svelte';
	import { Button } from "$lib/components/ui/button";
	import { page } from "$app/stores";
	import { browser } from "$app/environment";
	import { onMount } from "svelte";
	import { initializeFromStorage } from '$lib/stores/translationStore';
	import wikidataCountries from '$lib/data/wikidata-countries.json';
	
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
	
	// Log data to console for debugging
	onMount(() => {
		if (browser) {
			console.log('[CLIENT] Detected country:', countryCode || 'None detected');
			console.log('[CLIENT] Country info from Wikidata:', countryInfo);
		}
	});

	// Initialize store from localStorage if in browser
	if (browser) {
		initializeFromStorage();
	}
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
    <li><a href="/languages" class:active={$page.url.pathname.startsWith('/languages')} title="Languages"><Languages size={20}/></a></li>
    <!-- <li><a href="/user" class:active={$page.url.pathname.startsWith('/user')}>User</a></li> -->
    <li><a href="/history" class:active={$page.url.pathname.startsWith('/history')}>History</a></li>
  </ul>
</nav>

{@render children?.()}

{#if browser}
<div class="fixed bottom-4 right-4 flex gap-2 z-50 bg-white/50 p-2 rounded-lg">
	<!-- Future feature: country detection / language suggestion -->
    <!-- {#if hasCountryCode && countryFlag}
		<Button
			variant="outline"
			size="icon"
			class="rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
			title={countryInfo?.name || countryCode}
		>
			<span class="text-lg">{countryFlag}</span>
		</Button>
	{/if} -->
	<SettingsButton {...allProps}  />
</div>
{/if}

<style>
.main-navbar {
  background: rgba(255,255,255,0.85);
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px 0 rgba(0,0,0,0.03);
  padding: 0.5rem 0;
  position: sticky;
  top: 0;
  z-index: 40;
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
