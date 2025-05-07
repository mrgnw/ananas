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
        <div class="history-input-integral">
          <span class="history-input-preview">{item.input.length > 60 ? item.input.slice(0, 60) + '…' : item.input}</span>
          <span class="history-input-full">{item.input}</span>
        </div>
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
        <span class="history-time-integral">
          <span class="history-date">{new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: '2-digit' })}</span>
          <span class="history-time">{new Date(item.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
        </span>
      </li>
    {/each}
  </ul>
{/if}

<style>
.history-time-integral {
  position: absolute;
  bottom: 0.7em;
  right: 1.2em;
  font-size: 0.92em;
  color: #bdbdbd;
  opacity: 0.10;
  pointer-events: none;
  user-select: text;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  transition: opacity 0.18s, color 0.18s;
  z-index: 1;
  display: flex;
  gap: 0.3em;
  align-items: center;
}
.group:hover .history-time-integral,
.group:focus-within .history-time-integral {
  opacity: 0.7;
  color: #6b7280;
}
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
.history-input-wrap {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 0.5em;
  font-size: 1em;
  color: #232323;
}
.history-input-label {
  font-weight: 500;
  color: #888;
  font-size: 0.98em;
}
.history-input-preview {
  color: #232323;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 18em;
  transition: opacity 0.18s;
  cursor: pointer;
  user-select: text;
}
.history-input-full {
  display: none;
  color: #232323;
  background: #f9fafb;
  border-radius: 0.4em;
  padding: 0.1em 0.5em;
  font-size: 0.98em;
  margin-left: 0.2em;
  word-break: break-word;
  user-select: text;
}
.group:hover .history-input-preview,
.group:focus-within .history-input-preview {
  display: none;
}
.group:hover .history-input-full,
.group:focus-within .history-input-full {
  display: inline;
}
.history-input-integral {
  position: absolute;
  left: 1.2em;
  bottom: 0.7em;
  max-width: 60%;
  font-size: 0.98em;
  color: #bdbdbd;
  opacity: 0.10;
  pointer-events: none;
  user-select: text;
  font-family: inherit;
  transition: opacity 0.18s, color 0.18s;
  z-index: 1;
  display: flex;
  gap: 0.3em;
  align-items: center;
}
.group:hover .history-input-integral,
.group:focus-within .history-input-integral {
  opacity: 0.8;
  color: #232323;
  pointer-events: auto;
}
.history-input-preview {
  display: inline;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 1;
  transition: opacity 0.18s;
}
.group:hover .history-input-preview,
.group:focus-within .history-input-preview {
  display: none;
}
.history-input-full {
  display: none;
  background: none;
  color: inherit;
  font-size: inherit;
  word-break: break-word;
  user-select: text;
}
.group:hover .history-input-full,
.group:focus-within .history-input-full {
  display: inline;
}
</style>
