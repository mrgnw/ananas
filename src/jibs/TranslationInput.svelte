<script>
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Languages } from 'lucide-svelte';

	// Props using Svelte 5 runes
	let { text = $bindable(), is_loading, is_ready, handleSubmit, getRandomExample, variant = 'desktop' } = $props();

	// Keyboard event handler for accessibility
	function handleKeyDown(event) {
		if (event.key === 'Enter' && is_ready) {
			event.preventDefault();
			handleSubmit();
		}
	}

	// Determine if we're on mobile view
	let isMobile = $derived(variant === 'mobile');
</script>

<div class="flex items-center gap-2 w-full {isMobile ? 'max-w-full' : ''}">
	<div class="relative flex-1 overflow-hidden rounded-full border border-gray-100 border-gray-200 shadow-md">
		<div class="flex items-center">
			<Input
				type="text"
				placeholder="Enter text from any language..."
				bind:value={text}
				disabled={is_loading}
				class="w-full rounded-full border-0 bg-white py-{isMobile ? '3' : '2.5'} pl-4 pr-4 focus:ring-0 {is_loading ? 'opacity-75' : ''}"
				onkeydown={handleKeyDown}
			/>

			<Button
				onclick={handleSubmit}
				disabled={!is_ready}
				class="mr-1 h-auto rounded-full p-2"
				variant={is_ready ? 'default' : 'ghost'}
				type="submit"
			>
				{#if is_loading}
					<div class="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="lucide lucide-send"
					>
						<path d="m22 2-7 20-4-9-9-4Z" />
						<path d="M22 2 11 13" />
					</svg>
				{/if}
				<span class="sr-only">{is_loading ? 'Translating...' : 'Translate'}</span>
			</Button>
		</div>
	</div>

	<!-- Languages button with more prominence now that it's alone -->
	<a
		href="/languages"
		class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 transition-colors hover:bg-blue-200"
		title="Manage languages"
	>
		<Languages class="h-5 w-5 text-blue-700" />
		<span class="sr-only">Manage languages</span>
	</a>
</div>
