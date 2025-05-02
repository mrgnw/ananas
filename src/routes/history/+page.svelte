<script>
  import { translationHistoryStore } from '$lib/stores/translationHistory.svelte.js';
  import MultiLangCard from '$jibs/MultiLangCard.svelte';
  let history = translationHistoryStore.history;
</script>

<h1>Translation History</h1>
{#if history.translations.length === 0}
  <p>No translations yet.</p>
{:else}
  <ul class="space-y-4">
    {#each history.translations as item, i}
      <li class="border rounded p-4 bg-white">
        <div class="text-xs text-gray-500 mb-2">{new Date(item.timestamp).toLocaleString()}</div>
        <div><strong>Input:</strong> {item.input}</div>
        <MultiLangCard translation={{ translations: item.output }} />
        <div class="text-xs mt-2 text-gray-400">
          <span>Target: {Array.isArray(item.targetLang) ? item.targetLang.join(', ') : item.targetLang}</span>
        </div>
      </li>
    {/each}
  </ul>
{/if}
