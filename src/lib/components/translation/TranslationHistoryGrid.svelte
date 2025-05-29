<script>
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';
  import { translationHistoryStore } from '$lib/stores/translationHistory.svelte.js';
  import TranslationCard from './TranslationCard.svelte';

  let { hasLoadedInitialAnimations = $bindable(false) } = $props();

  // Get last 6 translations from history
  let recentTranslations = $derived(() => {
    return (translationHistoryStore.history.translations || []).slice(0, 6);
  });
</script>

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
          <TranslationCard 
            {translation}
            {index}
            onDelete={() => translationHistoryStore.removeTranslation(index)}
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

<style>
  .recent-translations-section {
    margin-top: 1rem;
  }

  .recent-translations-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    touch-action: manipulation;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  .recent-translation-item {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: box-shadow 0.15s ease;
    overflow: visible;
    touch-action: manipulation;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
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

  /* Desktop Layout */
  @media (min-width: 768px) {
    .recent-translations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
    }
  }

  /* Mobile Layout */
  @media (max-width: 767px) {
    .recent-translations-section {
      margin-top: 0.5rem;
    }

    .recent-translations-grid {
      display: flex;
      flex-direction: column-reverse;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
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