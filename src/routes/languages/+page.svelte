<script>
import { getAllLanguages, getLanguageName, searchLanguages } from '$lib/utils/languages.js'
import { Input } from '$lib/components/ui/input'
import { Search } from 'lucide-svelte'

let searchQuery = $state("")
const filteredLanguages = $derived(searchLanguages(searchQuery))
const languages = getAllLanguages()
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

    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {#each filteredLanguages as lang}
            <div class="rounded bg-white p-2 shadow">
                <span class="text-sm font-medium">{getLanguageName(lang)}</span>
                <span class="text-xs text-gray-500">({lang})</span>
            </div>
        {/each}
    </div>
</div>
