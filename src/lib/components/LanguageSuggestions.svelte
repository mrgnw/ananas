<script>
  import { userStore } from '$lib/stores/user.svelte.js';
  import { getLanguageSuggestions } from '$lib/utils/languageSuggestions.ts';
  import { onMount } from 'svelte';
  import { blur } from 'svelte/transition';

  let { countryCode } = $props();

  let allSuggestions = $state([]);
  onMount(() => {
    allSuggestions = getLanguageSuggestions(countryCode);
  });

  let userLanguages = $derived(userStore.user.selectedLanguages);
  let suggestionsToShow = $derived.by(() => {
    
    if (allSuggestions.length === 0) {
      return [];
    }
    
    const filtered = allSuggestions.filter(s => {
      const isIncluded = userLanguages.includes(s.code);
      return !isIncluded;
    });
    
    return filtered.slice(0, 4);
  });
</script>

{#if suggestionsToShow.length > 0}
  <div class="language-suggestions" transition:blur={{ duration: 300 }}>
    <p class="suggestions-prompt">
      {#if userLanguages.length === 0}
        Get started with these languages:
      {:else}
        Or add:
      {/if}
    </p>
    <div class="suggestions-list">
      {#each suggestionsToShow as suggestion}
        <button 
          class="suggestion-btn"
          onclick={() => userStore.addLanguage(suggestion.code)}
          title="Add {suggestion.name}"
        >
          {suggestion.name}
          {#if suggestion.reason === 'primary'}
            <span class="suggestion-badge">your language</span>
          {:else if suggestion.reason === 'country_primary'}
            <span class="suggestion-badge">local</span>
          {/if}
        </button>
      {/each}
      <a href="/languages" class="browse-all-link">see more →</a>
    </div>
  </div>
{/if}

<style>
  .language-suggestions {
    text-align: center;
    margin: 0.8rem 0;
  }

  .suggestions-prompt {
    font-size: 0.85rem;
    color: rgba(0, 0, 0, 0.5);
    margin: 0 0 0.6rem 0;
    font-weight: 400;
  }

  .suggestions-list {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .suggestion-btn {
    font-size: 0.8rem;
    color: #6366f1;
    background: none;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 0.3rem 0.6rem;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-weight: 500;
  }

  .suggestion-btn:hover {
    background: #f8fafc;
    border-color: #6366f1;
    color: #4f46e5;
  }

  .suggestion-badge {
    font-size: 0.65rem;
    color: #9ca3af;
    font-weight: 400;
    opacity: 0.8;
  }

  .browse-all-link {
    font-size: 0.8rem;
    color: #9ca3af;
    text-decoration: none;
    font-weight: 400;
    transition: color 0.15s ease;
  }

  .browse-all-link:hover {
    color: #6366f1;
    text-decoration: underline;
  }
</style>