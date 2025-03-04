<script>
	import { languages } from 'countries-list';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Toaster } from 'svelte-sonner';
	import { toast } from 'svelte-sonner';
	import { Search, Trash2, Copy, Languages } from 'lucide-svelte';
	import { dndzone } from 'svelte-dnd-action';
	import _ from 'underscore';
	import { browser } from '$app/environment';

	let example_translation = {
		text: 'Ahoy',
		translations: {
			eng: 'Hello',
			spa: 'Hola',
			rus: 'Привет',
			ita: 'Ciao',
			deu: 'Hallo',
			cat: 'Hola'
		},
		timestamp: new Date().toISOString()
	};

	function loadHistory() {
		if (browser) {
			const stored = localStorage.getItem('translationHistory');
			if (stored == '[]') {
				return [example_translation];
			}
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

	const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

	// Import the shared language store
	import { translateLanguages } from '$lib/stores/translateLanguages.svelte.js';

	let text = $state('');
	let show_original = $state(true);

	// Use the shared language store
	let user_langs = $derived(translateLanguages.languages);
	console.log('user_langs updated:', user_langs);

	// All available languages that can be toggled
	let available_langs = $derived(Object.keys(user_langs));
	console.log('available_langs:', available_langs);

	// Languages that should appear in translation cards
	let show_langs = $derived(
		Object.entries(user_langs)
			.filter(([_, lang]) => lang.display)
			.map(([key, _]) => key)
	);
	console.log('show_langs:', show_langs);
	let show_language_codes = $state(browser ? window.innerWidth > 640 : true);
	let truncate_lines = $state(true);
	
	function toggleLanguageCodes() {
		show_language_codes = !show_language_codes;
	}
	
	let is_loading = $state(false);
	let is_ready = $derived(text.length > 0 && available_langs.length > 0 && !is_loading);

	function langs_not_shown(translation) {
		// Show languages that are in the translation but not currently displayed
		return Object.keys(translation.translations)
			.filter((lang) => !show_langs.includes(lang))
			.filter((lang) => lang != 'metadata');
	}

	function toggle_display(key) {
		console.log('toggle_display called for:', key);

		if (key === 'original') {
			show_original = !show_original;
		} else {
			translateLanguages.toggleLanguageDisplay(key);
		}
	}

	async function handleSubmit() {
		is_loading = true;
		const apiUrl = 'https://ananas-api.xces.workers.dev';

		try {
			console.log('Target languages:', available_langs);
			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					api_key: OPENAI_API_KEY
				},
				body: JSON.stringify({
					text,
					tgt_langs: available_langs // Use all selected languages, not just displayed ones
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

	const copyToClipboard = async (text) => {
		try {
			if (browser && navigator.clipboard && navigator.clipboard.writeText) {
				await navigator.clipboard.writeText(text);
				toast.success('Copied to clipboard!');
			} else {
				// Fallback for environments where Clipboard API is not available
				const textArea = document.createElement('textarea');
				textArea.value = text;
				document.body.appendChild(textArea);
				textArea.select();
				try {
					document.execCommand('copy');
					toast.success('Copied to clipboard!');
				} catch (err) {
					console.error('Failed to copy text:', err);
					toast.error('Failed to copy text. Please copy manually.');
				}
				document.body.removeChild(textArea);
			}
		} catch (err) {
			console.error('Failed to copy text:', err);
			toast.error('Failed to copy text. Please copy manually.');
		}
	};
</script>

<div class="space-y-4">
	<div class="relative">
		<Input 
			type="text" 
			placeholder="Enter text to translate..." 
			bind:value={text} 
			class="pr-[100px]"
			onkeydown={(e) => e.key === 'Enter' && is_ready && handleSubmit()}
		/>
		<Button 
			onclick={handleSubmit} 
			disabled={!is_ready}
			class="absolute right-0 top-0 h-full rounded-l-none"
		>
			{is_loading ? 'Translating...' : 'Translate'}
		</Button>
	</div>

	<div class="space-y-4">
		<!-- Language badges section -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<div class="text-sm font-medium text-gray-600">Active Languages</div>
				<a
					href="/languages"
					class="flex items-center gap-1 rounded-md border border-gray-200 bg-white p-1.5 text-xs shadow-sm hover:bg-gray-50"
					title="Manage languages"
				>
					<Languages class="h-3.5 w-3.5" />
					<span class="hidden sm:inline">Languages</span>
				</a>
			</div>
			
			<div class="scrollbar-thin flex space-x-2 overflow-x-auto pb-2 snap-x">
				{#each Object.entries(user_langs) as [key, meta]}
					<Badge
						variant={meta.display ? 'default' : 'outline'}
						class="cursor-pointer whitespace-nowrap snap-start flex-shrink-0"
						onclick={() => toggle_display(key)}
					>
						{meta.native}
					</Badge>
				{/each}
				<Badge
					variant="secondary"
					class="cursor-pointer whitespace-nowrap snap-start flex-shrink-0"
					onclick={() => show_original = !show_original}
				>
					{show_original ? 'Hide' : 'Show'} Original
				</Badge>
			</div>
		</div>
		
		<!-- Translation history section -->
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-xl font-semibold">Translation History</h2>
				<div class="flex items-center gap-2">
					<button
						class="rounded-md border border-gray-200 bg-white p-1.5 text-xs shadow-sm hover:bg-gray-50"
						onclick={() => toggleLanguageCodes()}
						title="Toggle language code labels"
					>
						{show_language_codes ? 'Hide' : 'Show'} Labels
					</button>
					<button
						class="rounded-md border border-gray-200 bg-white p-1.5 text-xs shadow-sm hover:bg-gray-50"
						onclick={() => truncate_lines = !truncate_lines}
						title="Toggle text truncation"
					>
						{truncate_lines ? 'Show Full Text' : 'Truncate Text'}
					</button>
				</div>
			</div>
			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
				{#each history as translation, i}
					<div class="group w-full">
						<Card class="h-full hover:shadow-md transition-shadow">
							<CardContent class="p-3">
								<div class="relative space-y-2">
									<div class="absolute right-0 top-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
										<button
											class="text-gray-400 hover:text-blue-500 p-1 rounded-full"
											aria-label="Copy all translations"
											onclick={() => {
												const allTranslations = Object.values(translation.translations).join('\n');
												copyToClipboard(allTranslations);
											}}
										>
											<Copy class="h-3.5 w-3.5" />
										</button>
										<button
											class="text-gray-400 hover:text-red-500 p-1 rounded-full"
											aria-label="Delete translation"
											onclick={() => deleteTranslation(i)}
										>
											<Trash2 class="h-3.5 w-3.5" />
										</button>
									</div>
								{#if show_original}
									<div class="text-sm font-medium text-gray-500 mb-2 border-b pb-2 pr-6 truncate" title={translation.text}>
										{translation.text}
									</div>
								{/if}
								{#each show_langs as langKey}
									{#if translation.translations[langKey]}
										<div
											class="group/item flex cursor-pointer items-center rounded-md px-1.5 py-1 hover:bg-gray-50"
											onclick={() => copyToClipboard(translation.translations[langKey])}
										>
											<div class="flex w-full items-center gap-1.5 overflow-hidden justify-between">
												<div class="flex items-center gap-1.5 overflow-hidden">
													{#if show_language_codes}
														<span class="flex-shrink-0 text-xs text-gray-400 w-8">{langKey}</span>
													{/if}
													<p
														class="text-sm {truncate_lines ? 'truncate' : ''}"
														class:font-medium={translation.translations[langKey] === translation.text}
														title={translation.translations[langKey]}
													>
														{translation.translations[langKey]}
													</p>
												</div>
												<button
													class="flex-shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity hover:text-blue-500"
													aria-label="Copy translation"
													onclick={(e) => {
														e.stopPropagation();
														copyToClipboard(translation.translations[langKey]);
													}}
												>
													<Copy class="h-3.5 w-3.5" />
												</button>
											</div>
										</div>
									{/if}
								{/each}
								{#if langs_not_shown(translation).length > 0}
									<div class="mt-1.5 text-center">
										<div
											class="inline-flex flex-wrap gap-1 justify-center"
										>
											{#each langs_not_shown(translation) as langCode}
												<span
													class="cursor-pointer text-[10px] px-1 py-0.5 bg-gray-100 text-gray-500 rounded hover:bg-gray-200"
													onclick={() => toggle_display(langCode)}
												>
													{langCode}
												</span>
											{/each}
										</div>
									</div>
								{/if}
								</div>
							</CardContent>
						</Card>
					</div>
				{:else}
					<div class="group w-full">
						<Card class="h-full hover:shadow-md transition-shadow">
							<CardContent class="p-3">
								<div class="relative space-y-2">
									<div class="absolute right-0 top-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
										<button
											class="text-gray-400 hover:text-blue-500 p-1 rounded-full"
											aria-label="Copy all translations"
											onclick={() => {
												const allTranslations = Object.values(example_translation.translations).join('\n');
												copyToClipboard(allTranslations);
											}}
										>
											<Copy class="h-3.5 w-3.5" />
										</button>
									</div>
									{#if show_original}
										<div class="text-sm font-medium text-gray-500 mb-2 border-b pb-2 pr-6 truncate" title={example_translation.text}>
											{example_translation.text}
										</div>
									{/if}
									{#each show_langs as langKey}
										{#if example_translation.translations[langKey]}
											<div
												class="group/item flex cursor-pointer items-center rounded-md px-1.5 py-1 hover:bg-gray-50"
												onclick={() => copyToClipboard(example_translation.translations[langKey])}
											>
												<div class="flex w-full items-center gap-1.5 overflow-hidden justify-between">
													<div class="flex items-center gap-1.5 overflow-hidden">
														{#if show_language_codes}
															<span class="flex-shrink-0 text-xs text-gray-400 w-8">{langKey}</span>
														{/if}
														<p
															class="text-sm {truncate_lines ? 'truncate' : ''}"
															class:font-medium={example_translation.translations[langKey] === example_translation.text}
															title={example_translation.translations[langKey]}
														>
															{example_translation.translations[langKey]}
														</p>
													</div>
													<button
														class="flex-shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity hover:text-blue-500"
														aria-label="Copy translation"
														onclick={(e) => {
															e.stopPropagation();
															copyToClipboard(example_translation.translations[langKey]);
														}}
													>
														<Copy class="h-3.5 w-3.5" />
													</button>
												</div>
											</div>
										{/if}
									{/each}
									{#if langs_not_shown(example_translation).length > 0}
										<div class="mt-1.5 text-center">
											<div
												class="inline-flex flex-wrap gap-1 justify-center"
											>
												{#each langs_not_shown(example_translation) as langCode}
													<span
														class="cursor-pointer text-[10px] px-1 py-0.5 bg-gray-100 text-gray-500 rounded hover:bg-gray-200"
														onclick={() => toggle_display(langCode)}
													>
														{langCode}
													</span>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							</CardContent>
						</Card>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<Toaster />
