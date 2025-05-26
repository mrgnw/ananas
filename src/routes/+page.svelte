<script>
  import { userStore } from '$lib/stores/user.svelte.js';
  import { translationsStore } from '$lib/stores/translationsStore.svelte.js';
  import TranslationInput from '$jibs/TranslationInput.svelte';
  import MultiLangCard from '$jibs/MultiLangCard.svelte';
  import { getEnglishName } from '$lib/utils/languages.js';
  import LanguageSuggestions from '$lib/components/LanguageSuggestions.svelte';

let { data } = $props();

let userLanguages = $derived(userStore.user.selectedLanguages);
let currentTranslation = $derived(translationsStore.current);
</script>

  <!-- <pre><code>{JSON.stringify(allSuggestions, null, 2)}</code></pre>
  •
  <pre><code>{JSON.stringify(suggestionsToShow, null, 2)}</code></pre> -->
  <main class="translate-main">
      <TranslationInput />
      <div class="target-langs-list">
      {#if userLanguages.length}
        {#each userLanguages as code, i}
          <span >{getEnglishName(code)}</span>{#if i < userLanguages.length - 1}<span class="lang-sep">·</span>{/if}
        {/each}
      {/if}
    </div>
    

    <LanguageSuggestions countryCode={data.ip_country} />
      {#if currentTranslation}
      <div class="result centered-result">
        <MultiLangCard translation={{ translations: currentTranslation.output }} />
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