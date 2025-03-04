<script>
	import { languages } from 'countries-list';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Toaster } from 'svelte-sonner';
	import { toast } from 'svelte-sonner';
	import { Search, Trash2, Copy, Languages, MoreVertical, Check, Sliders, Eye } from 'lucide-svelte';
	import { dndzone } from 'svelte-dnd-action';
	import _ from 'underscore';
	import { browser } from '$app/environment';
	
	// Import dropdown menu components
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
		DropdownMenuSeparator,
		DropdownMenuCheckboxItem,
		DropdownMenuLabel,
		DropdownMenuRadioGroup,
		DropdownMenuRadioItem
	} from '$lib/components/ui/dropdown-menu';

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

	function clearAllHistory() {
		if (confirm('Are you sure you want to clear all translation history?')) {
			history = [example_translation];
			if (browser) {
				localStorage.setItem('translationHistory', JSON.stringify(history));
			}
			toast.success('Translation history cleared');
		}
	}

	const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

	// Import the shared language store
	import { translateLanguages } from '$lib/stores/translateLanguages.svelte.js';

	let text = $state('');
	let show_original = $state(true);
	let show_language_codes = $state(browser ? window.innerWidth > 640 : true);
	let truncate_lines = $state(true);
	// Badge display format: 'name', 'code', or 'flag'
	let badge_display = $state(browser ? localStorage.getItem('badgeDisplay') || 'name' : 'name');
	
	// Use the shared language store
	let user_langs = $derived(translateLanguages.languages);
	
	// All available languages that can be toggled
	let available_langs = $derived(Object.keys(user_langs));
	
	// Languages that should appear in translation cards
	let show_langs = $derived(
		Object.entries(user_langs)
			.filter(([_, lang]) => lang.display)
			.map(([key, _]) => key)
	);
	
	$effect(() => {
		if (browser) {
			localStorage.setItem('badgeDisplay', badge_display);
		}
	});
	
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
	
	// Keyboard event handlers for accessibility
	function handleKeyDown(event, callback) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			callback();
		}
	}
	
	// State for language dropdown
	let languageDropdownOpen = $state(false);
	let languageDropdownHoverTimeout;
	
	function setLanguageDropdownOpen(isOpen) {
		clearTimeout(languageDropdownHoverTimeout);
		languageDropdownOpen = isOpen;
	}
	
	function handleLanguageDropdownMouseleave() {
		// Set a short timeout before closing to make it feel natural
		languageDropdownHoverTimeout = setTimeout(() => {
			languageDropdownOpen = false;
		}, 300);
	}
</script>

