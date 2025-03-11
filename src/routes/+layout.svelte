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
