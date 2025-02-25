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

const data = $props<PageData>()

let searchQuery = $state("")
let nativeFirst = $state(false)

// Get all languages from your existing utils
let allLanguages = $state<Language[]>(getAllLanguages())

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
        <DropdownMenu>
            <DropdownMenuTrigger>
                <Button variant="outline" size="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem on:click={addDefaultLanguages}>
                    Add Default Languages
                </DropdownMenuItem>
                <DropdownMenuItem on:click={resetLanguages}>
                    Reset to Defaults
                </DropdownMenuItem>
                <DropdownMenuItem class="text-destructive" on:click={clearAllLanguages}>
                    Clear All Languages
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem class="text-destructive" on:click={clearLocalStorageCache}>
                    Clear Cache
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
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
                    <tr class="hover:bg-gray-50" class:bg-blue-50={inUserCountry}>
                        <td class="py-1.5 px-2 text-center">
                            <Checkbox 
                                checked={isSelected(lang.code)}
                                onCheckedChange={() => toggleLanguage(lang.code)}
                            />
                        </td>
                        <td class="py-1.5 px-2 text-center font-mono">{formatSpeakers(info?.nativeSpeakers_k)}</td>
                        <td class="py-1.5 px-2 text-center font-mono">{lang.code}</td>
                        <td class="py-1.5 px-2 text-left">{formatName(lang)}</td>
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