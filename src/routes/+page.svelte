<script>
  import { userStore } from '$lib/stores/user.svelte.js';
  import TranslationInput from '$jibs/TranslationInput.svelte';
  import TranslationResult from '$jibs/TranslationResult.svelte';
  import MultiLangCard from '$jibs/MultiLangCard.svelte';
  import { translationHistoryStore } from '$lib/stores/translationHistory.svelte.js';
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
      // Add to translation history
      translationHistoryStore.addTranslation({
        input: text,
        output: result,
        sourceLang: 'auto', // or set if you know the source
        targetLang: userStore.user.selectedLanguages,
        timestamp: Date.now()
      });
    } catch (e) {
      error = e.message || 'Unknown error';
    } finally {
      loading = false;
    }
  }
</script>

<h1>Translate</h1>
<TranslationInput bind:text {loading} onTranslate={handleTranslate} />
{#if error}
  <div class="text-red-600 mt-2">{error}</div>
{/if}
<TranslationResult {result} />
