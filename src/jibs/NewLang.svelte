<script>
	import { examplePhrases, exampleTranslations } from '$lib/example';

	import { translateLanguages } from '$lib/stores/translateLanguages.svelte.js';
	import MultiLangCard from './MultiLangCard.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Toaster } from 'svelte-sonner';
	import { toast } from 'svelte-sonner';
	import { browser } from '$app/environment';
	import TranslationInput from './TranslationInput.svelte';
	import PlayPauseButton from './PlayPauseButton.svelte';
	import { getColorByIndex } from '$lib/colors';

	const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

	// Helper function to safely clear timers (both intervals and timeouts)
	function clearTimer(timer) {
		if (timer) {
			clearTimeout(timer); // Works for both setTimeout and setInterval
			return null;
		}
		return timer;
	}

	let isTyping = $state(false);
	// Interval ID for cleanup
	let typingInterval = $state(null);

	/**
	 * Simple typewriter function that updates a variable one letter at a time
	 * @param {string} newText - The new text to type
	 */
	function typeLetters(newText) {
		if (isTyping) return;

		isTyping = true;
		typingInterval = clearTimer(typingInterval);
		text = '';
		let i = 0;

		(function typeNext() {
			typingInterval = setTimeout(
				() => {
					if (i < newText.length) {
						text = newText.substring(0, ++i);
						typeNext();
					} else {
						typingInterval = clearTimer(typingInterval);
						isTyping = false;
					}
				},
				30 + Math.floor(Math.random() * 40)
			);
		})();
	}

	// Interval for cycling examples
	let cycleInterval = $state(null);
	// Track if examples are paused or playing
	let examplesPaused = $state(false);

	// Function to cycle to the next example
	function cycleExamples() {
		// Only show examples if not paused and no history
		if (!examplesPaused && history.length === 0) {
			typeLetters(examplePhrases[Math.floor(Math.random() * examplePhrases.length)]);
		}
	}

	// Handle input focus event from TranslationInput
	function handleInputFocus() {
		// Pause examples during input focus
		examplesPaused = true;
		
		// Clear the cycling interval to prevent new examples
		cycleInterval = clearTimer(cycleInterval);
		
		// If currently typing, complete the current example quickly
		if (isTyping && typingInterval) {
			console.log('Completing typing animation quickly');
			typingInterval = clearTimer(typingInterval);
			
			// Find matching example or use current text
			const targetText = (text && examplePhrases.find((ex) => ex.startsWith(text))) || '';
			if (!targetText) return (isTyping = false);

			// Type remaining text at 5ms per character
			let i = text.length;

			// finish typing quickly (5ms per character)
			typingInterval = setInterval(() => {
				if (i < targetText.length) {
					// Add the next letter at ultra fast speed
					text = targetText.substring(0, i + 1);
					i++;
				} else {
					// Once we've completed the entire example, stop typing
					typingInterval = clearTimer(typingInterval);
					isTyping = false;
				}
			}, 5);
		}
	}
	
	// Handle input blur event
	function handleInputBlur() {
		// If there's no history (no translations yet), resume examples
		if (history.length === 0) {
			examplesPaused = false;
			// Start one example immediately
			setTimeout(() => {
				if (!isTyping && history.length === 0) {
					cycleExamples();
					// Start cycling if not already cycling
					if (!cycleInterval) {
						cycleInterval = setInterval(cycleExamples, 5000);
					}
				}
			}, 500); // Small delay to prevent immediate restart if user is interacting
		}
	}
	
	// Toggle play/pause for examples
	function toggleExamples() {
		examplesPaused = !examplesPaused;
		
		if (examplesPaused) {
			// Pause examples
			cycleInterval = clearTimer(cycleInterval);
		} else {
			// Resume examples
			if (!cycleInterval && history.length === 0) {
				cycleExamples(); // Show one immediately
				cycleInterval = setInterval(cycleExamples, 5000);
			}
		}
	}

	// Initialize examples when browser is available and history is loaded
	$effect(() => {
		// Only start examples if browser is available AND history is loaded AND history is empty
		if (browser && history !== undefined && history.length === 0) {
			console.log('Page fully loaded with empty history, initializing examples');

			// Type the first example after a short delay to ensure page is fully rendered
			const timeout = setTimeout(() => {
				console.log('Starting first example');
				cycleExamples();

				// Set up cycling interval
				if (!cycleInterval) {
					console.log('Setting up cycling interval');
					cycleInterval = setInterval(cycleExamples, 5000);
				}
			}, 1000);

			// Cleanup function
			return () => {
				console.log('Cleaning up intervals');
				clearTimeout(timeout);
				cycleInterval = clearTimer(cycleInterval);
				typingInterval = clearTimer(typingInterval);
			};
		}
	});

	function loadHistory() {
		if (browser) {
			const stored = localStorage.getItem('translationHistory');
			return stored ? JSON.parse(stored) : [];
		}
		return [];
	}

	let history = $state(loadHistory());

	function deleteTranslation(index) {
		history = history.filter((_, i) => i !== index);
		if (browser) {
			localStorage.setItem('translationHistory', JSON.stringify(history));
		}
	}

	let text = $state('');
	let truncate_lines = $state(true);
	let colors_enabled = $state(browser ? localStorage.getItem('colorsEnabled') !== 'false' : true);

	// Use the shared language store
	let user_langs = $derived(translateLanguages.languages);
	let tgt_langs = $derived(Object.keys(user_langs));
	let show_langs = $derived(
		Object.entries(user_langs)
			.filter(([_, lang]) => lang.display)
			.map(([key, _]) => key)
	);

	let is_loading = $state(false);

	async function handleSubmit() {
		// Stop typing animation if it's running
		if (isTyping) {
			typingInterval = clearTimer(typingInterval);
			isTyping = false;
		}

		// Also clear cycling interval to prevent new examples from starting
		cycleInterval = clearTimer(cycleInterval);

		// Set loading state
		is_loading = true;
		const apiUrl = 'https://ananas-api.xces.workers.dev';

		try {
			console.log('Target languages:', tgt_langs);
			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					api_key: OPENAI_API_KEY
				},
				body: JSON.stringify({
					text,
					tgt_langs: tgt_langs // Use all selected languages, not just displayed ones
				})
			});

			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const data = await response.json();

			if (history.some((item) => item.text === text)) {
				toast.info('This text has already been translated!');
				text = '';
				return;
			}

			history = [
				{
					text,
					translations: data,
					timestamp: new Date().toISOString()
				},
				...history
			];

			if (browser) {
				localStorage.setItem('translationHistory', JSON.stringify(history));
			}
			toast.success('Translation successful!');
			text = '';
		} catch (error) {
			console.error('Error fetching translation:', error);
			toast.error('Translation failed. Please try again.');
		} finally {
			is_loading = false;
		}
	}

	// Keyboard event handlers for accessibility
	function handleKeyDown(event, callback) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			callback();
		}
	}
