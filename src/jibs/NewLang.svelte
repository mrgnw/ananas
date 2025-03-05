<script>
	import { examplePhrases, exampleTranslations } from '$lib/example';

	function getRandomExample() {
		const randomIndex = Math.floor(Math.random() * examplePhrases.length);
		return examplePhrases[randomIndex];
	}

	import { translateLanguages } from '$lib/stores/translateLanguages.svelte.js';
	import MultiLangCard from './MultiLangCard.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Toaster } from 'svelte-sonner';
	import { toast } from 'svelte-sonner';
	import { Languages } from 'lucide-svelte';
	import { browser } from '$app/environment';

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

	// All available languages that can be toggled
	let tgt_langs = $derived(Object.keys(user_langs));

	let show_langs = $derived(
		Object.entries(user_langs)
			.filter(([_, lang]) => lang.display)
			.map(([key, _]) => key)
	);
	function toggleLanguageCodes() {
		// Removed this function as it's no longer needed
	}

	let is_loading = $state(false);
	let is_ready = $derived(text.length > 0 && !is_loading);

	function langs_not_shown(translation) {
		// Show languages that are in the translation but not currently displayed
		return Object.keys(translation.translations)
			.filter((lang) => !show_langs.includes(lang))
			.filter((lang) => lang != 'metadata');
	}

	// Using toggleLanguageDisplay directly from the store

	async function handleSubmit() {
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

<div class="mx-auto max-w-screen-lg space-y-4 px-2 pb-[80px] sm:px-0 md:pb-0">
	<!-- Site title and info at the top of the page -->
	<h1 class="mx-auto mb-2 max-w-2xl text-center text-3xl font-bold text-gray-900">
		Translate to Multiple Languages at Once
	</h1>
	<p class="mx-auto max-w-2xl text-center text-gray-600">
		Type your text below and instantly see translations in all your selected languages.
	</p>

	<!-- Desktop Input - Hidden on Mobile -->
	<div class="relative mx-auto hidden max-w-2xl md:block">
		<div class="flex items-center gap-2">
			<div
				class="relative flex-1 overflow-hidden rounded-full border border border-gray-100 border-gray-200 shadow-md"
			>
				<div class="flex items-center">
					<Input
						type="text"
						placeholder="Enter text from any language..."
						bind:value={text}
						disabled={is_loading}
						class="w-full rounded-full border-0 bg-white py-2.5 pl-4 pr-4 focus:ring-0 {is_loading ? 'opacity-75' : ''}"
						onkeydown={(e) => e.key === 'Enter' && is_ready && handleSubmit()}
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
								><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg
							>
						{/if}
						<span class="sr-only">{is_loading ? 'Translating...' : 'Translate'}</span>
					</Button>
				</div>
			</div>

			<div class="gap-0.5.5 flex items-center">
				<!-- Example button -->
				<button
					onclick={() => {
						text = getRandomExample();
						document.querySelector('input').focus();
					}}
					class="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 transition-colors hover:bg-purple-200"
					title="Try an example"
				>
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
						class="text-purple-700"
						><path
							d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"
						/></svg
					>
					<span class="sr-only">Try an example</span>
				</button>

				<!-- Languages Quick Access -->
				<a
					href="/languages"
					class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
					title="Manage languages"
				>
					<Languages class="h-5 w-5 text-gray-700" />
					<span class="sr-only">Manage languages</span>
				</a>
			</div>
		</div>
	</div>

	<div class="space-y-4">
		<!-- Translation review section -->
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<h2 class="text-xl font-semibold">Review</h2>

					{#if tgt_langs.length > 0}
						<div class="flex items-center gap-2">
							<!-- language visibility badges -->
							<div
								class="scrollbar-thin flex max-w-full flex-row flex-nowrap gap-1.5 overflow-x-auto py-1"
							>
								{#each Object.entries(user_langs) as [key, meta], index}
									<!-- class = {getLanguageColors(key, meta.display)} -->
									<Badge
										variant={meta.display ? 'default' : 'outline'}
										class="h-5 shrink-0 cursor-pointer whitespace-nowrap px-1.5 py-0 text-xs"
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

							<div class="text-center mb-6">
								<h3 class="text-lg font-medium text-gray-700 mb-2">No translations yet</h3>
								<p class="text-gray-500 mb-4">Enter text in any language to translate.</p>
							</div>

							<Button
								class="mt-2"
								onclick={() => {
									text = getRandomExample();
									document.querySelector('input').focus();
								}}
							>
								Try an Example
							</Button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<!-- Mobile Input Bar (fixed at bottom) with enhanced UX -->
<div
	class="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-4 shadow-lg md:hidden"
>
	<div class="mx-auto flex max-w-md items-center gap-2">
		<div
			class="relative flex-1 overflow-hidden rounded-full border border border-gray-100 border-gray-200 shadow-md"
		>
			<div class="flex items-center">
				<Input
					type="text"
					placeholder="Enter text from any language..."
					bind:value={text}
					disabled={is_loading}
					class="w-full rounded-full border-0 bg-white py-3 pl-4 pr-4 focus:ring-0 {is_loading ? 'opacity-75' : ''}"
					onkeydown={(e) => e.key === 'Enter' && is_ready && handleSubmit()}
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
							><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg
						>
					{/if}
					<span class="sr-only">{is_loading ? 'Translating...' : 'Translate'}</span>
				</Button>
			</div>
		</div>

		<div class="gap-0.5.5 flex items-center">
			<!-- Select Languages -->
			<a
				href="/languages"
				class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
				title="Manage languages"
			>
				<Languages class="h-5 w-5 text-gray-700" />
				<span class="sr-only">Manage languages</span>
			</a>
		</div>
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
