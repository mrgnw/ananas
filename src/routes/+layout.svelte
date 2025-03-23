<script>
	import "../app.pcss";
	import SettingsButton from "$lib/components/SettingsButton.svelte";
	import DebugButton from "$lib/components/DebugButton.svelte";
	import { page } from "$app/stores";
	import { browser } from "$app/environment";
	import { onMount } from "svelte";
	import { initializeFromStorage } from '$lib/stores/translationStore';
	
	/** @type {{children?: import('svelte').Snippet}} */
	let { children } = $props();
	
	// Create debug data object with direct access to the headers
	const debugData = $derived({
		// Direct access to headers from the data object
		allHeaders: $page.data.allHeaders,
		// Include other data for reference
		ip_country: $page.data.ip_country,
		clientInfo: {
			browser: browser ? 'True' : 'False',
			timestamp: new Date().toISOString(),
			url: browser ? window.location.href : null
		}
	});
	
	// Log Cloudflare data to console on client for debugging
	onMount(() => {
		if (browser) {
			console.log('[CLIENT] Full page data structure:', $page.data);
			
			// Specifically check for allHeaders
			if ($page.data.allHeaders) {
				console.log('[CLIENT] Headers found! Count:', Object.keys($page.data.allHeaders).length);
				console.log('[CLIENT] Some headers:', Object.keys($page.data.allHeaders).slice(0, 3));
			} else {
				console.log('[CLIENT] No headers found in page data');
				console.log('[CLIENT] Available keys:', Object.keys($page.data));
			}
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
	<DebugButton 
		title="Cloudflare Headers ({debugData.allHeaders ? Object.keys(debugData.allHeaders).length : 0})" 
		data={debugData} 
	/>
	<SettingsButton />
</div>
{/if}
