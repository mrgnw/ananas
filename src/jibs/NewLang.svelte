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
		if (typeof window !== 'undefined') {
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
		localStorage.setItem('translationHistory', JSON.stringify(history));
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

			if (typeof window !== 'undefined') {
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
			if (navigator.clipboard && navigator.clipboard.writeText) {
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
	<Input type="text" placeholder="Enter text to translate" bind:value={text} />
	<div class="relative mb-2 overflow-x-auto">
		<div class="flex items-center gap-2 pb-1">
			<a
				href="/languages"
				class="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm font-medium shadow-sm transition-colors hover:text-yellow-500"
				title="Add or remove languages"
			>
				<Languages class="h-4 w-4" />
				<span class="hidden sm:inline">Manage Languages</span>
			</a>
			<div class="text-xs text-gray-500 italic">
				Tap a language to toggle visibility
			</div>
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
		</div>
	</div>
	<Button onclick={handleSubmit} disabled={!is_ready}>
		<Search class="mr-2 h-4 w-4" />
		{is_loading ? 'Translating...' : 'Translate'}
	</Button>

	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-semibold">Translation History</h2>
			<button 
				class="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium shadow-sm" 
				class:text-blue-500={show_original} 
				onclick={() => show_original = !show_original}
			>
				{show_original ? 'Hide' : 'Show'} Original
			</button>
		</div>
		<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
			{#each history as translation, i}
				<div class="group w-full">
					<Card class="h-full">
						<CardContent class="p-4">
							<div class="relative space-y-2">
								<button
									class="absolute right-1 top-1 opacity-0 text-gray-400 hover:text-red-500 group-hover:opacity-100 transition-opacity"
									aria-label="Delete translation"
									onclick={() => deleteTranslation(i)}
								>
									<Trash2 class="h-4 w-4" />
								</button>
								{#if show_original}
									<div class="text-sm font-medium text-gray-500 mb-2 border-b pb-2 pr-6">
										{translation.text}
									</div>
								{/if}
								{#each show_langs as langKey}
									{#if translation.translations[langKey]}
										<div
											class="group/item flex cursor-pointer items-center justify-between rounded-md p-2 hover:bg-gray-50"
											onclick={() => copyToClipboard(translation.translations[langKey])}
										>
											<p
												class={translation.translations[langKey] === translation.text
													? 'font-bold text-sm'
													: 'text-sm'}
											>
												{translation.translations[langKey]}
											</p>
											<button
												class="opacity-0 group-hover/item:opacity-100 transition-opacity hover:text-blue-500"
												aria-label="Copy translation"
												onclick={(e) => {
													e.stopPropagation();
													copyToClipboard(translation.translations[langKey]);
												}}
											>
												<Copy class="h-3.5 w-3.5" />
											</button>
										</div>
									{/if}
								{/each}
								{#if langs_not_shown(translation).length > 0}
									<div class="mt-2 text-center">
										<button
											class="rounded-full border border-gray-100 px-2 py-0.5 text-xs text-gray-400 text-center max-w-full overflow-x-auto whitespace-nowrap"
										>
											{#each langs_not_shown(translation) as langCode, i}
												<span
													title={translateLanguages.getLanguageInfo(langCode)?.native || langCode}
													class="cursor-pointer transition-colors hover:text-gray-600"
													onclick={() => toggle_display(langCode)}
												>
													{langCode}{i < langs_not_shown(translation).length - 1 ? ' · ' : ''}
												</span>
											{/each}
										</button>
									</div>
								{/if}
							</div>
						</CardContent>
					</Card>
				</div>
			{:else}
				<div class="group w-full">
					<Card class="h-full">
						<CardContent class="p-4">
							<div class="space-y-2">
								{#if show_original}
									<div class="text-sm font-medium text-gray-500 mb-2 border-b pb-2">
										{example_translation.text}
									</div>
								{/if}
								{#each show_langs as langKey}
									{#if example_translation.translations[langKey]}
										<div
											class="group/item flex cursor-pointer items-center justify-between rounded-md p-2 hover:bg-gray-50"
											onclick={() => copyToClipboard(example_translation.translations[langKey])}
										>
											<p
												class={example_translation.translations[langKey] ===
												example_translation.text
													? 'font-bold text-sm'
													: 'text-sm'}
											>
												{example_translation.translations[langKey]}
											</p>
											<button
												class="opacity-0 group-hover/item:opacity-100 transition-opacity hover:text-blue-500"
												aria-label="Copy translation"
												onclick={(e) => {
													e.stopPropagation();
													copyToClipboard(example_translation.translations[langKey]);
												}}
											>
												<Copy class="h-3.5 w-3.5" />
											</button>
										</div>
									{/if}
								{/each}
								{#if langs_not_shown(example_translation).length > 0}
									<div class="mt-2 text-center">
										<p class="text-xs text-gray-400">
											+ {langs_not_shown(example_translation).join(' · ')}
										</p>
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

<Toaster />
