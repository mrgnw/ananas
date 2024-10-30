<script lang="ts">
	import Corbado from '@corbado/web-js';
	import {onMount} from 'svelte';
	import { PUBLIC_CORBADO_PROJECT_ID } from '$env/static/public';

	export let data;
	let authElement: HTMLDivElement;
	let error = $state('');
	let loading = $state(true);

	onMount(async () => {
			try {
					console.log('Mounting Corbado auth');
					console.log('Project ID:', PUBLIC_CORBADO_PROJECT_ID);

					if (data.error) {
							console.error('Server-side error:', data.error);
							error = `Server error: ${data.error}`;
							return;
					}

					await Corbado.load({
							projectId: PUBLIC_CORBADO_PROJECT_ID,
							darkMode: "off",
					});

					console.log('Corbado loaded successfully');

					Corbado.mountAuthUI(
							authElement, {
									onLoggedIn: () => {
											console.log('Login successful');
											window.location.href = '/';
									},
									onError: (err) => {
											console.error('Corbado auth error:', err);
											error = err.message;
									}
							}
					);
			} catch (e) {
					console.error('Corbado mount error:', e);
					error = e instanceof Error ? e.message : 'Failed to initialize auth';
			} finally {
					loading = false;
			}
	})
</script>

<div class="container mx-auto p-4">
	{#if loading}
			<div class="text-center">Loading authentication...</div>
	{/if}

	{#if error}
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
						Error: {error}
						{#if data.errorDetail}
								<pre class="mt-2 text-sm">{JSON.stringify(data.errorDetail, null, 2)}</pre>
						{/if}
			</div>
	{/if}

	<div class="bg-white p-6 rounded-lg shadow-md">
			<div bind:this={authElement}></div>
	</div>
</div>