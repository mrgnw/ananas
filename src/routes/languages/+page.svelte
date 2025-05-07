<script>
  import { userStore } from '$lib/stores/user.svelte.js';
  import { getAllLanguages } from '$lib/utils/languages.js';

  // Get all available languages
  const allLanguages = getAllLanguages().map(lang => ({
    code: lang.code,
    label: lang.name,
    native: lang.nativeName
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