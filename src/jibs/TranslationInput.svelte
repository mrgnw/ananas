<script>
	import { Languages, Send } from 'lucide-svelte';

	// Props using Svelte 5 runes
	let {
		text = $bindable(),
		is_loading,
		handleSubmit,
		needsAttention = false,
		onInputFocus,
		onInputBlur,
		onInput,
		onKeyDown,
		onKeyPress,
		inputClass = '',
		containerClass = ''
	} = $props();

	// Make sure is_ready evaluates correctly for button activation
	let is_ready = $derived(text && text.trim().length > 0 && !is_loading);

	let isInputFocused = $state(false);

	let animationState = $derived(
		is_loading ? 'translating' : isInputFocused ? 'focused' : needsAttention ? 'attention' : 'idle'
	);
	let showSendButton = $derived(isInputFocused || is_loading || text.length > 0);
	let inputClasses = $derived(
		`
		flex-grow 
		border-none 
		bg-transparent 
		pl-4 
		pr-12 
		focus:outline-none 
		focus:ring-0 
		${is_loading ? 'cursor-not-allowed opacity-75' : ''} 
		${needsAttention ? 'text-lg' : 'text-base'}
		${inputClass ? ' ' + inputClass : ''}
	`
			.replace(/\s+/g, ' ')
			.trim()
	);
	let containerClasses = $derived(
		`
		input-container 
		flex-1 
		${animationState} 
		${needsAttention ? 'prominent' : ''} 
		${containerClass ? ' ' + containerClass : ''}
	`
			.replace(/\s+/g, ' ')
			.trim()
	);

	// Ensure we're properly disabling the input when loading
	let inputAttrs = $derived({
		type: "text",
		placeholder: is_loading ? 'Translating...' : 'Enter text from any language...',
		value: text,
		disabled: is_loading, // Make sure this is properly set
		class: inputClasses,
		onkeydown: handleKeyDown,
		oninput: handleInput,
		onkeypress: handleKeyPress,
		onfocus: handleFocus,
		onclick: handleFocus,
		onblur: () => {
			isInputFocused = false;
			if (typeof onInputBlur === 'function') onInputBlur();
		}
	});

	// Event handlers - simplified to make sure events are always passed up
	function handleKeyDown(event) {
			// First check for Enter key submission directly
		if (event.key === 'Enter' && text && text.trim().length > 0 && !is_loading) {
			event.preventDefault();
			// Call handleSubmit directly instead of relying on external handling
			handleSubmit();
			return;
		}
		
		// Forward the event to the parent component's handler
		if (typeof onKeyDown === 'function') {
			onKeyDown(event);
		}
	}

	function handleFocus() {
		isInputFocused = true;
		if (typeof onInputFocus === 'function') onInputFocus();
	}
	
	function handleInput(event) {
		// Forward the input event to the parent component immediately
		if (typeof onInput === 'function') {
			onInput(event);
		}
	}
	
	function handleKeyPress(event) {
		// Forward the keypress event to the parent component
		if (typeof onKeyPress === 'function') {
			onKeyPress(event);
		}
	}

	// Create a proper submit handler function that checks conditions directly
	function submitTranslation(event) {
		event.preventDefault();
		if (text && text.trim().length > 0 && !is_loading) {
			handleSubmit();
		}
	}
</script>

<div class="flex w-full items-center gap-4">
	<div class={containerClasses}>
		<div class="relative flex w-full items-center overflow-hidden rounded-full bg-white">
				<input {...inputAttrs} />

			<button
				onclick={submitTranslation}
				onmouseenter={() => typeof onInputFocus === 'function' && onInputFocus()}
				disabled={!is_ready}
				class="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full transition-opacity duration-200 {showSendButton
					? 'opacity-100'
					: 'opacity-0'} {is_ready
					? 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
					: 'text-gray-400'}"
				type="submit"
				aria-label={is_loading ? 'Translating...' : 'Translate'}
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
		transition: all 0.3s ease;
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

	/* Prominent state for when no translations and showing examples */
	.input-container.prominent {
		padding: 3px;
		transform: scale(1.03);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}

	/* Prominent state additional styling in CSS instead of component logic */
	.input-container.prominent {
		padding: 3px;
		transform: scale(1.03);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}

	/* Style for input field text */
	input {
		transition: all 0.3s ease;
	}
</style>
