<script>
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Languages, Send } from 'lucide-svelte';

	// Props using Svelte 5 runes
	let {
		text = $bindable(),
		is_loading,
		is_ready,
		handleSubmit,
		getRandomExample,
		variant = 'desktop',
		needsAttention = false,
		isTyping = false,
		onInputFocus
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
	let isInputFocused = $state(false);

	// Animation state using $derived properly
	let animationState = $derived(
		is_loading ? 'translating' : isInputFocused ? 'focused' : needsAttention ? 'attention' : 'idle'
	);

	$effect(() => console.log('Input state:', animationState));

	// Focus event handlers
	function handleFocus() {
		console.log('Input focused!');
		isInputFocused = true;
		// Emit the focus event to parent component
		if (typeof onInputFocus === 'function') {
			console.log('Calling onInputFocus handler');
			onInputFocus();
		} else {
			console.warn('onInputFocus is not a function:', onInputFocus);
		}
	}

	function handleBlur() {
		console.log('Input blurred!');
		isInputFocused = false;
	}

	// Show send button when input is focused, loading, or text is being typed
	let showSendButton = $derived(isInputFocused || is_loading || text.length > 0);
</script>

<div class="flex w-full items-center gap-2 {isMobile ? 'max-w-full' : ''}">
	<div class="input-container flex-1 {animationState}">
		<div class="relative flex w-full items-center overflow-hidden rounded-full bg-white">
			<input
				type="text"
				placeholder={is_loading ? 'Translating...' : 'Enter text from any language...'}
				bind:value={text}
				disabled={is_loading}
				class="flex-grow py-{isMobile
					? '3'
					: '2.5'} border-none bg-transparent pl-4 pr-12 focus:outline-none focus:ring-0 {is_loading
					? 'cursor-not-allowed opacity-75'
					: ''}"
				onkeydown={handleKeyDown}
				onfocus={handleFocus}
				onblur={handleBlur}
			/>

			<!-- Always render the button but control visibility with CSS -->
			<button
				onclick={handleSubmit}
				disabled={!is_ready}
				class="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full {showSendButton
					? 'opacity-100'
					: 'opacity-0'} transition-opacity duration-200 {is_ready
					? 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
					: 'text-gray-400'}"
				type="submit"
			>
				{#if is_loading}
					<div class="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-600"></div>
				{:else}
					<Send size={18} />
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

	/* Additional keyframes for translating state */
	@keyframes shimmerBorder {
		0% {
			background-position: 0% 50%;
			border-width: 2px;
		}
		50% {
			background-position: 100% 50%;
			border-width: 2.5px;
		}
		100% {
			background-position: 0% 50%;
			border-width: 2px;
		}
	}

	/* Translating state: Magical cosmic animation - smoother version */
	.input-container.translating {
		background:
			linear-gradient(white, white) padding-box,
			linear-gradient(90deg, #4f46e5, #7e22ce, #0ea5e9, #6366f1, #4f46e5) border-box;
		background-size: 300% 300%;
		animation: shimmerBorder 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
		border: 2px solid transparent;
		box-shadow: 0 0 8px rgba(99, 102, 241, 0.15);
	}

	/* Very subtle hover effect for idle state */
	.input-container.idle:hover {
		background: white;
		border: 1px solid #d1d5db;
	}
</style>
