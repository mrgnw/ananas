<script>
  import { onMount } from 'svelte';
  import { userStore } from '$lib/stores/user.svelte.js';
  import { translationHistoryStore } from '$lib/stores/translationHistory.svelte.js';
  import TranslationInput from '$jibs/TranslationInput.svelte';
  import { getEnglishName } from '$lib/utils/languages.js';
  import LanguageSuggestions from '$lib/components/LanguageSuggestions.svelte';
  import TranslatorLayout from '$lib/components/layout/TranslatorLayout.svelte';
  import TranslationHistory from '$lib/components/layout/TranslationHistory.svelte';
  import TranslationHistoryGrid from '$lib/components/translation/TranslationHistoryGrid.svelte';

let result = $state(null);
let { data } = $props();
let hasLoadedInitialAnimations = $state(false);

let userLanguages = $derived(userStore.user.selectedLanguages);

onMount(async () => {
  // Load from database in background if user is authenticated
  if (userStore.user.auth.isAuthenticated) {
    await translationHistoryStore.loadFromDatabaseInBackground();
  }
  
  // Start initial load animations with stagger
  setTimeout(() => {
    hasLoadedInitialAnimations = true;
  }, 300);
});
</script>

<!-- <pre><code>{JSON.stringify(allSuggestions, null, 2)}</code></pre>
•
<pre><code>{JSON.stringify(suggestionsToShow, null, 2)}</code></pre> -->

<TranslatorLayout>
  <!-- Input section -->
  <section class="input-section">
    <div class="target-langs-list">
      {#if userLanguages.length}
        {#each userLanguages as code, i}
          <span>{getEnglishName(code)}</span>{#if i < userLanguages.length - 1}<span class="lang-sep">·</span>{/if}
        {/each}
      {/if}
    </div>
    <div class="input-container">
      <TranslationInput bind:result />
    </div>
  </section>

  <!-- History section -->
  <TranslationHistory>
    <LanguageSuggestions countryCode={data.ip_country} />
    <TranslationHistoryGrid bind:hasLoadedInitialAnimations />
  </TranslationHistory>
</TranslatorLayout>

<style>
  /* Input Section */
  .input-section {
    padding: 1rem;
    max-width: 520px;
    margin: 0 auto;
    width: 100%;
  }

  .input-container {
    width: 100%;
  }

  .target-langs-list {
    font-family: sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5em;
    margin-bottom: 0.75em;
    font-size: 0.8em;
    color: rgba(0, 0, 0, 0.4);
    flex-wrap: wrap;
    word-break: break-word;
  }

  /* Desktop Layout */
  @media (min-width: 768px) {
    .input-section {
      padding: 2rem 2rem 1rem 2rem;
      margin-top: 1rem;
    }
  }

  /* Large Desktop */
  @media (min-width: 1024px) {
    .input-section {
      padding: 2rem 3rem 1rem 3rem;
    }
  }

  /* Mobile Layout */
  @media (max-width: 767px) {
    .input-section {
      order: 2;
      background: white;
      border-top: 1px solid #f1f5f9;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
      z-index: 50;
      padding: 1rem 0.75rem;
      margin: 0;
      max-width: none;
      touch-action: manipulation;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }

    .target-langs-list {
      font-size: 0.75em;
      margin-bottom: 0.5em;
    }
  }
</style>