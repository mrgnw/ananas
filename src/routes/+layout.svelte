<script>
	import "../app.pcss";
	import SettingsButton from "$lib/components/SettingsButton.svelte";
	import DebugButton from "$lib/components/DebugButton.svelte";
	import { page } from "$app/stores";
	import { browser } from "$app/environment";
	import { onMount } from "svelte";
	
	/** @type {{children?: import('svelte').Snippet}} */
	let { children } = $props();
	
	// Safely get Cloudflare data
	const hasCloudflareData = $derived(
		browser && 
		page && 
		page.data && 
		(page.data.ip_country || page.data.countryInfo)
	);
	
	// Get current page path safely
	const currentPath = $derived(
		browser && page && page.url ? page.url.pathname : 'unknown'
	);
	
	// Log Cloudflare data to console on client
	onMount(() => {
		if (browser && page && page.data) {
			console.log('[CLIENT] Cloudflare data:', page.data);
		}
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
		title="Debug Info" 
		data={{
			cloudflare: hasCloudflareData ? {
				ip_country: page.data.ip_country || '',
				country_phone: page.data.country_phone || '',
				accept_language: page.data.accept_language || '',
				countryInfo: page.data.countryInfo || null
			} : 'No Cloudflare data available',
			appInfo: {
				page: currentPath,
				environment: import.meta.env.MODE,
				time: new Date().toISOString()
			}
		}} 
	/>
	<SettingsButton />
</div>
{/if}