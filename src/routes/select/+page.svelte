<script>
  import { userStore } from '$lib/stores/user.svelte.js';
  import languageData from '$lib/data/wikidata-languages.json';

  // Deduplicate by code
  const seen = new Set();
  const allLanguages = languageData
    .filter(lang => {
      if (seen.has(lang.iso)) return false;
      seen.add(lang.iso);
      return true;
    })
    .map(lang => ({
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