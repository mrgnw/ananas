<script>
	import "../app.pcss";
	import SettingsButton from "$lib/components/SettingsButton.svelte";
	import { Button } from "$lib/components/ui/button";
	import { page } from "$app/stores";
	import { browser } from "$app/environment";
	import { onMount } from "svelte";
	import { initializeFromStorage } from '$lib/stores/translationStore';
	import wikidataCountries from '$lib/data/wikidata-countries.json';
	
	/** @type {{children?: import('svelte').Snippet}} */
	let { children } = $props();
	
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

{@render children?.()}

{#if browser}
<div class="fixed bottom-4 right-4 flex gap-2 z-50 bg-white/50 p-2 rounded-lg">
	{#if hasCountryCode && countryFlag}
		<Button
			variant="outline"
			size="icon"
			class="rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
			title={countryInfo?.name || countryCode}
		>
			<span class="text-lg">{countryFlag}</span>
		</Button>
	{/if}
	<SettingsButton />
</div>
{/if}
