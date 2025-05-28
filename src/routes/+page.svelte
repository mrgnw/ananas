<script>
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';
  import { userStore } from '$lib/stores/user.svelte.js';
  import { translationHistoryStore } from '$lib/stores/translationHistory.svelte.js';
  import TranslationInput from '$jibs/TranslationInput.svelte';
  import MultiLangCard from '$jibs/MultiLangCard.svelte';
  import { getEnglishName } from '$lib/utils/languages.js';
  import LanguageSuggestions from '$lib/components/LanguageSuggestions.svelte';

let result = $state(null); // Add result state to hold translation result
let { data } = $props();
let visibleItems = $state(new Set());

let userLanguages = $derived(userStore.user.selectedLanguages);

// Get last 3 translations from history - access the store directly
let recentTranslations = $derived(() => {
  return (translationHistoryStore.history.translations || []).slice(0, 3);
});

// Watch for new translations and make them visible immediately
$effect(() => {
  const currentTranslations = recentTranslations();
  currentTranslations.forEach(translation => {
    if (!visibleItems.has(translation.timestamp)) {
      // New translation detected, add it to visible items immediately
      visibleItems.add(translation.timestamp);
      visibleItems = new Set(visibleItems); // Trigger reactivity
    }
  });
});

onMount(async () => {
  // Load from database in background if user is authenticated
  if (userStore.user.auth.isAuthenticated) {
    await translationHistoryStore.loadFromDatabaseInBackground();
  }
  
  // Start showing recent translations with staggered timing
  setTimeout(() => {
    const recentItems = (translationHistoryStore.history.translations || []).slice(0, 3);
    recentItems.forEach((item, index) => {
      setTimeout(() => {
        visibleItems.add(item.timestamp);
        visibleItems = new Set(visibleItems); // Trigger reactivity
      }, index * 120);
    });
  }, 300);
});
</script>

  <!-- <pre><code>{JSON.stringify(allSuggestions, null, 2)}</code></pre>
  •
  <pre><code>{JSON.stringify(suggestionsToShow, null, 2)}</code></pre> -->
  <main class="translate-main">
      <TranslationInput
          bind:result
      />
      <div class="target-langs-list">
      {#if userLanguages.length}
        {#each userLanguages as code, i}
          <span >{getEnglishName(code)}</span>{#if i < userLanguages.length - 1}<span class="lang-sep">·</span>{/if}
        {/each}
      {/if}
    </div>
    

    <LanguageSuggestions countryCode={data.ip_country} />
      
    <!-- Recent Translations -->
    {#if translationHistoryStore.history.translations && translationHistoryStore.history.translations.length > 0}
      <div class="recent-translations-section">
        <div class="recent-translations-grid">
          {#each translationHistoryStore.history.translations.slice(0, 3).filter(translation => visibleItems.has(translation.timestamp)) as translation, index (translation.timestamp)}
            <div 
              class="recent-translation-item" 
              animate:flip={{ duration: 400 }}
              in:fade={{ duration: 400 }}
            >
              <MultiLangCard 
                translation={{ translations: translation.output }} 
                show_langs={true}
                onDelete={() => translationHistoryStore.removeTranslation(index)}
                truncate_lines={true}
                timestamp={translation.timestamp}
                originalText={translation.input}
              />
            </div>
          {/each}
        </div>
        {#if visibleItems.size > 0}
          <div class="view-all-link">
            <a href="/review" class="view-all-btn">View All Translations →</a>
          </div>
        {/if}
      </div>
    {/if}

  </main>

  <style>
  .centered-result {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    width: 100%;
  }
  .target-langs-list {
    font-family: sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5em;
    margin-top: 0.3em;
    margin-bottom: 0.5em;
    font-size: 0.8em;
    color: rgba(0, 0, 0, 0.4);
    max-width: 500px;
    flex-wrap: wrap;
    word-break: break-word;
    margin-left: auto;
    margin-right: auto;
  }

  /* Recent Translations Section */
  .recent-translations-section {
    margin-top: 3rem;
    padding: 0 1rem;
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
  }

  .recent-translations-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 1rem;
    text-align: center;
  }

  .recent-translations-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .recent-translation-item {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: box-shadow 0.15s ease;
    overflow: visible;
  }

  .recent-translation-item:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .view-all-link {
    text-align: center;
    margin-top: 1rem;
  }

  .view-all-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: #f3f4f6;
    color: #374151;
    text-decoration: none;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.15s ease;
  }

  .view-all-btn:hover {
    background: #e5e7eb;
    text-decoration: none;
  }

  /* Responsive Design */
  @media (min-width: 768px) {
    .recent-translations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
    }
  }

  @media (min-width: 1024px) {
    .recent-translations-section {
      padding: 0 2rem;
    }
  }
  </style>