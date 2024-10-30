<script lang="ts">
	import Corbado from '@corbado/web-js';
	import {onMount} from 'svelte';

	export let data;
	let authElement: HTMLDivElement;
	let error = '';

	onMount(async () => {
			try {
					console.log('Mounting Corbado auth - Auth state:', data.authenticated);

					await Corbado.load({
							projectId: "pro-4370035767074657014",
							darkMode: "off",
					});

					Corbado.mountAuthUI(
							authElement, {
									onLoggedIn: () => {
											console.log('Login successful');
											window.location.href = '/';
									},
							}
					);
			} catch (e) {
					console.error('Corbado mount error:', e);
					error = e.message;
			}
	})
</script>

<div class="container mx-auto p-4">
	{#if error}
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
					Error: {error}
			</div>
	{/if}

	<div class="bg-white p-6 rounded-lg shadow-md">
			<div bind:this={authElement}></div>
	</div>
</div>