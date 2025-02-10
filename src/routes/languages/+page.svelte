<script>
import { getAllLanguages, getLanguageName, getEnglishName, searchLanguages } from '$lib/utils/languages.js'
import { Input } from '$lib/components/ui/input'
import { Search } from 'lucide-svelte'

let searchQuery = $state("")
const filteredLanguages = $derived(searchLanguages(searchQuery))
</script>

<div class="container mx-auto h-full overflow-y-auto p-4">
    <h1 class="mb-4 text-2xl font-bold">Available Languages</h1>
    
    <div class="relative mb-4">
        <Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input 
            type="search"
            placeholder="Search languages by name or code..." 
            class="pl-10"
            bind:value={searchQuery}
        />
    </div>

    <table class="w-full rounded-lg border bg-white">
        <thead>
            <tr class="border-b">
                <th class="whitespace-nowrap py-2 pl-3 pr-2 text-left font-medium">Code</th>
                <th class="whitespace-nowrap py-2 pl-2 pr-3 text-left font-medium">Name</th>
            </tr>
        </thead>
        <tbody class="divide-y">
            {#each filteredLanguages as lang}
                <tr>
                    <td class="w-[4ch] whitespace-nowrap py-1.5 pl-3 pr-2 font-mono text-sm text-gray-600">{lang}</td>
                    <td class="py-1.5 pl-2 pr-3 text-sm">
                        {#if getLanguageName(lang) === getEnglishName(lang)}
                            {getLanguageName(lang)}
                        {:else}
                            {getEnglishName(lang)} • {getLanguageName(lang)}
                        {/if}
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>
