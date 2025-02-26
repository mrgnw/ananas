<script lang="ts">
	import {
		getAllLanguages,
		getLanguageName,
		getEnglishName,
		searchLanguages,
		getLanguageInfo,
		defaultLanguages,
		sortLanguages,
		getRecommendedLanguages
	} from '$lib/utils/languages.js';
	import { translateLanguages } from '$lib/stores/translateLanguages.svelte.js';
	import { Button } from '$lib/components/ui/button';
	import { Command } from '$lib/components/ui/command';
	import { CommandInput } from '$lib/components/ui/command';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
		DropdownMenuSeparator
	} from '$lib/components/ui/dropdown-menu';
	import type { PageData } from './$types';
	import type { Language } from '$lib/types';
	import { fade } from 'svelte/transition';
	import m2mSupport from '$lib/data/m2m-support.json';
	import wikidataLanguages from '$lib/data/wikidata-languages.json';
	import { Palmtree } from 'lucide-svelte';

	const data = $props<PageData>();
	
	let searchQuery = $state('');
	let nativeFirst = $state(false);

	// Get all languages and sort them based on user's country
	let allLanguages = $state(data.languages || []);
	let filteredLanguages = $derived(searchLanguages(searchQuery, data.country));
	let recommendedLanguages = $derived(data.country ? getRecommendedLanguages(data.country) : []);

	let stats = $derived({
		total: allLanguages.length,
		filtered: filteredLanguages.length,
		recommended: recommendedLanguages.length,
		country: data.country
	});

	let sortedLanguages = $derived(() => {
		// Get base list of languages
		const languages = searchQuery ? filteredLanguages : allLanguages;
		
		// Sort languages with recommendations first, then by other criteria
		return [...languages].sort((a, b) => {
			// First priority: selected languages
			const aSelected = isSelected(a.code);
			const bSelected = isSelected(b.code);
			if (aSelected !== bSelected) {
				return aSelected ? -1 : 1;
			}

			// Second priority: recommended languages
			const aRecommended = recommendedLanguages.includes(a.code);
			const bRecommended = recommendedLanguages.includes(b.code);
			if (aRecommended !== bRecommended) {
				return aRecommended ? -1 : 1;
			}

			// Third priority: supported by M2M
			const aSupported = isM2MSupported(a.code);
			const bSupported = isM2MSupported(b.code);
			if (aSupported !== bSupported) {
				return aSupported ? -1 : 1;
			}

			// Fourth priority: number of speakers
			const aInfo = getLanguageInfo(a.code);
			const bInfo = getLanguageInfo(b.code);
			const aSpeakers = aInfo?.nativeSpeakers_k || 0;
			const bSpeakers = bInfo?.nativeSpeakers_k || 0;
			if (aSpeakers !== bSpeakers) {
				return bSpeakers - aSpeakers;
			}

			// Finally: alphabetical by name
			return (aInfo?.name || '').localeCompare(bInfo?.name || '');
		});
	});

	let languageStats = $derived({
		total: allLanguages.length,
		country: data.country
	});

	let recommendedCount = $derived(recommendedLanguages.length);

	let filteredCount = $derived(filteredLanguages.length);

	let iso3ToIso2Map = $state(
		wikidataLanguages.reduce((acc, lang) => {
			if (lang.iso && lang.iso1) {
				acc[lang.iso] = lang.iso1;
			}
			return acc;
		}, {})
	);

	function toggleLanguage(code: string) {
		if (isSelected(code)) {
			translateLanguages.removeLanguage(code);
		} else {
			translateLanguages.addLanguage(code, {
				label: getEnglishName(code),
				native: getLanguageName(code),
				rtl: false, // You might want to get this from language info
				display: true
			});
		}
	}

	function isSelected(code: string) {
		return translateLanguages.selectedCodes.includes(code);
	}

	function formatSpeakers(count: number | undefined) {
		if (!count) return '';
		return (count / 1000).toFixed(0);
	}

	function formatName(lang: Language) {
		const name = getEnglishName(lang.code);
		const nativeName = getLanguageName(lang.code);
		return name === nativeName ? name : `${name} • ${nativeName}`;
	}

	function isM2MSupported(code: string) {
		// Use proper mapping from wikidata
		const code2 = iso3ToIso2Map[code];
		return code2 && code2 in m2mSupport;
	}

	function resetLanguages() {
		translateLanguages.resetToDefaults();
	}

	function clearAllLanguages() {
		translateLanguages.clearLanguages();
	}

	function addDefaultLanguages() {
		translateLanguages.addDefaultLanguages();
	}

	function clearLocalStorageCache() {
		if (typeof window !== 'undefined') {
			localStorage.clear();
			alert('Local storage cache cleared! The page will now reload.');
			// Reload the page to reinitialize everything
			window.location.reload();
		}
	}
</script>

<div class="container mx-auto p-4" in:fade>
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a
				href="/"
				class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
			>
				<Palmtree class="mr-2 h-4 w-4" />
				Back
			</a>
			<h1 class="text-2xl font-bold">Languages</h1>
		</div>
	</div>

	{#if recommendedLanguages.length > 0}
		<div class="mb-6">
			<h2 class="text-xl font-semibold mb-3">Recommended for your region</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{#each recommendedLanguages as code}
					{@const info = getLanguageInfo(code)}
					{#if info}
						<div class="flex items-center space-x-2">
							<Checkbox
								checked={$translateLanguages.includes(code)}
								onCheckedChange={(checked) => {
									if (checked) {
										$translateLanguages = [...$translateLanguages, code];
									} else {
										$translateLanguages = $translateLanguages.filter((l) => l !== code);
									}
								}}
							/>
							<label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
								{info.name} ({info.native})
							</label>
						</div>
					{/if}
				{/each}
			</div>
		</div>
	{/if}

	<div class="space-y-4">
		<div class="mb-6">
			<input
				type="text"
				placeholder="Search languages..."
				bind:value={searchQuery}
				class="w-full rounded border p-2"
			/>
		</div>

		<div class="flex justify-center">
			<table class="w-[48rem] border-collapse bg-white">
				<thead class="border-b bg-gray-50">
					<tr>
						<th class="w-12 px-2 py-1.5 text-center">
							<Checkbox />
						</th>
						<th class="w-24 px-2 py-1.5 text-center font-mono text-sm text-gray-600">Speakers (M)</th>
						<th class="w-20 px-2 py-1.5 text-center font-mono text-sm text-gray-600">Code</th>
						<th class="px-2 py-1.5 text-left text-sm text-gray-600">Name</th>
					</tr>
				</thead>
				<tbody class="divide-y">
					{#each sortedLanguages as lang}
						{@const info = getLanguageInfo(lang.code)}
						{@const inUserCountry = data.country && info?.countries?.includes(data.country)}
						{@const supported = isM2MSupported(lang.code)}
						<tr class="hover:bg-gray-50" class:bg-blue-50={inUserCountry}>
							<td class="px-2 py-1.5 text-center">
								<Checkbox
									checked={isSelected(lang.code)}
									onCheckedChange={() => toggleLanguage(lang.code)}
								/>
							</td>
							<td class="px-2 py-1.5 text-center font-mono" class:text-gray-400={!supported}
								>{formatSpeakers(info?.nativeSpeakers_k)}</td
							>
							<td class="px-2 py-1.5 text-center font-mono" class:text-gray-400={!supported}
								>{lang.code}</td
							>
							<td class="px-2 py-1.5 text-left" class:text-gray-400={!supported}
								>{formatName(lang)}</td
							>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<style>
	.languages {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
	}

	label {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
</style>
