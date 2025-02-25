<script lang="ts">
import { getAllLanguages, getLanguageName, getEnglishName, searchLanguages, getLanguageInfo, defaultLanguages } from '$lib/utils/languages.js'
import { translateLanguages } from '$lib/stores/translateLanguages.svelte.js'
import { Button } from '$lib/components/ui/button'
import { Command } from '$lib/components/ui/command'
import { CommandInput } from '$lib/components/ui/command'
import { Checkbox } from '$lib/components/ui/checkbox'
import type { PageData } from './$types'
import type { Language } from '$lib/types'
import { fade } from 'svelte/transition'

const data = $props<PageData>()

let searchQuery = $state("")
let nativeFirst = $state(false)
let sortBy = $state<'code' | 'name' | 'nativeName' | 'selected' | 'speakers'>('speakers')
let sortDirection = $state<'asc' | 'desc'>('desc')

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

let filteredLanguages = $derived(searchLanguages(searchQuery, data.country))

let sortedLanguages = $derived([...filteredLanguages].sort((a, b) => {
    if (sortBy === 'selected') {
        const aSelected = isSelected(a.code);
        const bSelected = isSelected(b.code);
        return sortDirection === 'asc' 
            ? Number(aSelected) - Number(bSelected)
            : Number(bSelected) - Number(aSelected);
    }
    
    const aValue = a[sortBy]
    const bValue = b[sortBy]
    const modifier = sortDirection === 'asc' ? 1 : -1
    return aValue > bValue ? modifier : -modifier
}))

function updateSort(field: typeof sortBy) {
    if (sortBy === field) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'
    } else {
        sortBy = field
        // Default to descending for speakers and selected
        sortDirection = (field === 'speakers' || field === 'selected') ? 'desc' : 'asc'
    }
}

function resetLanguages() {
    translateLanguages.clearLanguages()
    // Re-add default languages
    Object.entries(defaultLanguages).forEach(([code, info]) => {
        translateLanguages.addLanguage(code, info)
    })
}
</script>

<div class="container mx-auto p-4" in:fade>
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Languages</h1>
        <Button 
            variant="destructive"
            on:click={resetLanguages}
        >
            Reset to Defaults
        </Button>
    </div>
    
    <div class="mb-6">
        <input
            type="text"
            placeholder="Search languages..."
            bind:value={searchQuery}
            class="w-full p-2 border rounded"
        />
    </div>

    <div class="overflow-x-auto">
        <table class="min-w-full bg-white">
            <thead>
                <tr>
                    <th class="p-2">Select</th>
                    <th class="cursor-pointer p-2" on:click={() => updateSort('code')}>
                        Code {sortBy === 'code' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th class="cursor-pointer p-2" on:click={() => updateSort('name')}>
                        Name {sortBy === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th class="cursor-pointer p-2" on:click={() => updateSort('nativeName')}>
                        Native Name {sortBy === 'nativeName' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    {#if sortBy === 'speakers'}
                    <th class="cursor-pointer p-2" on:click={() => updateSort('speakers')}>
                        Speakers (M) {sortBy === 'speakers' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    {/if}
                </tr>
            </thead>
            <tbody>
                {#each sortedLanguages as lang}
                    {@const info = getLanguageInfo(lang.code)}
                    {@const inUserCountry = data.country && info?.countries?.includes(data.country)}
                    <tr class:bg-blue-50={inUserCountry}>
                        <td class="p-2">
                            <Checkbox 
                                checked={isSelected(lang.code)}
                                onCheckedChange={() => toggleLanguage(lang.code)}
                            />
                        </td>
                        <td class="p-2">{lang.code}</td>
                        <td class="p-2">{lang.name}</td>
                        <td class="p-2">{lang.nativeName}</td>
                        {#if sortBy === 'speakers'}
                        <td class="p-2">{formatSpeakers(info?.nativeSpeakers_k)}</td>
                        {/if}
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