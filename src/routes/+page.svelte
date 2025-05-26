<script>
  import { userStore } from '$lib/stores/user.svelte.js';
  import TranslationInput from '$jibs/TranslationInput.svelte';
  import MultiLangCard from '$jibs/MultiLangCard.svelte';
  import { getEnglishName } from '$lib/utils/languages.js';

let result = $state(null); // Add result state to hold translation result
let { data } = $props();

// Update suggestions when country data is available
$effect(() => {
  if (data.ip_country) {
    userStore.loadLanguageSuggestions(data.ip_country);
  }
});

// Get language suggestions from the user store
let suggestions = $derived(() => {
  const hasLanguages = userStore.user?.selectedLanguages?.length > 0;
  const suggestedLanguages = userStore.user?.suggestedLanguages || [];
  
  console.log('Suggestions debug:', {
    hasLanguages,
    selectedLanguages: userStore.user?.selectedLanguages,
    ip_country: data.ip_country,
    suggestedLanguages,
    userStoreUser: userStore.user
  });
  
  // Show suggestions if user has no languages or has suggestions that aren't already selected
  if (hasLanguages) {
    return suggestedLanguages.filter(s => !userStore.user.selectedLanguages.includes(s.code));
  }
  return suggestedLanguages.slice(0, 4);
});
</script>

  <main class="translate-main">
      <TranslationInput
          bind:result
      />
      <div class="target-langs-list">
      {#if userStore.user.selectedLanguages.length}
        {#each userStore.user.selectedLanguages as code, i}
          <span >{getEnglishName(code)}</span>{#if i < userStore.user.selectedLanguages.length - 1}<span class="lang-sep">·</span>{/if}
        {/each}
      {:else if suggestions.length > 0 || true}
        <div class="language-suggestions">
          <div class="suggestions-header">
            <span class="suggestions-title">Get started with these languages:</span>
          </div>
          <div class="suggestions-buttons">
            {#if suggestions.length === 0}
              <p>Debug: No suggestions found. User has {userStore.user?.selectedLanguages?.length || 0} languages. Country: {data.ip_country || 'none'}</p>
            {/if}
            {#each suggestions as suggestion}
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
      {:else}
        <span class="lang-badge empty">No target languages selected</span>
      {/if}
    </div>
      {#if result}
      <div class="result centered-result">
        <MultiLangCard translation={{ translations: result }} />
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


  </style>