<script>
  import { userStore } from '$lib/stores/user.svelte.js';
  import TranslationInput from '$jibs/TranslationInput.svelte';
  import MultiLangCard from '$jibs/MultiLangCard.svelte';
  import { getEnglishName } from '$lib/utils/languages.js';
  import LanguageSuggestions from '$lib/components/LanguageSuggestions.svelte';

let result = $state(null); // Add result state to hold translation result
let { data } = $props();

let userLanguages = $derived(userStore.user.selectedLanguages);
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
      {:else}
        <LanguageSuggestions countryCode={data.ip_country} />
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



  </style>