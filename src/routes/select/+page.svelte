<script>
  import { userStore } from '$lib/stores/user.svelte.js';
  import languageData from '$lib/data/wikidata-languages.json';
  import { isDeepLSupported, isM2MSupported, showCompatibleLanguages } from '$lib/utils/languageSupport.ts';

  // Get the user's translators
  const translators = userStore.user.translators;

  // Use the utility to get only compatible languages
  const allLanguages = showCompatibleLanguages(translators).map(lang => ({
    code: lang.iso,
    label: lang.langLabel,
    native: lang.nativeNames?.[0] || lang.langLabel
  }));

  function isSelected(code) {
    return userStore.user.selectedLanguages.includes(code);
  }
</script>

<h1>Select Languages</h1>
<ul>
  {#each allLanguages as lang (lang.code)}
    <li>
      <button
        on:click={() => isSelected(lang.code) ? userStore.removeLanguage(lang.code) : userStore.addLanguage(lang.code)}
        style="margin-right: 1em"
      >
        {isSelected(lang.code) ? 'Remove' : 'Add'}
      </button>
      {lang.label} <span style="color: #888">({lang.native})</span>
    </li>
  {/each}
</ul>