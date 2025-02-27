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
		(page.data.country || page.data.countryData || page.data.countryInfo)
	);
	
	// Get current page path safely
	const currentPath = $derived(
		browser && page && page.url ? page.url.pathname : 'unknown'
	);
	
	// Get Cloudflare data for debugging
	const cloudflareData = $derived(
		hasCloudflareData ? {
			country: page.data.country,
			countryData: page.data.countryData,
			countryInfo: page.data.countryInfo,
			rawData: page.data
		} : null
	);
	
	// Default debug data if Cloudflare data is not available
	const defaultDebugData = $derived({
		appInfo: {
			page: currentPath,
			environment: import.meta.env.MODE,
			time: new Date().toISOString()
		}
	});
	
	// Log Cloudflare data to console on client
	onMount(() => {
		if (browser && cloudflareData) {
			console.log('[CLIENT] Cloudflare data:', cloudflareData);
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
			cloudflare: cloudflareData ? {
				countryDetection: {
					source: cloudflareData.countryData?.source || 'Unknown',
					countryCode: cloudflareData.country || 'Not detected',
					countryName: cloudflareData.countryInfo?.name || 'Not found',
					countryFlag: cloudflareData.countryInfo?.flag || 'Not found'
				},
				countryInfo: cloudflareData.countryInfo ? {
					nativeName: cloudflareData.countryInfo.native_name,
					isoCode: cloudflareData.countryInfo.iso,
					iso3Code: cloudflareData.countryInfo.iso3,
					languages: cloudflareData.countryInfo.languages?.map(lang => `${lang.name} (${lang.iso}) ${lang.speakers_m ? '- ' + lang.speakers_m + 'M speakers' : ''}`) || []
				} : null,
				rawData: cloudflareData
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