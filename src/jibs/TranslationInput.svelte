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
	
	// Control for the animation
	let isInputFocused = false;
</script>

<style>
	@keyframes gradientBorder {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}
	
	.input-container {
		position: relative;
	}
	
	.input-container::before {
		content: '';
		position: absolute;
		top: -2px;
		left: -2px;
		right: -2px;
		bottom: -2px;
		z-index: -1;
		border-radius: 9999px;
		background: linear-gradient(90deg, #ff0000, #ffa500, #ffff00, #008000, #0000ff, #4b0082, #ee82ee);
		background-size: 400% 400%;
		opacity: 0;
		transition: opacity 0.3s ease;
	}
	
	.input-container.animate::before {
		animation: gradientBorder 3s ease infinite;
		opacity: 0.7;
	}
	
	/* Only show the animation when focused or hovered */
	.input-container:hover::before {
		opacity: 0.4;
	}
	
	.input-container:focus-within::before {
		opacity: 0.7;
		animation: gradientBorder 3s ease infinite;
	}
</style>

<div class="flex items-center gap-2 w-full {isMobile ? 'max-w-full' : ''}">
	<div class="input-container flex-1 {isInputFocused ? 'animate' : ''}">
		<div class="relative w-full overflow-hidden rounded-full border border-gray-200 shadow-md bg-white flex items-center">
		<input
			type="text"
			placeholder="Enter text from any language..."
			bind:value={text}
			disabled={is_loading}
			class="flex-grow py-{isMobile ? '3' : '2.5'} pl-4 pr-1 bg-transparent border-none focus:outline-none focus:ring-0 {is_loading ? 'opacity-75' : ''}"
			onkeydown={handleKeyDown}
			onfocus={() => isInputFocused = true}
			onblur={() => isInputFocused = false}
		/>

		<button
			onclick={handleSubmit}
			disabled={!is_ready}
			class="mr-1 h-auto p-2 text-white {is_ready ? 'text-blue-600 hover:text-blue-700' : 'text-gray-400'} transition-colors"
			type="submit"
		>
			{#if is_loading}
				<div class="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-600"></div>
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
		</button>
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
