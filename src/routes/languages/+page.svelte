<script>
  import { userStore } from '$lib/stores/user.svelte.js';
  import { getAllLanguages } from '$lib/utils/languages.js';

  // Only runs once on load
  let allLanguages = $state(getAllLanguages().sort((a, b) => b.speakers - a.speakers));

  let languageOptions = $derived.by(() =>
    allLanguages.map(lang => ({
      ...lang,
      selected: userStore.user.selectedLanguages.includes(lang.code)
    }))
    .sort((a, b) => (b.selected - a.selected) || (b.speakers - a.speakers))
  );

  function formatSpeakers(n) {
    if (!n) return '';
    return (n / 1000).toFixed(0) + 'M';
  }
</script>

<h1>Select Languages</h1>
<ul class="languages-list">
  {#each languageOptions as lang (lang.code)}
    <li class="language-item {lang.selected ? 'selected' : ''}">
      <button class="add-btn"
        onclick={() => lang.selected
          ? userStore.removeLanguage(lang.code)
          : userStore.addLanguage(lang.code)
        }>
        {lang.selected ? 'Remove' : 'Add'}
      </button>
      <span class="lang-speakers">{formatSpeakers(lang.speakers)}</span>
      <span class="lang-label">{lang.name}</span>
      <span class="lang-native">({lang.nativeName})</span>
    </li>
  {/each}
</ul>

<style>
.languages-list {
  max-width: 480px;
  margin: 0 auto;
  padding: 0;
  list-style: none;
}
.language-item {
  display: flex;
  align-items: center;
  gap: 0.5em;
  padding: 0.15em 0.5em;
  border-radius: 5px;
  margin-bottom: 0.1em;
  font-size: 1em;
  min-height: 32px;
  transition: background 0.12s;
}
.language-item:hover {
  background: #f6f8fa;
}
.add-btn {
  min-width: 54px;
  padding: 0.15em 0.7em;
  border-radius: 999px;
  border: none;
  background: #f3f4f6;
  color: #222;
  font-weight: 500;
  cursor: pointer;
  font-size: 0.97em;
  transition: background 0.12s;
  margin-right: 0.3em;
  height: 28px;
}
.add-btn:active {
  background: #e0e7ff;
  color: #3730a3;
}
.lang-label {
  font-weight: 600;
  margin-left: 0.3em;
}
.lang-native {
  color: #888;
  margin-left: 0.3em;
  font-size: 0.97em;
}
.lang-speakers {
  color: #aaa;
  font-size: 0.97em;
  min-width: 2.5em;
  text-align: right;
  margin-left: 0.2em;
  margin-right: 0.2em;
}
</style>