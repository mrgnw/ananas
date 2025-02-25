<script>
import { getAllLanguages, getLanguageName, getEnglishName, searchLanguages, getLanguageInfo } from '$lib/utils/languages.js'
import { translateLanguages } from '$lib/stores/translateLanguages.svelte.js'
import { Button } from '$lib/components/ui/button'
import { Command } from '$lib/components/ui/command'
import { CommandInput } from '$lib/components/ui/command'
import { Checkbox } from '$lib/components/ui/checkbox'

/** @type {import('./$types').PageData} */
const data = $props()

let searchQuery = $state("")
let nativeFirst = $state(false)
let sortBy = $state('code')
let sortDirection = $state('asc')

// Get all languages from your existing utils
let allLanguages = $state(getAllLanguages())

function toggleLanguage(code, info) {
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

function isSelected(code) {
    return code in translateLanguages.languages
}

function formatSpeakers(count) {
    if (!count) return ''
    return (count/1000).toFixed(0)
}

let filteredLanguages = $derived(searchLanguages(searchQuery, data.country))

let sortedLanguages = $derived([...filteredLanguages].sort((a, b) => {
    const aValue = a[sortBy]
    const bValue = b[sortBy]
    const modifier = sortDirection === 'asc' ? 1 : -1
    return aValue > bValue ? modifier : -modifier
}))

function updateSort(field) {
    if (sortBy === field) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'
    } else {
        sortBy = field
        sortDirection = 'asc'
    }
}
</script>

<div class="container mx-auto p-4" in:fade>
    <h1 class="text-3xl font-bold mb-6">Language Selection</h1>
    
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
                </tr>
            </thead>
            <tbody>
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
                        <td class="p-2">{lang.code}</td>
                        <td class="p-2">{lang.name}</td>
                        <td class="p-2">{lang.nativeName}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>