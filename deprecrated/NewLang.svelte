<script>
	import { exampleTranslations } from '$lib/example';
	import { translationHistory } from '$lib/stores/translationHistory.svelte.js';
	import { exampleTyper } from '$lib/stores/exampleTyper.svelte.js';
	import { translationStateMachine, STATES } from '$lib/stores/translationStateMachine.svelte.js';
	import MultiLangCard from './MultiLangCard.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Toaster } from 'svelte-sonner';
	import { toast } from 'svelte-sonner';
	import { browser } from '$app/environment';
	import TranslationInput from './TranslationInput.svelte';
	import PlayPauseButton from './PlayPauseButton.svelte';
	import { getColorByIndex } from '$lib/colors';
	import { onMount, onDestroy } from 'svelte';
	import { userStore } from '$lib/stores/user.svelte.js';

	// State tracking variables
	let isTyping = $state(false);
	let examplesPaused = $state(true); // Start with examples paused
	let is_loading = $state(false); // Change this to a regular state variable
	
	// Subscribe to the state machine
	const unsubscribeMachine = translationStateMachine.subscribe(state => {
		console.log('State machine update:', state.currentState, 'examplesPaused:', state.context.examplesPaused);
		examplesPaused = state.context.examplesPaused;
		is_loading = state.currentState === STATES.TRANSLATING; // Update is_loading based on state
	});
	
	// Subscribe to the example typer for specific typing state
	const unsubscribeTyper = exampleTyper.subscribe(state => {
		isTyping = state.isTyping;
	});
	
	// Clean up subscriptions when component is destroyed
	onDestroy(() => {
		unsubscribeMachine();
		unsubscribeTyper();
	});

	// Initialize machine and examples when component is mounted
	let examplesCleanup;
	onMount(() => {
		// Update dependencies initially
		exampleTyper.updateDependencies(text, $translationHistory.length);
		
		// Initialize examples if there's no history
		if ($translationHistory.length === 0) {
			translationStateMachine.actions.startExamples();
			examplesCleanup = exampleTyper.initializeExamples((newText) => text = newText);
		}
		
		return () => {
			if (examplesCleanup) examplesCleanup();
		};
	});

	// Track changes to text and history length
	$effect(() => {
		exampleTyper.updateDependencies(text, $translationHistory.length);
		
		// If text is empty and there's no history, consider restarting examples
		if (text.trim().length === 0 && !isTyping && $translationHistory.length === 0) {
			exampleTyper.restartExamplesIfNeeded((newText) => text = newText);
		}
	});
	
	function loadSavedText() {
		if (browser) {
			const savedText = sessionStorage.getItem('translationInputText');
			return savedText || '';
		}
		return '';
	}

	function saveText(currentText) {
		if (browser) {
			sessionStorage.setItem('translationInputText', currentText);
		}
	}

	function deleteTranslation(index) {
		translationHistory.deleteTranslation(index);
	}

	let text = $state(loadSavedText());
	let truncate_lines = $state(true);

	// Language management
	let user_langs = $derived(() => userStore.user.selectedLanguages);
	let tgt_langs = $derived(() => userStore.user.selectedLanguages);
	let show_langs = $derived(() =>
		Object.entries(user_langs)
			.filter(([_, lang]) => lang.display)
			.map(([key, _]) => key)
	);

	// Save text when it changes
	$effect(() => {
		saveText(text);
	});

	async function handleSubmit() {
		console.log('handleSubmit called with text:', text);
		
		// Only validate text here, don't block on any other conditions
		if (!text || text.trim().length === 0) {
			console.debug('Skipping submission - empty text');
			return;
		}

		// Check if we're already translating to prevent double-submissions
		if (is_loading) {
			console.debug('Already translating, skipping submission');
			return;
		}

		// Use state machine to indicate we're translating
		translationStateMachine.actions.startTranslating(text);
		console.log('Starting translation process, text:', text.substring(0, 20) + (text.length > 20 ? '...' : ''));
		
		const apiUrl = '/api/translate';

		try {
			console.log('Starting translation for:', text);
			console.log('Target languages:', tgt_langs);
			
			console.log('Target languages:', tgt_langs);
			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					text,
					tgt_langs
				})
			});

			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const data = await response.json();
			console.log('Translation API response:', data);

			if (translationHistory.get().some((item) => item.text === text)) {
				toast.info('This text has already been translated!');
				text = '';
				sessionStorage.removeItem('translationInputText'); 
				exampleTyper.restartExamplesIfNeeded((newText) => text = newText);
				translationStateMachine.actions.reset();
				return;
			}

			try {
				translationHistory.addTranslation(text, data);
				
				// Update state machine with success
				translationStateMachine.actions.translationSuccess(data);
				
				toast.success('Translation successful!');
				text = '';
				sessionStorage.removeItem('translationInputText');
			} catch (storeError) {
				console.error('Error adding translation to history:', storeError);
				translationStateMachine.actions.translationError(storeError);
				toast.error('Failed to save translation');
			}
		} catch (error) {
			console.error('Error fetching translation:', error);
			translationStateMachine.actions.translationError(error);
			toast.error('Translation failed. Please try again.');
		} finally {
			// No need to explicitly set is_loading here as it's derived from the state machine
		}
	}

	// Handle user input - notify the state machine
	function handleUserInput(event) {
		// Log the actual input value for debugging
		console.debug('User input detected:', { 
			value: event?.target?.value,
			currentText: text,
			textLength: text?.length || 0
		});
		
		// Update text state - this is important for the binding to work correctly
		if (event && event.target && typeof event.target.value === 'string') {
			text = event.target.value;
		}
		
		if (!isTyping) {
			translationStateMachine.actions.userTyping(text);
			exampleTyper.handleUserInput();
		}
	}

	// Handle events by forwarding to the store with state machine awareness
	function handleInputFocus() {
		exampleTyper.handleInputFocus((newText) => text = newText);
	}
	
	function handleInputBlur() {
		exampleTyper.handleInputBlur((newText) => text = newText);
	}

	// Toggle examples using the state machine
	function toggleExamples() {
		const newPauseState = translationStateMachine.actions.toggleExamples();
		// Update the exampleTyper based on the new state
		exampleTyper.toggleExamples((newText) => text = newText);
	}

	// Keyboard event handlers for accessibility and user typing detection
	function handleKeyDown(event, callback) {
		// Log key press for debugging with the current text value
		console.debug('Key pressed in NewLang:', event.key, {
			text_value: text,
			text_length: text?.length || 0,
			text_trimmed_length: text?.trim?.()?.length || 0,
			is_loading,
			canSubmit: Boolean(text?.trim?.()?.length > 0 && !is_loading)
		});
		
		// Handle submission on Enter key with minimal conditions
		if (event.key === 'Enter') {
			if (text && text.trim().length > 0 && !is_loading) {
				console.log('Enter key - submitting valid text:', text);
				event.preventDefault();
				handleSubmit();
				return;
			} else {
				console.log('Enter key - cannot submit:', 
					!text?.trim?.()?.length ? 'empty text' : 'currently loading',
					'Current text value:', text);
			}
		}
		
		// Handle the callback for other accessibility cases
		if ((event.key === 'Enter' || event.key === ' ') && callback) {
			event.preventDefault();
			callback();
		}
		
		// Always mark user as typed for any key press when not in automatic typing
		if (!isTyping) {
			translationStateMachine.actions.userTyping();
			exampleTyper.markUserTyped();
		}
	}

	function addDefaultLanguages() {
		// Set some default ISO codes (e.g. English, Russian, Japanese, Spanish, Italian, Catalan)
		const defaults = ['eng', 'rus', 'jpn', 'spa', 'ita', 'cat'];
		defaults.forEach(code => userStore.addLanguage(code));
		toast.success("Added default languages");
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
				is_loading={is_loading}
				{handleSubmit}
				needsAttention={$translationHistory.length === 0}
				onInputFocus={handleInputFocus}
				onInputBlur={handleInputBlur}
				onInput={handleUserInput}
				onKeyDown={handleKeyDown} 
				onKeyPress={handleKeyDown} 
				inputClass="px-1 font-medium py-2.5"
				containerClass="desktop-input w-full"
			/>
			
			{#if $translationHistory.length === 0}
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
				{#each $translationHistory as translation, i}
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
			is_loading={is_loading}
			{handleSubmit}
			onInputFocus={handleInputFocus}
			onInputBlur={handleInputBlur}
			onInput={handleUserInput}
			onKeyDown={handleKeyDown}
			onKeyPress={handleKeyDown}
			needsAttention={$translationHistory.length === 0}
			inputClass="text-gray-900 py-3"
			containerClass="mobile-input w-full max-w-full"
		/>
		
		{#if $translationHistory.length === 0}
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
