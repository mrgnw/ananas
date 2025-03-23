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
	
	// Add derived data for debugging using Svelte 5 runes
	const pageData = $derived(page.data || {});
	const debugData = $derived({
		...page.data,
		// Fallback structure if headers are missing
		clientInfo: {
			browser: browser ? 'True' : 'False',
			timestamp: new Date().toISOString(),
			url: browser ? window.location.href : null
		}
	});
	
	// Log Cloudflare data to console on client
	onMount(() => {
		if (browser && page && page.data) {
			console.log('[CLIENT] Page data available:', Object.keys(page.data));
			console.log('[CLIENT] Headers available:', page.data.headers ? 'Yes' : 'No');
			
			// Log entire page data for debugging
			console.log('[CLIENT] Full page data:', page.data);
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
		title="Cloudflare Data" 
		data={debugData} 
	/>
	<SettingsButton />
</div>
{/if}
