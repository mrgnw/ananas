<script>
import { getAllLanguages, getLanguageName, getEnglishName, searchLanguages, getLanguageInfo } from '$lib/utils/languages.js'
import { Button } from '$lib/components/ui/button'
import { Command } from '$lib/components/ui/command'
import { CommandInput } from '$lib/components/ui/command'
import { Checkbox } from '$lib/components/ui/checkbox'

/** @type {import('./$types').PageData} */
const data = $props()

let searchQuery = $state("")
let nativeFirst = $state(false)
const filteredLanguages = $derived(searchLanguages(searchQuery, data.country))

// Load the current user_langs from localStorage
function loadUserLangs() {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem('user_langs');
    return stored ? JSON.parse(stored) : {};
}

let user_langs = $state(loadUserLangs());

function toggleLanguage(code, info) {
    if (user_langs[code]) {
        delete user_langs[code];
    } else {
        user_langs[code] = {
            label: getEnglishName(code),
            native: getLanguageName(code),
            rtl: false, // You might want to get this from language info
            display: true
        };
    }
    // Save to localStorage
    localStorage.setItem('user_langs', JSON.stringify(user_langs));
}

function isSelected(code) {
    return !!user_langs[code];
}

function formatSpeakers(count) {
    if (!count) return ''
    return (count/1000).toFixed(0)
}
</script>

<div class="mx-auto max-w-5xl px-4 py-8">
    <div class="mb-6 space-y-4">
        <h1 class="text-2xl font-bold">Language Settings</h1>
        <p class="text-sm text-gray-500">
            Select the languages you want to translate to. Changes are saved automatically.
        </p>
    </div>

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
                <th class="w-16 whitespace-nowrap py-2 pl-3 pr-2 font-medium text-center">Select</th>
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
                    <td class="w-16 whitespace-nowrap py-1.5 pl-3 pr-2 text-center">
                        <Checkbox 
                            checked={isSelected(code)}
                            onCheckedChange={() => toggleLanguage(code, info)}
                        />
                    </td>
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