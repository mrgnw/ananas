<script>
  import { onMount } from 'svelte';
  import { translationHistoryStore } from '$lib/stores/translationHistory.svelte.js';
  import { userStore } from '$lib/stores/user.svelte.js';
  import MultiLangCard from '$jibs/MultiLangCard.svelte';
  
  let history = translationHistoryStore.history;
  
  onMount(() => {
    // If the user is authenticated, load translations from the database
    if (userStore.user.auth.isAuthenticated) {
      translationHistoryStore.loadFromDatabase();
    }
  });
</script>

{#if history.loading}
  <div class="loading-container">
    <div class="loading-spinner"></div>
    <p>Loading translation history...</p>
  </div>
{:else if history.translations.length === 0}
  <p>No translations yet.</p>
{:else}
  <ul class="history-list">
    {#each history.translations.slice(0, 20) as item, i}
      <li class="history-card group">
        <MultiLangCard translation={{ translations: item.output }} />
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
        {#if i < history.translations.slice(0, 20).length - 1}
          <div class="history-separator" aria-hidden="true"></div>
        {/if}
      </li>
    {/each}
  </ul>
{/if}

<style>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 2rem 0;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(55, 48, 163, 0.3);
  border-radius: 50%;
  border-top-color: #3730a3;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}
.history-card {
  border: none;
  border-radius: 0;
  padding: 0.5em 0 0.5em 0;
  background: none;
  position: relative;
  transition: none;
  box-shadow: none;
  overflow: visible;
  min-height: 2.2em;
}
.history-separator {
  height: 1px;
  background: #ececec;
  margin: 0.5em 0 0 0;
  width: 100%;
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
  padding: 0.3em 0.2em;
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
