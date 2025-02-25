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

	function clearHistory() {
		history = [];
		localStorage.setItem('translationHistory', '[]');
	}

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

	// Add a function to clear the localStorage cache completely
	function clearLocalStorageCache() {
		if (typeof window !== 'undefined') {
			localStorage.clear();
			toast.success('Local storage cache cleared!');
			// Reload the page to reinitialize everything
			window.location.reload();
		}
	}

	// All available languages that can be toggled
	let available_langs = $derived(Object.keys(user_langs));
	console.log('available_langs:', available_langs);
	
	// Languages that should appear in translation cards
	let display_langs = $derived(
		Object.entries(user_langs)
			.filter(([_, lang]) => lang.display)
			.map(([key, _]) => key)
	);
	console.log('display_langs:', display_langs);
	let is_loading = $state(false);
	let is_ready = $derived(text.length > 0 && available_langs.length > 0 && !is_loading);

	function langs_not_shown(translation) {
		// Show languages that are in the translation but not currently displayed
		return Object.keys(translation.translations).filter((lang) => !display_langs.includes(lang));
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
		const apiUrl = 'https://translate.xces.workers.dev';

		try {
			// Send target languages as 3-character ISO codes
			console.log('Target languages:', available_langs);
			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					api_key: OPENAI_API_KEY
				},
				body: JSON.stringify({
					text,
					tgt_langs: available_langs
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
					translations: data
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
	<div class="flex gap-2">
		<Button variant="outline" size="sm" onclick={clearLocalStorageCache}>
			Clear Cache
		</Button>
	</div>
	<Input type="text" placeholder="Enter text to translate" bind:value={text} />
	<div class="flex flex-wrap items-center gap-2">
		<a href="/languages" class="p-2 hover:text-yellow-500 transition-colors" title="Add or remove languages">
			<Languages class="w-5 h-5" />
		</a>
		{#each Object.entries(user_langs) as [key, meta]}
			<Badge
				variant={meta.display ? 'default' : 'outline'}
				class="cursor-pointer"
				onclick={() => toggle_display(key)}
			>
				{meta.native}
			</Badge>
		{/each}
		
	</div>
	<Button onclick={handleSubmit} disabled={!is_ready}>
		<Search class="mr-2 h-4 w-4" />
		{is_loading ? 'Translating...' : 'Translate'}
	</Button>

	<div class="space-y-4">
		<div class="flex items-center gap-2">
			<h2 class="text-xl font-semibold">Translation History</h2>
			<Button variant="ghost" size="icon" onclick={clearHistory} title="Clear history">
				<Trash2 class="h-4 w-4" />
			</Button>
		</div>
		<div class="flex max-w-6xl flex-wrap gap-4">
			{#each history as translation, i}
				<div class="group">
					<Card>
						<CardContent>
							<div class="relative space-y-2">
								<button
									class="absolute right-0 top-0 hidden group-hover:block hover:text-red-500"
									aria-label="Delete translation"
									onclick={() => deleteTranslation(i)}
								>
									<Trash2 class="h-4 w-4" />
								</button>
								{#each display_langs as langKey}
									{#if translation.translations[langKey]}
										<div
											class="group/item flex cursor-pointer items-center justify-between rounded-md p-2 hover:bg-gray-50"
											onclick={() => copyToClipboard(translation.translations[langKey])}
										>
											<p
												class={translation.translations[langKey] === translation.text
													? 'font-bold'
													: ''}
											>
												{translation.translations[langKey]}
											</p>
											<button
												class="hidden group-hover/item:block hover:text-blue-500"
												aria-label="Copy translation"
												onclick={(e) => {
													e.stopPropagation();
													copyToClipboard(translation.translations[langKey]);
												}}
											>
												<Copy class="h-4 w-4" />
											</button>
										</div>
									{/if}
								{/each}
								{#if langs_not_shown(translation).length > 0}
									<p>
										<i>+ {langs_not_shown(translation).join('•')}</i>
									</p>
								{/if}
							</div>
						</CardContent>
					</Card>
				</div>
			{:else}
				<div class="group">
					<Card>
						<CardContent>
							<div class="space-y-2">
								{#each display_langs as langKey}
									{#if example_translation.translations[langKey]}
										<div
											class="group/item flex cursor-pointer items-center justify-between rounded-md p-2 hover:bg-gray-50"
											onclick={() => copyToClipboard(example_translation.translations[langKey])}
										>
											<p
												class={example_translation.translations[langKey] === example_translation.text
													? 'font-bold'
													: ''}
											>
												{example_translation.translations[langKey]}
											</p>
											<button
												class="hidden group-hover/item:block hover:text-blue-500"
												aria-label="Copy translation"
												onclick={(e) => {
													e.stopPropagation();
													copyToClipboard(example_translation.translations[langKey]);
												}}
											>
												<Copy class="h-4 w-4" />
											</button>
										</div>
									{/if}
								{/each}
								{#if langs_not_shown(example_translation).length > 0}
									<p>
										<i>+ {langs_not_shown(example_translation).join('•')}</i>
									</p>
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
