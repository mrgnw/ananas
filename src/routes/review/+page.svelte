<script>
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';
  import { translationHistoryStore } from '$lib/stores/translationHistory.svelte.js';
  import { userStore } from '$lib/stores/user.svelte.js';
  import MultiLangCard from '$jibs/MultiLangCard.svelte';
  import { Search, Calendar, Filter } from 'lucide-svelte';
  
  let searchQuery = $state('');
  let showFilters = $state(false);
  let selectedDateFilter = $state('all');
  let itemsToShow = $state(20);
  let isLoadingInBackground = $state(false);
  let newItemsCount = $state(0);
  
  // Filter and search logic
  let filteredTranslations = $derived(() => {
    if (!translationHistoryStore.history.translations) return [];
    
    let filtered = translationHistoryStore.history.translations;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.input.toLowerCase().includes(query) ||
        Object.values(item.output).some(translation => 
          translation.toLowerCase().includes(query)
        )
      );
    }
    
    // Apply date filter
    if (selectedDateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.timestamp);
        switch (selectedDateFilter) {
          case 'today':
            return itemDate >= today;
          case 'yesterday':
            return itemDate >= yesterday && itemDate < today;
          case 'week':
            return itemDate >= thisWeek;
          default:
            return true;
        }
      });
    }
    
    return filtered.slice(0, itemsToShow);
  });
  
  // Group translations by date for better organization
  let groupedTranslations = $derived(() => {
    const groups = new Map();
    
    filteredTranslations().forEach(item => {
      const date = new Date(item.timestamp);
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      let groupKey;
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else {
        groupKey = date.toLocaleDateString(undefined, { 
          weekday: 'long', 
          month: 'short', 
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

    // Debug info in console (development only)
    if (import.meta.env.DEV) {
      console.group('🔍 Review Page Debug Info');
      console.log('Total translations:', translationHistoryStore.history.translations?.length || 0);
      console.log('Filtered translations:', filteredTranslations().length);
      console.log('Loading in background:', isLoadingInBackground);
      console.log('User authenticated:', userStore.user.auth.isAuthenticated);
      if (translationHistoryStore.history.translations?.length > 0) {
        console.log('First translation:', translationHistoryStore.history.translations[0]);
      }
      console.groupEnd();
    }
  });
  
  function handleDelete(item, index) {
    translationHistoryStore.removeTranslation(index);
  }
  
  function loadMore() {
    itemsToShow += 20;
  }
  
  function clearSearch() {
    searchQuery = '';
  }
</script>

<!-- Page Header with Search and Filters -->
<div class="review-header">
  <div class="search-container">
    <div class="search-input-wrapper">
      <Search class="search-icon" size={16} />
      <input 
        type="text" 
        placeholder="Search translations..." 
        class="search-input"
        bind:value={searchQuery}
      />
      {#if searchQuery}
        <button class="clear-search" onclick={clearSearch}>×</button>
      {/if}
    </div>
  </div>
  
  <button 
    class="filter-toggle" 
    class:active={showFilters}
    onclick={() => showFilters = !showFilters}
    title="Filter translations"
  >
    <Filter size={16} />
  </button>
</div>

<!-- Filters Panel -->
{#if showFilters}
  <div class="filters-panel" transition:fade={{ duration: 200 }}>
    <label class="filter-label">
      <Calendar size={14} style="display: inline; margin-right: 0.25rem;" />
      Date Range
    </label>
    <div class="filter-options">
      <button 
        class="filter-option" 
        class:active={selectedDateFilter === 'all'}
        onclick={() => selectedDateFilter = 'all'}
      >
        All Time
      </button>
      <button 
        class="filter-option" 
        class:active={selectedDateFilter === 'today'}
        onclick={() => selectedDateFilter = 'today'}
      >
        Today
      </button>
      <button 
        class="filter-option" 
        class:active={selectedDateFilter === 'yesterday'}
        onclick={() => selectedDateFilter = 'yesterday'}
      >
        Yesterday
      </button>
      <button 
        class="filter-option" 
        class:active={selectedDateFilter === 'week'}
        onclick={() => selectedDateFilter = 'week'}
      >
        This Week
      </button>
    </div>
  </div>
{/if}

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

{#if filteredTranslations().length === 0 && !translationHistoryStore.history.loading}
  <div class="empty-state">
    {#if searchQuery}
      <p>No translations found for "{searchQuery}"</p>
      <button class="clear-search-btn" onclick={clearSearch}>Clear search</button>
    {:else}
      <p>No translations yet. Start translating to build your review collection!</p>
    {/if}
  </div>
{:else}
  <!-- Grouped translations -->
  {#each [...groupedTranslations().entries()] as [groupKey, groupItems] (groupKey)}
    <div class="date-group" animate:flip={{ duration: 400 }}>
      <h3 class="date-group-header">{groupKey}</h3>
      <div class="translations-grid">
        {#each groupItems as item, i (item.timestamp)}
          <div 
            class="translation-item" 
            animate:flip={{ duration: 400 }}
            in:fade={{ duration: 300, delay: i * 50 }}
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

<style>
/* Header and Search */
.review-header {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0 0.5rem;
}

.search-container {
  flex: 1;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  color: #6b7280;
  pointer-events: none;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.25rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  transition: border-color 0.15s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3730a3;
  box-shadow: 0 0 0 3px rgba(55, 48, 163, 0.1);
}

.clear-search {
  position: absolute;
  right: 0.5rem;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
}

.filter-toggle {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-toggle:hover,
.filter-toggle.active {
  background: #f3f4f6;
  color: #374151;
}

/* Filters Panel */
.filters-panel {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 0 0.5rem 1rem;
}

.filter-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.filter-options {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-option {
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  background: white;
  color: #6b7280;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-option:hover {
  background: #f3f4f6;
}

.filter-option.active {
  background: #3730a3;
  color: white;
  border-color: #3730a3;
}

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

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 3rem 0;
  color: #6b7280;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(55, 48, 163, 0.3);
  border-radius: 50%;
  border-top-color: #3730a3;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 0.75rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  margin: 3rem 1rem;
  color: #6b7280;
}

.clear-search-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #3730a3;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
}

/* Date Groups */
.date-group {
  margin-bottom: 1rem;
}

.date-group-header {
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0.25rem;
  padding-bottom: 0.1875rem;
  border-bottom: 2px solid #e5e7eb;
}

.translations-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Translation Items */
.translation-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0rem;
  margin: 0 0.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.15s ease;
  overflow: visible;
}

.translation-item:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.translation-card-wrapper {
  margin-bottom: 0;
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

@media (min-width: 640px) {
  .review-header {
    padding: 0 1rem;
  }
  
  .filters-panel {
    margin: 0 1rem 1rem;
  }
  
  .translation-item {
    margin: 0 1rem;
  }
  
  .date-group-header {
    margin-left: 1rem;
  }
}

@media (min-width: 768px) {
  .translations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
  }
  
  .translation-item {
    margin: 0;
  }
}

@media (min-width: 1024px) {
  .review-header {
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .filters-panel {
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
    margin-bottom: 1rem;
  }
  
  .date-group {
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
    margin-bottom: 2rem;
  }
  
  .date-group-header {
    margin-left: 0;
  }
}
</style>
