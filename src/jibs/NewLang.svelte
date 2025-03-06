<script>
	import { examplePhrases, exampleTranslations } from '$lib/example';

	function getRandomExample() {
		const randomIndex = Math.floor(Math.random() * examplePhrases.length);
		return examplePhrases[randomIndex];
	}

	// Track the current example index for cycling through examples
	let currentExampleIndex = $state(0);
	
	// Track if currently typing
	let isTyping = $state(false);
	
	// Interval ID for cleanup
	let typingInterval = $state(null);
	
	// Normal and fast typing speeds
	const NORMAL_TYPING_SPEED = 100;
	const FAST_TYPING_SPEED = 20;
	
	/**
	 * Simple typewriter function that updates a variable one letter at a time
	 * @param {string} newText - The new text to type
	 * @param {number} speed - Typing speed in milliseconds
	 */
	function typeLetters(newText, speed = NORMAL_TYPING_SPEED) {
		console.log('typeLetters called with:', newText);
		
		// Don't start a new typing operation if one is in progress
		if (isTyping) {
			console.log('Already typing, canceling');
			return;
		}
		
		// Set typing state
		isTyping = true;
		
		// Clear any existing interval
		if (typingInterval) {
			console.log('Clearing existing interval');
			clearInterval(typingInterval);
		}
		
		// Start with empty string
		text = "";
		
		// Current position in the text
		let i = 0;
		
		console.log('Starting typing interval');
		// Set up interval to add one letter at a time
		typingInterval = setInterval(() => {
			if (i < newText.length) {
				// Add the next letter
				text = newText.substring(0, i + 1);
				i++;
			} else {
				clearInterval(typingInterval);
				isTyping = false;
			}
		}, speed);
	}
	
	// Interval for cycling examples
	let cycleInterval = $state(null);
	
	// Function to cycle to the next example
	function cycleExamples() {
		console.log('Cycling to next example');
		if (history.length === 0) {
			// Move to next example
			currentExampleIndex = (currentExampleIndex + 1) % examplePhrases.length;
			console.log('New example index:', currentExampleIndex);
			
			// Type the new example text
			typeLetters(examplePhrases[currentExampleIndex], NORMAL_TYPING_SPEED);
		}
	}
	
	// Handle input focus event from TranslationInput
	function handleInputFocus() {
		console.log('Input focus event received in NewLang');
		
		// If currently typing, complete the entire example quickly
		if (isTyping && typingInterval) {
			console.log('Completing entire example quickly');
			
			// Clear current interval to stop normal typing
			clearInterval(typingInterval);
			typingInterval = null;
			
			// Get current text and target text
			const currentText = text;
			const targetText = examplePhrases[currentExampleIndex];
			
			// Make sure we have text to work with
			if (!currentText || !targetText) {
				isTyping = false;
				return;
			}
			
			// Complete the entire remaining text quickly
			const ULTRA_FAST_TYPING_SPEED = 5; // milliseconds between characters
			let i = currentText.length;
			
			console.log(`Typing from index ${i} to the end in text: "${targetText}"`); 
			
			// Set up a new interval that types very quickly to complete the entire example
			typingInterval = setInterval(() => {
				if (i < targetText.length) {
					// Add the next letter at ultra fast speed
					text = targetText.substring(0, i + 1);
					i++;
				} else {
					// Once we've completed the entire example, stop typing
					console.log('Finished typing entire example');
					clearInterval(typingInterval);
					typingInterval = null;
					isTyping = false;
				}
			}, ULTRA_FAST_TYPING_SPEED);
		} else {
			console.log('No typing animation to stop');
		}
	}
	
	// Initialize examples when browser is available
	$effect(() => {
		if (browser) {
			console.log('Browser available, initializing examples');
			
			// Type the first example after a short delay
			const timeout = setTimeout(() => {
				console.log('Starting first example');
				typeLetters(examplePhrases[currentExampleIndex], NORMAL_TYPING_SPEED);
				
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
				if (cycleInterval) {
					clearInterval(cycleInterval);
					cycleInterval = null;
				}
				if (typingInterval) {
					clearInterval(typingInterval);
					typingInterval = null;
				}
			};
		}
	});

	import { translateLanguages } from '$lib/stores/translateLanguages.svelte.js';
	import MultiLangCard from './MultiLangCard.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Toaster } from 'svelte-sonner';
	import { toast } from 'svelte-sonner';
	import { browser } from '$app/environment';
	import TranslationInput from './TranslationInput.svelte';
	import { getColorByIndex } from '$lib/colors';

	const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

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

	function clearAllHistory() {
		if (confirm('Are you sure you want to clear all translation history?')) {
			history = [];
			if (browser) {
				localStorage.setItem('translationHistory', JSON.stringify(history));
			}
			toast.success('Translation history cleared');
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
	let is_ready = $derived(text.length > 0 && !is_loading);

	async function handleSubmit() {
		// Stop typing animation if it's running
		if (isTyping) {
			clearInterval(typingInterval);
			isTyping = false;
		}
		
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

<div class="mx-auto max-w-screen-lg space-y-4 px-2 pb-[100px] sm:pb-[80px] md:pb-0 env-ios:pb-[120px]">
	<!-- Site title and info at the top of the page -->
	<h1 class="mx-auto mb-2 max-w-2xl text-center text-3xl font-bold text-gray-900">
		Translate to Multiple Languages at Once
	</h1>
	<p class="mx-auto max-w-2xl text-center text-gray-600">
		Type your text below and instantly see translations in all your selected languages.
	</p>

	<div class="relative mx-auto max-w-2xl">
		<TranslationInput
			bind:text
			{is_loading}
			{is_ready}
			{handleSubmit}
			{getRandomExample}
			{isTyping}
			variant="desktop"
			needsAttention={history.length === 0}
			class="desktop-input"
			onInputFocus={handleInputFocus}
		/>
	</div>

	<div class="space-y-4">
		<!-- Translation review section -->
		<div class="space-y-4">
			<div class="sticky top-0 z-10 bg-white pt-4 pb-2">
				<div class="flex flex-wrap items-center justify-between gap-2 pb-2">
					<div class="flex items-center gap-3">
						<h2 class="text-xl font-semibold text-gray-800">Review</h2>
						<p class="text-sm text-gray-600">Review all of your languages together</p>

						{#if tgt_langs.length > 0}
							<div class="flex items-center">
								<!-- language visibility badges -->
								<div
									class="scrollbar-thin flex max-w-[calc(100vw-120px)] sm:max-w-[400px] md:max-w-[500px] flex-row flex-nowrap gap-1.5 overflow-x-auto py-1.5"
								>
									{#each Object.entries(user_langs) as [key, meta], index}
										<Badge
											variant={meta.display ? 'default' : 'outline'}
											class="h-6 shrink-0 cursor-pointer whitespace-nowrap px-2 py-0.5 text-xs font-medium hover:scale-105 transition-transform {meta.display ? getColorByIndex(index) : 'hover:bg-gray-100'}"
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
	<div class="mx-auto flex max-w-md">
		<TranslationInput
			bind:text
			{is_loading}
			{is_ready}
			{handleSubmit}
			{getRandomExample}
			variant="mobile"
			needsAttention={history.length === 0}
		/>
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
