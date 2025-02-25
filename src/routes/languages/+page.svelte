<script lang="ts">
import { getAllLanguages, getLanguageName, getEnglishName, searchLanguages, getLanguageInfo, defaultLanguages } from '$lib/utils/languages.js'
import { translateLanguages } from '$lib/stores/translateLanguages.svelte.js'
import { Button } from '$lib/components/ui/button'
import { Command } from '$lib/components/ui/command'
import { CommandInput } from '$lib/components/ui/command'
import { Checkbox } from '$lib/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "$lib/components/ui/dropdown-menu"
import type { PageData } from './$types'
import type { Language } from '$lib/types'
import { fade } from 'svelte/transition'
import m2mSupport from '$lib/data/m2m-support.json'
import wikidataLanguages from '$lib/data/wikidata-languages.json'

const data = $props<PageData>()

let searchQuery = $state("")
let nativeFirst = $state(false)

// Get all languages from your existing utils
let allLanguages = $state<Language[]>(getAllLanguages())

// Create mapping for converting 3-digit to 2-digit codes for m2m100 model compatibility
const iso3ToIso2Map = $state(wikidataLanguages.reduce((acc, lang) => {
  if (lang.iso && lang.iso1) {
    acc[lang.iso] = lang.iso1;
  }
  return acc;
}, {}))

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
    if (!count) return ''
    return (count/1000).toFixed(0)
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

let filteredLanguages = $derived(searchLanguages(searchQuery, data.country))

let sortedLanguages = $derived([...filteredLanguages].sort((a, b) => {
    const aSelected = isSelected(a.code);
    const bSelected = isSelected(b.code);
    
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return 0;
}))

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
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Languages</h1>
    </div>
    
    <div class="mb-6">
        <input
            type="text"
            placeholder="Search languages..."
            bind:value={searchQuery}
            class="w-full p-2 border rounded"
        />
    </div>

    <div class="flex justify-center">
        <table class="w-[48rem] border-collapse bg-white">
            <thead class="bg-gray-50 border-b">
                <tr>
                    <th class="py-1.5 px-2 w-12 text-center">
                        <Checkbox />
                    </th>
                    <th class="py-1.5 px-2 w-24 text-center font-mono text-sm text-gray-600">Speakers (M)</th>
                    <th class="py-1.5 px-2 w-20 text-center font-mono text-sm text-gray-600">Code</th>
                    <th class="py-1.5 px-2 text-left text-sm text-gray-600">Name</th>
                </tr>
            </thead>
            <tbody class="divide-y">
                {#each sortedLanguages as lang}
                    {@const info = getLanguageInfo(lang.code)}
                    {@const inUserCountry = data.country && info?.countries?.includes(data.country)}
                    {@const supported = isM2MSupported(lang.code)}
                    <tr class="hover:bg-gray-50" class:bg-blue-50={inUserCountry}>
                        <td class="py-1.5 px-2 text-center">
                            <Checkbox 
                                checked={isSelected(lang.code)}
                                onCheckedChange={() => toggleLanguage(lang.code)}
                            />
                        </td>
                        <td class="py-1.5 px-2 text-center font-mono" class:text-gray-400={!supported}>{formatSpeakers(info?.nativeSpeakers_k)}</td>
                        <td class="py-1.5 px-2 text-center font-mono" class:text-gray-400={!supported}>{lang.code}</td>
                        <td class="py-1.5 px-2 text-left" class:text-gray-400={!supported}>{formatName(lang)}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
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