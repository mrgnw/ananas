<script>
  import { userStore } from '$lib/stores/user.svelte.js';
  import { getLanguageSuggestions } from '$lib/utils/languageSuggestions.ts';
  import { onMount } from 'svelte';

  let { countryCode } = $props();

  // Simple reactive state for suggestions
  let allSuggestions = $state([]);

  // Load suggestions on component mount
  onMount(() => {
    console.log('LanguageSuggestions onMount with countryCode:', countryCode);
    allSuggestions = getLanguageSuggestions(countryCode);
    console.log('Loaded suggestions:', allSuggestions);
  });

  // Derive user languages
  let userLanguages = $derived(userStore.user.selectedLanguages);

  // Derive suggestions to show (excluding already selected languages)
  let suggestionsToShow = $derived.by(() => {
    console.log('🔄 suggestionsToShow derived running');
    console.log('Data:', {
      allSuggestions,
      allSuggestionsLength: allSuggestions.length,
      userLanguages,
      userLanguagesLength: userLanguages.length
    });
    
    if (allSuggestions.length === 0) {
      console.log('No allSuggestions yet, returning empty array');
      return [];
    }
    
    const filtered = allSuggestions.filter(s => {
      const isIncluded = userLanguages.includes(s.code);
      console.log(`Filtering: ${s.code} already selected? ${isIncluded}`);
      return !isIncluded;
    });
    
    console.log('🎯 Final suggestionsToShow:', filtered);
    return filtered.slice(0, 4);
  });
</script>

{#if userLanguages.length === 0 && suggestionsToShow.length > 0}
  <div class="language-suggestions">
    <div class="suggestions-header">
      <span class="suggestions-title">Get started with these languages:</span>
    </div>
    <div class="suggestions-buttons">
      {#each suggestionsToShow as suggestion}
        <button 
          class="suggestion-btn"
          onclick={() => userStore.addLanguage(suggestion.code)}
          title="Add {suggestion.name}"
        >
          <span class="suggestion-name">{suggestion.name}</span>
          {#if suggestion.reason === 'primary'}
            <span class="suggestion-badge">Your language</span>
          {:else if suggestion.reason === 'country_primary'}
            <span class="suggestion-badge">Local</span>
          {/if}
        </button>
      {/each}
    </div>
    <div class="suggestions-footer">
      <a href="/languages" class="browse-all-link">Browse all languages →</a>
    </div>
  </div>
{:else if userLanguages.length === 0}
  <div class="language-suggestions-debug">
    <p>Debug: No suggestions to show. User has {userLanguages.length} languages. Country: {countryCode || 'none'}. All suggestions: {allSuggestions.length}</p>
  </div>
{/if}

<style>
  .language-suggestions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    max-width: 480px;
    margin: 0 auto;
  }

  .suggestions-title {
    font-size: 0.95rem;
    font-weight: 500;
    color: #374151;
    text-align: center;
  }

  .suggestions-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: center;
  }

  .suggestion-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s ease;
    min-height: 2.5rem;
  }

  .suggestion-btn:hover {
    border-color: #6366f1;
    background: #f8fafc;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
  }

  .suggestion-name {
    font-weight: 600;
    color: #111827;
  }

  .suggestion-badge {
    font-size: 0.7rem;
    color: #6366f1;
    background: #eef2ff;
    padding: 0.125rem 0.375rem;
    border-radius: 6px;
    font-weight: 500;
  }

  .browse-all-link {
    font-size: 0.85rem;
    color: #6366f1;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.15s ease;
  }

  .browse-all-link:hover {
    color: #4f46e5;
    text-decoration: underline;
  }

  .language-suggestions-debug {
    font-size: 0.8rem;
    color: #666;
    text-align: center;
    padding: 1rem;
  }
</style>