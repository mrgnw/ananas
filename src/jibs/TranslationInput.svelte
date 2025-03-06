<script>
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Languages } from 'lucide-svelte';

	// Props using Svelte 5 runes
	let { 
		text = $bindable(), 
		is_loading, 
		is_ready, 
		handleSubmit, 
		getRandomExample, 
		variant = 'desktop',
		needsAttention = false 
	} = $props();

	// Keyboard event handler for accessibility
	function handleKeyDown(event) {
		if (event.key === 'Enter' && is_ready) {
			event.preventDefault();
			handleSubmit();
		}
	}

	// Determine if we're on mobile view
	let isMobile = $derived(variant === 'mobile');
	
	// Input state tracking
	let isInputFocused = false;

	// Animation state using $derived properly
	let animationState = $derived(
		is_loading ? 'translating' : 
		isInputFocused ? 'focused' : 
		needsAttention ? 'attention' : 
		'idle'
	);
	
	// For debugging
	$effect(() => {
		console.log('Animation state:', animationState, { is_loading, isInputFocused, needsAttention });
	});
</script>
<div class="flex items-center gap-2 w-full {isMobile ? 'max-w-full' : ''}">
	<div class="input-container flex-1 {animationState}">
		<div class="text-xs text-gray-400 absolute -top-5 left-0 z-10">State: {animationState}</div>
		<div class="w-full overflow-hidden rounded-full shadow-sm bg-white flex items-center">
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


<style>
	/* Base animation keyframes */
	@keyframes gradientBorder {
		0% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
		100% { background-position: 0% 50%; }
	}
	
	/* Base styles for all input containers */
	.input-container {
		position: relative;
		padding: 2px;
		border-radius: 9999px;
		background-origin: border-box;
		background-clip: padding-box, border-box;
		background-size: 400% 400%;
		transition: background 0.3s ease;
	}
	
	/* Default state: just a border */
	.input-container {
		background: white;
		border: 1px solid #e5e7eb;
	}

	/* Focused state: Calm blue/purple with slow animation */
	.input-container.focused {
		background: 
			linear-gradient(white, white) padding-box,
			linear-gradient(90deg, #3b82f6, #8b5cf6, #6366f1, #3b82f6) border-box;
		background-size: 400% 400%;
		animation: gradientBorder 4s ease infinite;
		border: 2px solid transparent;
	}

	/* Attention state: Bright vivid animation to grab attention */
	.input-container.attention {
		background: 
			linear-gradient(white, white) padding-box,
			linear-gradient(90deg, #3b82f6, #ec4899, #8b5cf6, #4f46e5, #3b82f6) border-box;
		background-size: 300% 300%;
		animation: gradientBorder 2s ease infinite;
		border: 2px solid transparent;
	}

	/* Translating state: Vibrant pink/purple animation */
	.input-container.translating {
		background: 
			linear-gradient(white, white) padding-box,
			linear-gradient(90deg, #ec4899, #a855f7, #d946ef, #ec4899) border-box;
		background-size: 400% 400%;
		animation: gradientBorder 2.5s ease infinite;
		border: 2px solid transparent;
	}

	/* Subtle hover effect for idle state */
	.input-container.idle:hover {
		background: 
			linear-gradient(white, white) padding-box,
			linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6) border-box;
		background-size: 400% 400%;
		border: 2px solid transparent;
	}
</style>