<script>
import { getAllLanguages, getLanguageName, getEnglishName, searchLanguages, getLanguageInfo } from '$lib/utils/languages.js'
import { Button } from '$lib/components/ui/button'
import { Command } from '$lib/components/ui/command'
import { CommandInput } from '$lib/components/ui/command'

/** @type {import('./$types').PageData} */
const data = $props()

let searchQuery = $state("")
let nativeFirst = $state(false)
const filteredLanguages = $derived(searchLanguages(searchQuery, data.country))

function formatSpeakers(count) {
    if (!count) return ''
    return (count/1000).toFixed(0)
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

    <table class="w-full rounded-lg border bg-white">
        <thead>
            <tr class="border-b">
                <th class="w-16 whitespace-nowrap py-2 pl-3 pr-2 font-medium text-right">__</th>
                <th class="w-16 whitespace-nowrap py-2 pl-3 pr-2 font-medium text-right">___</th>
                <th class="w-16 whitespace-nowrap py-2 pl-3 pr-2 font-medium text-center"># M</th>
                <th class="max-w-[480px] whitespace-nowrap py-2 pl-2 pr-3 text-left font-medium">Name</th>
            </tr>
        </thead>
        <tbody class="divide-y">
            {#each filteredLanguages as code}
                {@const info = getLanguageInfo(code)}
                {@const inUserCountry = data.country && info?.countries?.includes(data.country)}
                <tr class:bg-blue-50={inUserCountry}>
                    <td class="w-16 whitespace-nowrap py-1.5 pl-3 pr-2 font-mono text-sm text-gray-600 text-right">{info?.iso1 || ''}</td>
                    <td class="w-16 whitespace-nowrap py-1.5 pl-3 pr-2 font-mono text-sm text-gray-600 text-right">{code}</td>
                    <td class="w-16 whitespace-nowrap py-1.5 pl-3 pr-2 font-mono text-sm text-gray-600 text-right">{formatSpeakers(info?.nativeSpeakers_k)}</td>
                    <td class="max-w-[480px] truncate py-1.5 pl-2 pr-3 text-sm">
                        {#if getLanguageName(code) === getEnglishName(code)}
                            {getLanguageName(code)}
                        {:else if nativeFirst}
                            {getLanguageName(code)} • {getEnglishName(code)}
                        {:else}
                            {getEnglishName(code)} • {getLanguageName(code)}
                        {/if}
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>
