<script>
  import { userStore } from '$lib/stores/user.svelte.js';
  import MultiLangCard from '$jibs/MultiLangCard.svelte';
  let text = $state('');
  let result = $state(null);
  let loading = $state(false);
  let error = $state('');

  async function handleTranslate() {
    error = '';
    result = null;
    if (!text.trim()) return;
    if (!userStore.user.selectedLanguages.length) {
      error = 'Please select at least one language.';
      return;
    }
    loading = true;
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          tgt_langs: userStore.user.selectedLanguages
        })
      });
      if (!res.ok) throw new Error('API error');
      result = await res.json();
    } catch (e) {
      error = e.message || 'Unknown error';
    } finally {
      loading = false;
    }
  }
</script>

<h1>Translate</h1>
<form on:submit|preventDefault={handleTranslate}>
  <textarea bind:value={text} rows="3" class="w-full border rounded p-2" placeholder="Enter text to translate"></textarea>
  <button type="submit" class="mt-2 px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>
    {loading ? 'Translating...' : 'Translate'}
  </button>
</form>

{#if error}
  <div class="text-red-600 mt-2">{error}</div>
{/if}

{#if result}
  <h2 class="mt-4 text-lg font-bold">Results</h2>
  <MultiLangCard translation={{ translations: result }} />
  <ul class="mt-2 space-y-2">
    {#each Object.entries(result) as [key, value]}
      <li>
        <strong>{key}:</strong>
        {#if typeof value === 'object' && value !== null}
          <pre class="bg-gray-100 rounded p-2 text-xs overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>
        {:else}
          {value}
        {/if}
      </li>
    {/each}
  </ul>
{/if}
