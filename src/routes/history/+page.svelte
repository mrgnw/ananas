<script>
  import { translationHistoryStore } from '$lib/stores/translationHistory.svelte.js';
  import MultiLangCard from '$jibs/MultiLangCard.svelte';
  let history = translationHistoryStore.history;
</script>

{#if history.translations.length === 0}
  <p>No translations yet.</p>
{:else}
  <ul class="space-y-4">
    {#each history.translations as item, i}
      <li class="border rounded p-4 bg-white">
        <div class="text-xs text-gray-500 mb-2">{new Date(item.timestamp).toLocaleString()}</div>
        <div class="mb-1"><strong>Input:</strong> {item.input}</div>
        <MultiLangCard translation={{ translations: item.output }} />
        <div class="text-xs mt-2 text-gray-500 flex flex-wrap gap-2 items-center">
          <span>Target:</span>
          {#each (Array.isArray(item.targetLang) ? item.targetLang : [item.targetLang]) as lang}
            {#if item.output && item.output[lang] !== undefined}
              <span>{lang}</span>
            {:else}
              <span style="color: maroon;">{lang}</span>
            {/if}
          {/each}
        </div>
      </li>
    {/each}
  </ul>
{/if}