</script>

<div
	class="env-ios:pb-[120px] mx-auto max-w-screen-lg space-y-4 px-2 pb-[100px] sm:pb-[80px] md:pb-0"
>
	<!-- Site title and info at the top of the page -->
	<h1 class="mx-auto mb-2 max-w-2xl text-center text-3xl font-bold text-gray-900">
		Translate to Multiple Languages at Once
	</h1>

	<!-- Input on desktop -->
	<div class="relative mx-auto hidden max-w-2xl md:block">
		<div class="flex items-center gap-2">
			<TranslationInput
				bind:text
				{is_loading}
				{handleSubmit}
				needsAttention={history.length === 0}
				onInputFocus={handleInputFocus}
				onInputBlur={handleInputBlur}
				inputClass="px-1 font-medium py-2.5"
				containerClass="desktop-input w-full"
			/>
			
			{#if history.length === 0}
				<PlayPauseButton 
					isPaused={examplesPaused} 
					onClick={toggleExamples} 
					size="md"
				/>
			{/if}
		</div>
	</div>

	<div class="space-y-4">
		<!-- Translation review section -->
		<div class="space-y-4">
			<div class="sticky top-0 z-10 bg-white pb-2 pt-4">
				<div class="flex flex-wrap items-center justify-between gap-2 pb-2">
					<div class="flex items-center gap-3">
						<h2 class="text-xl font-semibold text-gray-800">Review</h2>
						
						

						{#if tgt_langs.length > 0}
							<div class="flex items-center">
								<!-- language visibility badges -->
								<div
									class="scrollbar-thin flex max-w-[calc(100vw-120px)] flex-row flex-nowrap gap-1.5 overflow-x-auto py-1.5 sm:max-w-[400px] md:max-w-[500px]"
								>
									{#each Object.entries(user_langs) as [key, meta], index}
										<Badge
											variant={meta.display ? 'default' : 'outline'}
											class="h-6 shrink-0 cursor-pointer whitespace-nowrap px-2 py-0.5 text-xs font-medium transition-transform hover:scale-105 {meta.display
												? getColorByIndex(index)
												: 'hover:bg-gray-100'}"
											onclick={() => translateLanguages.toggleLanguageDisplay(key)}
											onkeydown={(e) =>
												handleKeyDown(e, () => translateLanguages.toggleLanguageDisplay(key))}
											tabindex="0"
											role="button"
											aria-pressed={meta.display}
										>
											{key}
										</Badge>
									{/each}
								</div>
							</div>
						{/if}
					</div>

					<div class="flex items-center gap-2">
						<!-- Language visibility dropdown -->
					</div>
				</div>
				<div class="h-px w-full bg-gray-200"></div>
			</div>

			<!-- Translation cards with improved responsive grid -->
			<div class="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each history as translation, i}
					<!-- MultiLangCard.svelte -->
					<MultiLangCard
						{translation}
						{show_langs}
						{truncate_lines}
						onDelete={() => deleteTranslation(i)}
					/>
				{:else}
					<div
						class="col-span-1 sm:col-span-2 lg:col-span-3 p-8 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-xl"
					>
						<div class="flex flex-col items-center gap-6 max-w-xl mx-auto">
							<h2 class="text-center text-xl md:text-2xl font-semibold text-gray-800 mb-6">
								Study all of your languages together
							</h2>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
								{#each exampleTranslations as example, exampleIndex}
									<MultiLangCard translation={example} {show_langs} {truncate_lines} />
								{/each}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<div
	class="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-4 shadow-lg md:hidden"
>
	<!-- input on mobile -->
	<div class="mx-auto flex max-w-md items-center gap-2">
		<TranslationInput
			bind:text
			{is_loading}
			{handleSubmit}
			onInputFocus={handleInputFocus}
			onInputBlur={handleInputBlur}
			needsAttention={history.length === 0}
			inputClass="text-gray-900 py-3"
			containerClass="mobile-input w-full max-w-full"
		/>
		
		{#if history.length === 0}
			<PlayPauseButton 
				isPaused={examplesPaused} 
				onClick={toggleExamples} 
				size="lg"
			/>
		{/if}
	</div>
</div>

<Toaster position="top-center" />

<style>
	/* Add smooth scrolling for language badges */
	.scrollbar-thin {
		scrollbar-width: thin;
		-ms-overflow-style: none;
	}

	.scrollbar-thin::-webkit-scrollbar {
		height: 6px;
	}

	.scrollbar-thin::-webkit-scrollbar-thumb {
		background-color: rgba(0, 0, 0, 0.2);
		border-radius: 3px;
	}

	.scrollbar-thin::-webkit-scrollbar-track {
		background-color: rgba(0, 0, 0, 0.05);
	}

	/* Disable double-tap zoom on mobile */
	:global(html) {
		touch-action: manipulation;
	}

	/* Specifically disable double-tap zoom in the dropdown */
	:global(.dropdown-menu-content) {
		touch-action: manipulation;
	}

	/* Mobile-optimized styles */
	@media (max-width: 768px) {
		:global(body) {
			padding-bottom: 80px; /* Space for the fixed input bar */
		}

		/* Add a subtle animation for the mobile input bar */
		:global(.fixed.bottom-0) {
			animation: slide-up 0.2s ease-out;
		}

		/* Custom animation for a smoother feel */
		@keyframes slide-up {
			from {
				transform: translateY(100%);
				opacity: 0;
			}
			to {
				transform: translateY(0);
				opacity: 1;
			}
		}

		/* Improve tap target sizes for mobile */
		:global(button:not(.icon-button)),
		:global(a:not(.icon-button)) {
			min-height: 44px;
			min-width: 44px;
		}

		/* Icon buttons should keep their small size */
		:global(.icon-button) {
			min-height: unset;
			min-width: unset;
			height: auto;
			width: auto;
		}

		/* Ensure debug and settings buttons don't overlap with the input bar */
		:global(.fixed.bottom-4.right-4) {
			bottom: 80px !important; /* Move above the input bar */
		}
	}
</style>
