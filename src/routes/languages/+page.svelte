<script>
import { getAllLanguages, getLanguageName } from '$lib/utils/languages.js'

const languages = getAllLanguages()
</script>

<div class="container mx-auto h-full overflow-y-auto p-4">
    <h1 class="mb-4 text-2xl font-bold">Available Languages</h1>
    
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {#each languages as lang}
            <div class="rounded bg-white p-2 shadow">
                <span class="text-sm font-medium">{getLanguageName(lang)}</span>
                <span class="text-xs text-gray-500">({lang})</span>
            </div>
        {/each}
    </div>
</div>
