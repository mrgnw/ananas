<script>
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';
  import { tick } from 'svelte';
  import { translationHistoryStore } from '$lib/stores/translationHistory.svelte.js';
  import TranslationCard from './TranslationCard.svelte';

  let { hasLoadedInitialAnimations = $bindable(false) } = $props();

  let gridContainer = $state();
  let previousTranslationCount = $state(0);

  // Get last 6 translations from history
  let recentTranslations = $derived(() => {
    return (translationHistoryStore.history.translations || []).slice(0, 6);
  });

  // Watch for new translations and scroll to show the newest one
  $effect(() => {
    const currentCount = recentTranslations().length;
    
    // If we have a new translation (count increased) and we're past initial load
    if (currentCount > previousTranslationCount && previousTranslationCount > 0 && gridContainer) {
      // Wait for DOM update and flip animation to start
      tick().then(() => {
        // Multiple attempts to ensure we scroll after content is fully rendered
        const scrollToNewItem = () => {
          const scrollContainer = gridContainer.closest('.translation-history');
          console.log('Scroll container found:', scrollContainer);
          console.log('Current scrollHeight:', scrollContainer?.scrollHeight);
          console.log('Current scrollTop:', scrollContainer?.scrollTop);
          console.log('Window width:', window.innerWidth);
          
          if (scrollContainer) {
            if (window.innerWidth <= 767) {
              // On mobile: FORCE scroll to bottom since newest items appear at bottom due to column-reverse
              const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
              console.log('Forcing scroll to:', maxScroll);
              
              // Try both methods
              scrollContainer.scrollTop = maxScroll;
              scrollContainer.scrollTo({
                top: maxScroll,
                behavior: 'smooth'
              });
            } else {
              // On desktop: scroll to top since newest items appear at top
              scrollContainer.scrollTo({
                top: 0,
                behavior: 'smooth'
              });
            }
          }
        };

        // Try immediately, then again after animation delay
        scrollToNewItem();
        setTimeout(scrollToNewItem, 100);
        setTimeout(scrollToNewItem, 200);
      });
    }
    
    previousTranslationCount = currentCount;
  });
</script>

{#if translationHistoryStore.history.translations && translationHistoryStore.history.translations.length > 0}
  <div class="recent-translations-section">
    <div class="recent-translations-grid" bind:this={gridContainer}>
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
    touch-action: pan-y; /* Allow vertical scrolling */
    pointer-events: auto;
  }

  .recent-translation-item {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: box-shadow 0.15s ease;
    overflow: visible;
    touch-action: pan-y; /* Allow vertical scrolling through cards */
    -webkit-touch-callout: none;
    pointer-events: auto; /* Ensure touch events work properly */
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