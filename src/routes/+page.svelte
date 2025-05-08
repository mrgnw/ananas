<script>
  import { userStore } from '$lib/stores/user.svelte.js';
  import TranslationInput from '$jibs/TranslationInput.svelte';
  import MultiLangCard from '$jibs/MultiLangCard.svelte';
  import { getEnglishName } from '$lib/utils/languages.js';

let result = $state(null); // Add result state to hold translation result
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
  }

  </style>