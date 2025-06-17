<script>
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';
  import { translationHistoryStore } from '$lib/stores/translationHistory.svelte.js';
  import { userStore } from '$lib/stores/user.svelte.js';
  import MultiLangCard from '$jibs/MultiLangCard.svelte';
  import PageWrapper from '$lib/components/layout/PageWrapper.svelte';
  
  let itemsToShow = $state(20);
  let isLoadingInBackground = $state(false);
  let newItemsCount = $state(0);
  let visibleItems = $state(new Set());
  
  let translationsToShow = $derived(() => {
    if (!translationHistoryStore.history.translations) return [];
    return translationHistoryStore.history.translations.slice(0, itemsToShow);
  });
  
  // Group translations by date for display
  let groupedTranslations = $derived(() => {
    const groups = new Map();
    
    translationsToShow().forEach(item => {
      const date = new Date(item.timestamp);
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      let groupKey;
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else {
        groupKey = date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey).push(item);
    });
    
    return groups;
  });
  
  onMount(async () => {
    // If the user is authenticated, load translations from the database in background
    if (userStore.user.auth.isAuthenticated) {
      isLoadingInBackground = true;
      const result = await translationHistoryStore.loadFromDatabaseInBackground();
      isLoadingInBackground = false;
      
      if (result.hasUpdates) {
        newItemsCount = result.newItems.length;
        // Reset count after 3 seconds
        setTimeout(() => {
          newItemsCount = 0;
        }, 3000);
      }
    }
    
    // Start showing items with staggered timing
    const startAnimations = () => {
      const allItems = translationsToShow();
      allItems.forEach((item, index) => {
        setTimeout(() => {
          visibleItems.add(item.timestamp);
          visibleItems = new Set(visibleItems); // Trigger reactivity
        }, index * 60);
      });
    };

    // Start animations after initial delay
    setTimeout(startAnimations, 200);

    // Debug info in console (development only)
    if (import.meta.env.DEV) {
      console.group('🔍 Review Page Debug Info');
      console.log('Total translations:', translationHistoryStore.history.translations?.length || 0);
      console.log('Translations to show:', translationsToShow().length);
      console.log('Loading in background:', isLoadingInBackground);
      console.log('User authenticated:', userStore.user.auth.isAuthenticated);
      if (translationHistoryStore.history.translations?.length > 0) {
        console.log('First translation:', translationHistoryStore.history.translations[0]);
      }
      console.groupEnd();
    }
  });
  
  function handleDelete(item, index) {
    translationHistoryStore.removeTranslation(item.id);
  }
  
  function loadMore() {
    itemsToShow += 20;
  }
</script>

<!-- Background loading indicator (subtle) -->
{#if isLoadingInBackground}
  <div class="background-loading-indicator" transition:fade={{ duration: 200 }}>
    <div class="background-spinner"></div>
    <span>Checking for updates...</span>
  </div>
{/if}

<!-- New items notification -->
{#if newItemsCount > 0}
  <div class="new-items-notification" transition:fade={{ duration: 300 }}>
    <span>✨ {newItemsCount} new translation{newItemsCount > 1 ? 's' : ''} added</span>
  </div>
{/if}

<PageWrapper>
  {#if translationsToShow().length === 0 && !translationHistoryStore.history.loading}
    <div class="empty-state">
      <p>No translations yet. Start translating to build your review collection!</p>
    </div>
  {:else}
    <!-- Grouped translations -->
    {#each [...groupedTranslations().entries()] as [groupKey, groupItems] (groupKey)}
      <div class="date-group" animate:flip={{ duration: 400 }}>
        <h3 class="date-group-header">{groupKey}</h3>
        <div class="translations-grid">
          {#each groupItems.filter(item => visibleItems.has(item.timestamp)) as item, i (item.timestamp)}
            <div 
              class="translation-item" 
              in:fade={{ duration: 400 }}
            >
              <!-- Translation card -->
              <div class="translation-card-wrapper">
                <MultiLangCard 
                  translation={{ translations: item.output }} 
                  show_langs={true}
                  onDelete={() => handleDelete(item, i)}
                  truncate_lines={true}
                  timestamp={item.timestamp}
                  originalText={item.input}
                  translationId={item.id}
                />
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/each}
    
    <!-- Load more button -->
    {#if translationHistoryStore.history.translations.length > itemsToShow}
      <div class="load-more-container">
        <button class="load-more-btn" onclick={loadMore}>
          Load more translations
        </button>
      </div>
    {/if}
  {/if}
</PageWrapper>

<style>
/* Loading and Empty States */
.background-loading-indicator {
  position: fixed;
  top: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(248, 250, 252, 0.95);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  font-size: 0.875rem;
  color: #64748b;
  z-index: 50;
}

.background-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(55, 48, 163, 0.2);
  border-radius: 50%;
  border-top-color: #3730a3;
  animation: spin 1s linear infinite;
}

.new-items-notification {
  position: fixed;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  font-size: 0.875rem;
  font-weight: 500;
  z-index: 50;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  margin: 3rem 1rem;
  color: #6b7280;
}

/* Date Groups */
.date-group {
  margin-bottom: 2rem;
}

.date-group-header {
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.translations-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Translation Items */
.translation-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.15s ease;
  overflow: visible;
  display: flex;
  flex-direction: column;
}

.translation-item:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.translation-card-wrapper {
  margin-bottom: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Load More */
.load-more-container {
  text-align: center;
  margin: 2rem 0;
}

.load-more-btn {
  padding: 0.75rem 1.5rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.15s ease;
}

.load-more-btn:hover {
  background: #e5e7eb;
}

/* Responsive Design */
@media (max-width: 640px) {
  .background-loading-indicator {
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.375rem 0.5rem;
    font-size: 0.8125rem;
  }
  
  .new-items-notification {
    top: 0.5rem;
    left: 0.5rem;
    right: 0.5rem;
    transform: none;
    text-align: center;
  }
}

@media (min-width: 768px) {
  .translations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
  }
}
</style>
