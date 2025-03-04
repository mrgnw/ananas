<script>
	let exampleTranslations = [
		{
			text: 'Hello, how are you today?',
			translations: {
				eng: 'Hello, how are you today?',
				spa: 'Hola, ¿cómo estás hoy?',
				rus: 'Привет, как ты сегодня?',
				jpn: 'こんにちは、今日の調子はどうですか？',
				ita: 'Ciao, come stai oggi?',
				cat: 'Hola, com estàs avui?'
			}
		},
		{
			text: 'I love learning new languages!',
			translations: {
				eng: 'I love learning new languages!',
				spa: '¡Me encanta aprender nuevos idiomas!',
				rus: 'Я люблю изучать новые языки!',
				jpn: '新しい言語を学ぶのが大好きです！',
				ita: 'Adoro imparare nuove lingue!',
				cat: 'M\'encanta aprendre nous idiomes!'
			}
		}
	];

	// Example phrases in different languages for the "Try an Example" button
	let examplePhrases = [
		"あなたの名前は?", // Japanese: What is your name?
		"¿Cómo estás hoy?", // Spanish: How are you today?
		"Ich liebe Sprachen", // German: I love languages
		"Où est la bibliothèque?", // French: Where is the library?
		"Quanto costa questo?", // Italian: How much does this cost?
		"Что ты любишь делать?", // Russian: What do you like to do?
		"我想学习新语言", // Chinese: I want to learn new languages
		"Tudo bem com você?", // Portuguese: Are you doing well?
		"Hvad er klokken?", // Danish: What time is it?
		"Jag älskar att resa", // Swedish: I love to travel
		"Mikä on lempiruokasi?", // Finnish: What is your favorite food?
		"Πού είναι το ξενοδοχείο;", // Greek: Where is the hotel?
		"Dziękuję bardzo", // Polish: Thank you very much
		"Szeretnék egy kávét", // Hungarian: I would like a coffee
		"Jak se máš?", // Czech: How are you?
		"Koliko je sati?", // Croatian: What time is it?
		"Merhaba, nasılsın?", // Turkish: Hello, how are you?
		"저는 한국어를 배우고 있어요", // Korean: I am learning Korean
		"أين المطعم؟", // Arabic: Where is the restaurant?
		"מה השעה עכשיו?", // Hebrew: What time is it now?
		"Saya suka musik", // Indonesian: I like music
		"Cảm ơn rất nhiều", // Vietnamese: Thank you very much
		"Mahal kita", // Filipino/Tagalog: I love you
		"Kia ora", // Maori: Hello/Be well
		"Mình rất thích ẩm thực Việt Nam", // Vietnamese: I really like Vietnamese cuisine
		"Ik spreek een beetje Nederlands", // Dutch: I speak a little Dutch
		"Hvar er næsti strætó?", // Icelandic: Where is the next bus?
		"मुझे भारतीय खाना पसंद है", // Hindi: I like Indian food
	];
	
	function getRandomExample() {
		const randomIndex = Math.floor(Math.random() * examplePhrases.length);
		return examplePhrases[randomIndex];
	}

	import { languages } from 'countries-list';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Toaster } from 'svelte-sonner';
	import { toast } from 'svelte-sonner';
	import { Search, Trash2, Copy, Languages, MoreVertical, Check, Sliders, Eye, Inbox } from 'lucide-svelte';
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
		DropdownMenuLabel,
		DropdownMenuRadioGroup,
		DropdownMenuRadioItem,
		DropdownMenuCheckboxItem
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
	
	const colorPalette = [
		{ bg: 'bg-blue-100', text: 'text-blue-800' },
		{ bg: 'bg-red-100', text: 'text-red-800' },
		{ bg: 'bg-green-100', text: 'text-green-800' },
		{ bg: 'bg-yellow-100', text: 'text-yellow-800' },
		{ bg: 'bg-purple-100', text: 'text-purple-800' },
		{ bg: 'bg-pink-100', text: 'text-pink-800' },
		{ bg: 'bg-indigo-100', text: 'text-indigo-800' },
		{ bg: 'bg-cyan-100', text: 'text-cyan-800' },
		{ bg: 'bg-orange-100', text: 'text-orange-800' },
		{ bg: 'bg-teal-100', text: 'text-teal-800' },
		{ bg: 'bg-lime-100', text: 'text-lime-800' },
		{ bg: 'bg-amber-100', text: 'text-amber-800' }
	];

	// Helper function to get language colors
	function getLanguageColors(key, display, type) {
		if (colors_enabled === false) {
			return '';
		}
		const index = Object.keys(user_langs).indexOf(key);
		const colors = colorPalette[index % colorPalette.length];
		if (type === 'dropdown') {
			return display ? colors.text : '';
		}
		return display ? `${colors.bg} ${colors.text}` : '';
	}

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

	const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

	// Import the shared language store
	import { translateLanguages } from '$lib/stores/translateLanguages.svelte.js';

	let text = $state('');
	let show_original = $state(true);
	let truncate_lines = $state(true);
	let colors_enabled = $state(browser ? localStorage.getItem('colorsEnabled') !== 'false' : true);

	// Badge display format: 'name', 'code'
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
		// Removed this function as it's no longer needed
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

	// Add this function to handle checkbox clicks without closing the dropdown
	function handleCheckboxClick(event, key) {
		// Prevent the default behavior which would close the dropdown
		event.stopPropagation();
		// Toggle the language display
		toggle_display(key);
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
	let settingsDropdownOpen = $state(false);
	
	function setLanguageDropdownOpen(isOpen) {
		clearTimeout(languageDropdownHoverTimeout);
		languageDropdownOpen = isOpen;
	}
	
	function setSettingsDropdownOpen(isOpen) {
		settingsDropdownOpen = isOpen;
	}
	

</script>

<div class="space-y-4 px-2 sm:px-0 max-w-screen-lg mx-auto pb-[80px] md:pb-0">
	<!-- Site title and info at the top of the page -->
	<h1 class="text-3xl font-bold text-gray-900 mb-2 text-center max-w-2xl mx-auto">Translate to Multiple Languages at Once</h1>
	<p class="text-gray-600 max-w-2xl mx-auto text-center">Type your text below and instantly see translations in all your selected languages.</p>

	<!-- Desktop Input - Hidden on Mobile -->
	<div class="relative hidden md:block max-w-2xl mx-auto">
		<div class="flex items-center gap-2">
			<div class="relative flex-1 rounded-full overflow-hidden shadow-sm border border-gray-200">
				<div class="flex items-center">
					<Input 
						type="text" 
						placeholder="Enter text from any language..." 
						bind:value={text} 
						class="w-full border-0 focus:ring-0 rounded-full pl-4 pr-4 py-2.5 bg-white"
						onkeydown={(e) => e.key === 'Enter' && is_ready && handleSubmit()}
					/>
					
					<Button 
						onclick={handleSubmit}
						disabled={!is_ready}
						class="rounded-full p-2 mr-1 h-auto"
						variant={is_ready ? "default" : "ghost"}
						type="submit"
					>
						{#if is_loading}
							<div class="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-send"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
						{/if}
						<span class="sr-only">{is_loading ? 'Translating...' : 'Translate'}</span>
					</Button>
				</div>
			</div>
			
			<div class="flex items-center gap-1.5">
				<!-- Example button -->
				<button
					onclick={() => {
						text = getRandomExample();
						document.querySelector('input').focus();
					}}
					class="flex items-center justify-center h-10 w-10 rounded-full bg-purple-100 hover:bg-purple-200 transition-colors"
					title="Try an example"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-700"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
					<span class="sr-only">Try an example</span>
				</button>
				
				<!-- Languages Quick Access -->
				<a
					href="/languages"
					class="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
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
					
					{#if available_langs.length > 0}
						<div class="flex items-center gap-2">
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
								{#each Object.entries(user_langs) as [key, meta], index}
									<Badge
										variant={meta.display ? 'default' : 'outline'}
										class="cursor-pointer whitespace-nowrap text-xs px-2 py-0 h-6 {getLanguageColors(key, meta.display)}"
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
										{/if}
									</Badge>
								{/each}
							</div>
						</div>
					{/if}
				</div>
				
				<div class="flex items-center gap-2">
					<!-- Language visibility dropdown -->
					<DropdownMenu open={languageDropdownOpen} onOpenChange={setLanguageDropdownOpen} class="sm:hidden">
							<DropdownMenuTrigger class="flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100">
								<Eye class="h-4 w-4" />
								<span class="sr-only">Toggle language visibility</span>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="start" class="dropdown-menu-content">
								<DropdownMenuLabel>Visible Languages</DropdownMenuLabel>
								
								<!-- Language visibility toggles -->
								<div class="max-h-[200px] overflow-y-auto">
									{#each Object.entries(user_langs) as [key, meta]}
									  <div 
									    class="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground touch-item {getLanguageColors(key, meta.display, 'dropdown')}"
									    onclick={(e) => handleCheckboxClick(e, key)}
									  >
									    <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
									      {#if meta.display}
									        <Check class="h-4 w-4" />
									      {/if}
									    </span>
									    <span>{meta.native} ({key})</span>
									  </div>
									{/each}
								</div>
							</DropdownMenuContent>

					</DropdownMenu>
					
					<!-- Settings dropdown for translation review -->
					<DropdownMenu open={settingsDropdownOpen} onOpenChange={setSettingsDropdownOpen}>
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
								checked={truncate_lines}
								onCheckedChange={(value) => { truncate_lines = value; }}
							>
								Truncate Text
							</DropdownMenuCheckboxItem>
							<DropdownMenuCheckboxItem 
								checked={colors_enabled}
								onCheckedChange={(value) => { 
									colors_enabled = value; 
									if (browser) {
										localStorage.setItem('colorsEnabled', value);
									}
								}}
							>
								Enable Colors
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
			</div>
			
			<!-- Translation cards with improved responsive grid -->
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
				{#each history as translation, i}
					<div class="group w-full">
						<Card class="h-full hover:shadow-md transition-shadow">
							<CardContent class="p-3">
								<div class="relative">
									<div class="absolute right-0 top-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
										<button
											class="text-gray-400 hover:text-red-500 p-1"
											aria-label="Delete translation"
											onclick={() => deleteTranslation(i)}
										>
											<Trash2 class="h-3.5 w-3.5" />
										</button>
									</div>
									{#if show_original}
										<div class="text-sm font-medium text-gray-700 mb-3 pr-8 line-clamp-2" title={translation.text}>
											{translation.text}
										</div>
									{/if}
									{#each show_langs as lang}
										{#if translation.translations[lang]}
											<div class="group relative pl-2.5 border-l-2 border-gray-100 hover:border-blue-200 transition-colors mb-2 last:mb-0">
												<div class="text-sm {getLanguageColors(lang, true, 'dropdown')} pr-6 pt-0.5 {truncate_lines ? 'line-clamp-3' : ''}">
													{translation.translations[lang]}
												</div>
												<button
													class="absolute top-0 right-0 text-gray-400 hover:text-blue-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
													aria-label="Copy translation"
													onclick={() => copyToClipboard(translation.translations[lang])}
												>
													<Copy class="h-3 w-3" />
												</button>
											</div>
										{/if}
									{/each}
								</div>
							</CardContent>
						</Card>
					</div>
				{:else}
					<div class="col-span-1 sm:col-span-2 lg:col-span-3 p-8 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-xl">
						<div class="flex flex-col items-center gap-6 max-w-xl mx-auto">
							
							
							
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
								{#each exampleTranslations as example, exampleIndex}
									<div class="group w-full">
										<Card class="h-full hover:shadow-md transition-shadow">
											<CardContent class="p-3">
												<div class="relative">
													<div class="absolute right-0 top-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
														<button
															class="text-gray-400 hover:text-red-500 p-1"
															aria-label="Delete translation"
														>
															<Trash2 class="h-3.5 w-3.5" />
														</button>
													</div>
													<div class="text-sm font-medium text-gray-700 mb-3 pr-8 line-clamp-2">
														{example.text}
													</div>
													
													{#each Object.entries(example.translations) as [langCode, translation], i}
														{#if show_langs.includes(langCode)}
															<div class="group relative pl-2.5 border-l-2 border-gray-100 hover:border-blue-200 transition-colors mb-2 {i === Object.entries(example.translations).length - 1 ? 'last:mb-0' : ''}">
																<div class="text-sm {colorPalette[i % colorPalette.length].text} pr-6 pt-0.5 line-clamp-3">
																	{translation}
																</div>
																<button
																	class="absolute top-0 right-0 text-gray-400 hover:text-blue-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
																	aria-label="Copy translation"
																	onclick={() => copyToClipboard(translation)}
																>
																	<Copy class="h-3 w-3" />
																</button>
															</div>
														{/if}
													{/each}
												</div>
											</CardContent>
										</Card>
									</div>
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
<div class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-lg z-50">
	<div class="flex items-center gap-2 max-w-md mx-auto">
		<div class="relative flex-1 rounded-full overflow-hidden shadow-sm border border-gray-200">
			<div class="flex items-center">
				<Input 
					type="text" 
					placeholder="Enter text from any language..." 
					bind:value={text} 
					class="w-full border-0 focus:ring-0 rounded-full pl-4 pr-4 py-2.5 bg-white"
					onkeydown={(e) => e.key === 'Enter' && is_ready && handleSubmit()}
				/>
				
				<Button 
					onclick={handleSubmit}
					disabled={!is_ready}
					class="rounded-full p-2 mr-1 h-auto"
					variant={is_ready ? "default" : "ghost"}
					type="submit"
				>
					{#if is_loading}
						<div class="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-send"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
					{/if}
					<span class="sr-only">{is_loading ? 'Translating...' : 'Translate'}</span>
				</Button>
			</div>
		</div>
		
		<div class="flex items-center gap-1.5">
			<!-- Example button -->
			<button
				onclick={() => {
					text = getRandomExample();
					document.querySelector('input').focus();
				}}
				class="flex items-center justify-center h-10 w-10 rounded-full bg-purple-100 hover:bg-purple-200 transition-colors"
				title="Try an example"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-700"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
				<span class="sr-only">Try an example</span>
			</button>
			
			<!-- Languages Quick Access -->
			<a
				href="/languages"
				class="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
				title="Manage languages"
			>
				<Languages class="h-5 w-5 text-gray-700" />
				<span class="sr-only">Manage languages</span>
			</a>
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
		:global(button), :global(a) {
			min-height: 44px;
			min-width: 44px;
		}
		
		/* Ensure debug and settings buttons don't overlap with the input bar */
		:global(.fixed.bottom-4.right-4) {
			bottom: 80px !important; /* Move above the input bar */
		}
	}
</style>
