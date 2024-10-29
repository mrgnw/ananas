<script lang="ts">
	import Corbado from '@corbado/web-js';
	import {onMount} from 'svelte';

	let authElement: HTMLDivElement;

	onMount(async () => {
			await Corbado.load({
					projectId: "pro-4370035767074657014",
					darkMode: "off",
			});
			Corbado.mountAuthUI(
					authElement, {
							onLoggedIn: () => {
									// this is executed after login
									// you can do whatever you want here, e.g. navigate to another page
							},
					})
	})
</script>

<div bind:this={authElement}></div>