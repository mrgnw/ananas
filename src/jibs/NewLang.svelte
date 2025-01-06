<script>
	import { languages } from 'countries-list';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Toaster } from 'svelte-sonner';
	import { toast } from 'svelte-sonner';
	import { Languages, Search, Trash2, Copy } from 'lucide-svelte';
	import { dndzone } from 'svelte-dnd-action';
	import _ from 'underscore';

	let example_translation = {
		text: 'Ahoy',
		translations: {
			en: 'Hello',
			es: 'Hola',
			ru: 'Привет',
			it: 'Ciao',
			de: 'Hallo',
			ca: 'Hola'
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

	const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

	let text = $state('');
	let show_original = $state(true);

	let user_langs = $state(loadUserLangs());

	function loadUserLangs() {
		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem('user_langs');
			if (stored) {
				return JSON.parse(stored);
			}
		}
		// Default languages if nothing is stored
		return {
			en: { label: 'English', native: 'English', rtl: false, display: true },
			ru: { label: 'Russian', native: 'Русский', rtl: false, display: true },
			ja: { label: 'Japanese', native: '日本語', rtl: false, display: true },
			es: { label: 'Spanish', native: 'Español', rtl: false, display: true },
			it: { label: 'Italian', native: 'Italiano', rtl: false, display: true }
		};
	}

	// Add effect to save changes
	$effect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('user_langs', JSON.stringify(user_langs));
		}
	});

	let tgt_langs = $derived(Object.keys(user_langs));
	let show_langs = $derived(
		Object.entries(user_langs)
			.filter(([_, lang]) => lang.display)
			.map(([key, _]) => key)
	);
	let is_loading = $state(false);
	let is_ready = $derived(text.length > 0 && tgt_langs.length > 0 && !is_loading);

	function langs_not_in_tgt(translation) {
		return Object.keys(translation.translations).filter((lang) => !tgt_langs.includes(lang));
	}

	function toggle_display(key) {
		if (key === 'original') {
			show_original = !show_original;
		} else {
			user_langs[key].display = !user_langs[key].display;
		}
		console.log('toggling', key);
	}

	async function handleSubmit() {
		is_loading = true;
		const apiUrl = 'https://translate.xces.workers.dev';

		try {
			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					api_key: OPENAI_API_KEY
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

<div class="container mx-auto space-y-6 p-4">
	<h1 class="mb-4 text-2xl font-bold">Ananas</h1>
	<p class="text-sm text-gray-500">Multi-language translator</p>
	<!-- <pre><code>{JSON.stringify(langs, null, 2)}</code></pre> -->
	<div class="space-y-4">
		<Input type="text" placeholder="Enter text to translate" bind:value={text} />
		<div class="flex flex-wrap items-center gap-2">
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
			<Languages class="mr-2 h-4 w-4" />
			{is_loading ? 'Translating...' : 'Translate'}
		</Button>
	</div>

	<div class="space-y-4">
		<div class="flex items-center gap-2">
			<h2 class="text-xl font-semibold">Translation History</h2>
			<Button variant="ghost" size="icon" onclick={clearHistory} title="Clear history">
				<Trash2 class="h-4 w-4" />
			</Button>
		</div>
		<div class="flex max-w-6xl flex-wrap gap-4">
			{#each history as translation}
				<Card>
					<CardContent>
						<div class="space-y-2">
							{#each show_langs as langKey}
								{#if translation.translations[langKey]}
									<div
										class="group flex cursor-pointer items-center justify-between rounded-md p-2 hover:bg-gray-50"
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
											class="opacity-0 transition-opacity group-hover:opacity-100"
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
							{#if langs_not_in_tgt(translation).length > 0}
								<p>
									<i>+ {langs_not_in_tgt(translation).join('•')}</i>
								</p>
							{/if}
						</div>
					</CardContent>
				</Card>
			{:else}
				<Card>
					<CardContent>
						<div class="space-y-2">
							{#each show_langs as langKey}
								{#if example_translation.translations[langKey]}
									<div
										class="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded-md"
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
											class="opacity-0 group-hover:opacity-100 transition-opacity"
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
							{#if langs_not_in_tgt(example_translation).length > 0}
								<p>
									<i>+ {langs_not_in_tgt(example_translation).join('•')}</i>
								</p>
							{/if}
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	</div>
</div>

<Toaster />
