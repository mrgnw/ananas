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
      <li class="border rounded p-4 bg-white group relative">
        <span class="history-time-btn" tabindex="-1">
          <span class="history-date">{new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: '2-digit' })}</span>
          <span class="history-time">{new Date(item.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
        </span>
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

<style>
.history-time-btn {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  position: absolute;
  top: 0.7em;
  right: 1em;
  font-size: 0.92em;
  z-index: 2;
  opacity: 0.18;
  transition: opacity 0.18s;
  cursor: pointer;
  user-select: text;
  pointer-events: auto;
  display: flex;
  gap: 0.3em;
  align-items: center;
}
.group:hover .history-time-btn,
.group:focus-within .history-time-btn {
  opacity: 0.7;
}
.history-date {
  color: #6b7280;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  pointer-events: none;
  user-select: text;
  display: inline;
}
.history-time {
  color: #6b7280;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  pointer-events: none;
  user-select: text;
  display: none;
}
.group:hover .history-time,
.group:focus-within .history-time {
  display: inline;
}
.group:hover .history-date,
.group:focus-within .history-date {
  display: none;
}
</style>