<div class="space-y-4 px-2 sm:px-0 max-w-screen-lg mx-auto">
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

		
		<!-- Translation review section -->
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<h2 class="text-xl font-semibold">Review</h2>
					
					{#if available_langs.length > 0}
						<div class="flex items-center gap-2">
							<!-- Language visibility dropdown -->
							<DropdownMenu open={languageDropdownOpen} onOpenChange={setLanguageDropdownOpen}>
								<div onmouseleave={handleLanguageDropdownMouseleave}>
									<DropdownMenuTrigger class="flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100">
										<Eye class="h-4 w-4" />
										<span class="sr-only">Toggle language visibility</span>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="start">
										<DropdownMenuLabel>Visible Languages</DropdownMenuLabel>
										
										<!-- Language visibility toggles -->
										<div class="max-h-[200px] overflow-y-auto">
											{#each Object.entries(user_langs) as [key, meta]}
												<div 
													class="flex items-center px-2 py-1.5 cursor-pointer hover:bg-gray-100"
													onclick={() => toggle_display(key)}
												>
													<div class="w-4 h-4 mr-2 flex items-center justify-center">
														{#if meta.display}
															<Check class="h-4 w-4" />
														{/if}
													</div>
													<span>{meta.native} ({key})</span>
												</div>
											{/each}
										</div>
									</DropdownMenuContent>
								</div>
							</DropdownMenu>
							
							<!-- Language management link -->
							<a
								href="/languages"
								class="flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100"
								title="Manage languages"
							>
								<Languages class="h-4 w-4" />
								<span class="sr-only">Manage languages</span>
							</a>
							
							<!-- Compact language badges -->
							<div class="hidden sm:flex flex-wrap gap-1.5 overflow-x-auto max-w-[300px] md:max-w-none">
								{#each Object.entries(user_langs) as [key, meta]}
									<Badge
										variant={meta.display ? 'default' : 'outline'}
										class="cursor-pointer whitespace-nowrap text-xs px-2 py-0"
										onclick={() => toggle_display(key)}
										onkeydown={(e) => handleKeyDown(e, () => toggle_display(key))}
										tabindex="0"
										role="button"
										aria-pressed={meta.display}
									>
										{#if badge_display === 'name'}
											{meta.native}
										{:else if badge_display === 'code'}
											{key}
										{:else if badge_display === 'flag'}
											{meta.emoji || '🏳️'}
										{/if}
									</Badge>
								{/each}
							</div>
						</div>
					{/if}
				</div>
				
				<!-- Settings dropdown for translation review -->
				<DropdownMenu>
					<DropdownMenuTrigger class="flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100">
						<Sliders class="h-4 w-4" />
						<span class="sr-only">Translation review settings</span>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Display Settings</DropdownMenuLabel>
						
						<!-- Language badge display options -->
						<DropdownMenuLabel class="text-xs text-gray-500 pt-0">Badge Display</DropdownMenuLabel>
						<DropdownMenuRadioGroup value={badge_display} onValueChange={(value) => badge_display = value}>
							<DropdownMenuRadioItem value="name">Language Name</DropdownMenuRadioItem>
							<DropdownMenuRadioItem value="code">Language Code</DropdownMenuRadioItem>
							<DropdownMenuRadioItem value="flag">Flag</DropdownMenuRadioItem>
						</DropdownMenuRadioGroup>
						
						<DropdownMenuSeparator />
						
						<!-- Display options -->
						<DropdownMenuCheckboxItem 
							checked={show_original}
							onCheckedChange={(value) => { show_original = value; }}
						>
							Show Original Text
						</DropdownMenuCheckboxItem>
						
						<DropdownMenuCheckboxItem 
							checked={show_language_codes}
							onCheckedChange={(value) => { show_language_codes = value; }}
						>
							Show Language Codes
						</DropdownMenuCheckboxItem>
						
						<DropdownMenuCheckboxItem 
							checked={truncate_lines}
							onCheckedChange={(value) => { truncate_lines = value; }}
						>
							Truncate Text
						</DropdownMenuCheckboxItem>
						
						<DropdownMenuSeparator />
						
						<!-- Clear history option -->
						<DropdownMenuItem 
							class="text-red-500 focus:text-red-500" 
							onclick={clearAllHistory}
						>
							Clear History
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			
			<!-- Translation cards with improved responsive grid -->
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
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
									<div class="text-sm font-medium text-gray-600 mb-2 border-b pb-2 pr-6 truncate" title={translation.text}>
										{translation.text}
									</div>
								{/if}
								{#each show_langs as lang}
									{#if translation.translations[lang]}
										<div class="text-sm border-t first:border-t-0 pt-1.5 first:pt-0 relative">
											<div class="flex items-center gap-1 text-xs text-gray-500 mb-0.5">
												{#if badge_display === 'name'}
													{user_langs[lang]?.native || lang}
												{:else if badge_display === 'code'}
													{lang}
												{:else if badge_display === 'flag'}
													{user_langs[lang]?.emoji || '🏳️'}
												{/if}
												
												{#if show_language_codes && badge_display !== 'code'}
													<span class="text-gray-400 text-xs">({lang})</span>
												{/if}
												
												<button
													class="ml-auto text-gray-400 hover:text-blue-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
													aria-label="Copy translation"
													onclick={() => copyToClipboard(translation.translations[lang])}
												>
													<Copy class="h-3 w-3" />
												</button>
											</div>
											
											<div class={truncate_lines ? "line-clamp-3" : ""}>
												{translation.translations[lang]}
											</div>
										</div>
									{/if}
								{/each}
							</div>
						</CardContent>
					</Card>
				</div>
				{:else}
					<div class="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-8 text-gray-500">
						No translations yet. Enter text above to translate.
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<Toaster />

<style>
	/* Add smooth scrolling for language badges */
	.scrollbar-thin {
		scrollbar-width: thin;
		-ms-overflow-style: none;
	}
	
	.scrollbar-thin::-webkit-scrollbar {
		height: 6px;
	}
	
	.scrollbar-thin::-webkit-scrollbar-track {
		background: transparent;
	}
	
	.scrollbar-thin::-webkit-scrollbar-thumb {
		background-color: rgba(0, 0, 0, 0.1);
		border-radius: 6px;
	}
	
	/* Touch-friendly tap targets */
	@media (max-width: 640px) {
		button {
			min-height: 36px;
		}
	}
</style>
