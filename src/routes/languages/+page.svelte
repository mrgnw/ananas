<script>
import { getAllLanguages, getLanguageName, getEnglishName, searchLanguages } from '$lib/utils/languages.js'
import { Button } from '$lib/components/ui/button'
import { Command } from '$lib/components/ui/command'
import { CommandInput } from '$lib/components/ui/command'
import languageData from '$lib/data/wikidata-languages.json'

/** @type {import('./$types').PageData} */
const data = $props()

let searchQuery = $state("")
let nativeFirst = $state(false)
const filteredLanguages = $derived(searchLanguages(searchQuery, data.country))

function formatSpeakers(count) {
    if (!count) return ''
    if (count >= 1000000) return `${(count/1000000).toFixed(1)}M speakers`
    if (count >= 1000) return `${(count/1000).toFixed(1)}K speakers`
    return `${count} speakers`
}

function getLanguageInfo(code) {
    return languageData.find(l => l.iso === code)
}
</script>

<div class="mx-auto h-full max-w-lg overflow-y-auto p-4">
    <h1 class="mb-4 text-2xl font-bold">Available Languages</h1>
    
    <div class="mb-4 flex items-center gap-2">
        <Command class="flex-1">
            <CommandInput 
                placeholder="Search languages by name or code..."
                bind:value={searchQuery}
            />
        </Command>
        <Button variant="outline" on:click={() => nativeFirst = !nativeFirst}>
            {nativeFirst ? 'Native First' : 'English First'}
        </Button>
    </div>

    <table class="w-full rounded-lg border bg-white">
        <thead>
            <tr class="border-b">
                <th class="w-16 whitespace-nowrap py-2 pl-3 pr-2 text-left font-medium">Code</th>
                <th class="whitespace-nowrap py-2 pl-2 pr-3 text-left font-medium">Name</th>
                <th class="whitespace-nowrap py-2 pl-2 pr-3 text-right font-medium">Speakers</th>
            </tr>
        </thead>
        <tbody class="divide-y">
            {#each filteredLanguages as lang}
                {@const info = getLanguageInfo(lang)}
                {@const inUserCountry = data.country && info?.countries?.includes(data.country)}
                <tr class:bg-blue-50={inUserCountry}>
                    <td class="w-16 whitespace-nowrap py-1.5 pl-3 pr-2 font-mono text-sm text-gray-600">{lang}</td>
                    <td class="py-1.5 pl-2 pr-3 text-sm">
                        {#if getLanguageName(lang) === getEnglishName(lang)}
                            {getLanguageName(lang)}
                        {:else if nativeFirst}
                            {getLanguageName(lang)} • {getEnglishName(lang)}
                        {:else}
                            {getEnglishName(lang)} • {getLanguageName(lang)}
                        {/if}
                    </td>
                    <td class="whitespace-nowrap py-1.5 pl-2 pr-3 text-right text-sm text-gray-600">
                        {formatSpeakers(info?.nativeSpeakers_k)}
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>
