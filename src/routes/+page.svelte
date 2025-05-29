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
let hasLoadedInitialAnimations = $state(false);

let userLanguages = $derived(userStore.user.selectedLanguages);

// Get last 3 translations from history - access the store directly
let recentTranslations = $derived(() => {
  return (translationHistoryStore.history.translations || []).slice(0, 6);
});

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
  
  <div class="layout-grid">
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

    <!-- Content section -->
    <main class="content-section">
      <LanguageSuggestions countryCode={data.ip_country} />
        
      <!-- Recent Translations -->
      {#if translationHistoryStore.history.translations && translationHistoryStore.history.translations.length > 0}
        <div class="recent-translations-section">
          <div class="recent-translations-grid">
            {#each recentTranslations() as translation, index (translation.timestamp)}
              <div 
                class="recent-translation-item" 
                animate:flip={{ duration: 400 }}
                in:fade={{ 
                  duration: hasLoadedInitialAnimations ? 300 : 400, 
                  delay: hasLoadedInitialAnimations ? 0 : index * 120 
                }}
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
          {#if recentTranslations().length > 0}
            <div class="view-all-link">
              <a href="/review" class="view-all-btn">View All Translations →</a>
            </div>
          {/if}
        </div>
      {/if}
    </main>
  </div>

  <style>
  /* Root Grid Layout */
  .layout-grid {
    min-height: 100vh;
    min-height: 100dvh;
    display: grid;
    max-width: 1200px;
    margin: 0 auto;
  }

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

  /* Content Section */
  .content-section {
    padding: 0 1rem 1rem 1rem;
    overflow-y: auto;
  }

  /* Recent Translations */
  .recent-translations-section {
    margin-top: 1rem;
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
    margin-bottom: 2rem;
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

  /* Desktop Layout - Top to Bottom Flow */
  @media (min-width: 768px) {
    .layout-grid {
      grid-template-rows: auto 1fr;
      gap: 1rem;
    }

    .input-section {
      padding: 2rem 2rem 1rem 2rem;
      margin-top: 1rem;
    }

    .content-section {
      padding: 0 2rem 2rem 2rem;
    }

    .recent-translations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
    }
  }

  /* Large Desktop */
  @media (min-width: 1024px) {
    .input-section {
      padding: 2rem 3rem 1rem 3rem;
    }

    .content-section {
      padding: 0 3rem 2rem 3rem;
    }
  }

  /* Mobile Layout - Bottom to Top Flow */
  @media (max-width: 767px) {
    .layout-grid {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      grid-template-rows: 1fr auto;
      gap: 0;
      touch-action: manipulation;
      /* Prevent mobile zoom and scroll issues */
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
      overscroll-behavior: contain;
    }

    .input-section {
      order: 2; /* Input at bottom */
      background: white;
      border-top: 1px solid #f1f5f9;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
      z-index: 50;
      padding: 1rem 0.75rem;
      margin: 0;
      max-width: none;
      touch-action: manipulation;
      /* Prevent zoom on input area */
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }

    .content-section {
      order: 1; /* Content at top */
      padding: 1rem 0.75rem 0.5rem 0.75rem;
      touch-action: manipulation;
      overflow-y: auto;
      /* Prevent zoom and selection on content area */
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
      overscroll-behavior: contain;
    }

    .target-langs-list {
      font-size: 0.75em;
      margin-bottom: 0.5em;
    }

    .recent-translations-section {
      margin-top: 0.5rem;
    }

    /* Reverse order - newest first (closest to input) */
    .recent-translations-grid {
      display: flex;
      flex-direction: column-reverse;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
      /* Prevent zoom on translation cards */
      touch-action: manipulation;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }

    .recent-translation-item {
      /* Prevent double-tap zoom on translation cards */
      touch-action: manipulation;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }

    /* Allow text selection inside translation content */
    .recent-translation-item .translation-text,
    .recent-translation-item [contenteditable] {
      -webkit-user-select: text;
      -moz-user-select: text;
      -ms-user-select: text;
      user-select: text;
    }

    /* Visual connection between newest translation and input */
    .recent-translation-item:last-child {
      position: relative;
    }

    .recent-translation-item:last-child::after {
      content: '';
      position: absolute;
      bottom: -0.25rem;
      left: 50%;
      transform: translateX(-50%);
      width: 2rem;
      height: 1px;
      background: linear-gradient(to right, transparent, #cbd5e1, transparent);
      opacity: 0.4;
    }

    /* Hide View All on mobile */
    .view-all-link {
      display: none;
    }
  }
  </style>