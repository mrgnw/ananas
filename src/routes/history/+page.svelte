<script>
  import { translationHistoryStore } from '$lib/stores/translationHistory.svelte.js';
  import MultiLangCard from '$jibs/MultiLangCard.svelte';
  let history = translationHistoryStore.history;
</script>

{#if history.translations.length === 0}
  <p>No translations yet.</p>
{:else}
  <ul class="history-list">
    {#each history.translations.slice(0, 10) as item, i}
      <li class="history-card group">
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
        <div class="history-meta-float">
          <span class="history-input-integral">
            <span class="history-input-preview">{item.input.length > 60 ? item.input.slice(0, 60) + '…' : item.input}</span>
            <span class="history-input-full">{item.input}</span>
          </span>
          <span class="history-time-integral">
            <span class="history-date">{new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: '2-digit' })}</span>
            <span class="history-time">{new Date(item.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
          </span>
        </div>
      </li>
    {/each}
  </ul>
{/if}

<style>
.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.7em;
  margin: 0;
  padding: 0;
  list-style: none;
}
.history-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.7em;
  padding: 1.1em 1.2em 1.1em 1.2em;
  background: #fff;
  position: relative;
  transition: box-shadow 0.15s;
  box-shadow: 0 1px 4px 0 rgba(0,0,0,0.03);
  overflow: hidden;
}
.history-meta-float {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 1em;
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0.7em 1.2em;
  background: linear-gradient(0deg, rgba(255,255,255,0.97) 80%, rgba(255,255,255,0.2) 100%);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.18s;
  min-height: 1.2em;
}
.group:hover .history-meta-float,
.group:focus-within .history-meta-float {
  opacity: 1;
  pointer-events: auto;
}
.history-input-integral {
  max-width: 60%;
  font-size: 0.98em;
  color: #232323;
  user-select: text;
  font-family: inherit;
  display: inline-block;
  vertical-align: bottom;
}
.history-input-preview {
  display: inline;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.7;
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
.history-time-integral {
  font-size: 0.92em;
  color: #bdbdbd;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  display: inline-block;
  vertical-align: bottom;
}
.history-date {
  display: inline;
}
.history-time {
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
