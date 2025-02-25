<script lang="ts">
import { getAllLanguages, getLanguageName, getEnglishName, searchLanguages, getLanguageInfo } from '$lib/utils/languages.js'
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
let sortBy = $state<'code' | 'name' | 'nativeName' | 'selected' | 'speakers'>('code')
let sortDirection = $state<'asc' | 'desc'>('asc')

// Get all languages from your existing utils
let allLanguages = $state<Language[]>(getAllLanguages())

function toggleLanguage(code: string, info: ReturnType<typeof getLanguageInfo>) {
    if (translateLanguages.languages[code]) {
        translateLanguages.removeLanguage(code)
    } else {
        translateLanguages.addLanguage(code, {
            label: getEnglishName(code),
            native: getLanguageName(code),
            rtl: info?.rtl || false,
            display: true
        })
    }
}

function formatSpeakers(count: number | undefined) {
    if (!count) return ''
    return (count/1000).toFixed(0)
}

let filteredLanguages = $derived(searchLanguages(searchQuery, data.country))

let sortedLanguages = $derived([...filteredLanguages].sort((a, b) => {
    if (sortBy === 'selected') {
        const aSelected = translateLanguages.languages[a.code] ? 1 : 0
        const bSelected = translateLanguages.languages[b.code] ? 1 : 0
        return (aSelected - bSelected) * (sortDirection === 'asc' ? 1 : -1)
    }
    if (sortBy === 'speakers') {
        const aInfo = getLanguageInfo(a.code)
        const bInfo = getLanguageInfo(b.code)
        const aSpeakers = aInfo?.nativeSpeakers_k || 0
        const bSpeakers = bInfo?.nativeSpeakers_k || 0
        return (aSpeakers - bSpeakers) * (sortDirection === 'asc' ? 1 : -1)
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
        sortDirection = 'asc'
    }
}
</script>

<div class="mx-auto max-w-5xl px-4 py-8">
    <div class="mb-6 flex items-center justify-between gap-4">
        <Command class="w-96">
            <CommandInput 
                placeholder="Search languages..." 
                bind:value={searchQuery}
            />
        </Command>
        <Button variant="outline" on:click={() => nativeFirst = !nativeFirst}>
            {nativeFirst ? 'Show English first' : 'Show native first'}
        </Button>
    </div>

    <div class="overflow-x-auto">
        <table class="min-w-full bg-white rounded-lg border">
            <thead>
                <tr class="border-b">
                    <th class="cursor-pointer p-2" on:click={() => updateSort('selected')}>
                        ★ {sortBy === 'selected' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th class="cursor-pointer p-2 w-16 whitespace-nowrap text-right" on:click={() => updateSort('code')}>
                        Code {sortBy === 'code' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th class="cursor-pointer p-2 w-16 whitespace-nowrap text-right" on:click={() => updateSort('speakers')}>
                        # M {sortBy === 'speakers' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th class="cursor-pointer p-2 max-w-[480px] text-left" on:click={() => updateSort('name')}>
                        Name {sortBy === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>
                </tr>
            </thead>
            <tbody class="divide-y">
                {#each sortedLanguages as lang}
                    {@const info = getLanguageInfo(lang.code)}
                    {@const inUserCountry = data.country && info?.countries?.includes(data.country)}
                    <tr class:bg-blue-50={inUserCountry}>
                        <td class="p-2">
                            <Checkbox 
                                checked={translateLanguages.languages[lang.code] ? true : false}
                                onCheckedChange={() => toggleLanguage(lang.code, info)}
                            />
                        </td>
                        <td class="p-2 font-mono text-sm text-gray-600 text-right">{lang.code}</td>
                        <td class="p-2 font-mono text-sm text-gray-600 text-right">{formatSpeakers(info?.nativeSpeakers_k)}</td>
                        <td class="p-2 max-w-[480px] truncate text-sm">
                            {#if getLanguageName(lang.code) === getEnglishName(lang.code)}
                                {getLanguageName(lang.code)}
                            {:else if nativeFirst}
                                {getLanguageName(lang.code)} • {getEnglishName(lang.code)}
                            {:else}
                                {getEnglishName(lang.code)} • {getLanguageName(lang.code)}
                            {/if}
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>
