<script>
  import { fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { userStore } from '$lib/stores/user.svelte.js';
  import { getAllLanguages, isLocalLanguage } from '$lib/utils/languages.js';

  let allLanguages = $state(getAllLanguages());

  let languageOptions = $state(
    allLanguages.map(lang => ({
      ...lang,
      get selected() {
        return userStore.user.selectedLanguages.includes(lang.code);
      }
    }))
  );
  let props = $props();
  let { ip_country, country_languages, accept_language, country_phone } = props;
  
  let filter = $state('');

  let filteredLanguages = $derived.by(() => {
    if (!filter.trim()) return [...languageOptions];
    const f = filter.trim().toLowerCase();
    const exact = [];
    const starts = [];
    const partial = [];
    for (const lang of languageOptions) {
      const name = lang.name?.toLowerCase() || '';
      const native = lang.nativeName?.toLowerCase() || '';
      const code2 = lang.code?.toLowerCase() || '';
      const code3 = lang.iso3?.toLowerCase?.() || '';
      if (
        name === f ||
        native === f ||
        code2 === f ||
        code3 === f
      ) {
        exact.push(lang);
      } else if (
        name.startsWith(f) ||
        native.startsWith(f) ||
        code2.startsWith(f) ||
        code3.startsWith(f)
      ) {
        starts.push(lang);
      } else if (
        name.includes(f) ||
        native.includes(f) ||
        code2.includes(f) ||
        code3.includes(f)
      ) {
        partial.push(lang);
      }
    }
    return [...exact, ...starts, ...partial];
  });

  function formatSpeakers(n) {
    if (!n) return '';
    return (n / 1000).toFixed(0) + 'M';
  }

  function languageSort(a, b, userCountry) {
    if (b.selected !== a.selected) return b.selected - a.selected;
    if (!a.selected && !b.selected && userCountry) {
      const aLocal = isLocalLanguage(a.code, userCountry);
      const bLocal = isLocalLanguage(b.code, userCountry);
      if (aLocal !== bLocal) return bLocal - aLocal;
    }
    return b.speakers - a.speakers;
  }
</script>

<input
  class="language-filter-input"
  type="text"
  placeholder="Filter by name, native name, 2- or 3-letter code..."
  bind:value={filter}
  autocomplete="off"
  style="margin-bottom:1em;width:100%;padding:0.5em;font-size:1em;border-radius:5px;border:1px solid #ddd;"
/>

<ul class="languages-list">
  {#each [...filteredLanguages].filter(lang => lang.selected) as lang (lang.code)}
    <li class="language-item selected">
      <button class="add-btn"
        onclick={() => lang.selected
          ? userStore.removeLanguage(lang.code)
          : userStore.addLanguage(lang.code)
        }>
        <span class="add-btn-label-wrap">
          {#if lang.selected}
            <span class="add-btn-label" in:fade out:fade>Remove</span>
          {:else}
            <span class="add-btn-label" in:fade out:fade>Add</span>
          {/if}
        </span>
      </button>
      <span class="lang-speakers">{formatSpeakers(lang.speakers)}</span>
      <span class="lang-label">{lang.name}</span>
      {#if lang.nativeName && lang.nativeName !== lang.name}
        <span class="lang-native">{lang.nativeName}</span>
      {/if}
    </li>
  {/each}

  {#if filteredLanguages.some(lang => !lang.selected) && filteredLanguages.some(lang => lang.selected)}
    <li class="language-separator" style="margin: 0.5em 0; border-bottom: 1px solid #eee; list-style: none;"></li>
  {/if}

  {#each [...filteredLanguages].filter(lang => !lang.selected) as lang (lang.code)}
    <li class="language-item">
      <button class="add-btn"
        onclick={() => lang.selected
          ? userStore.removeLanguage(lang.code)
          : userStore.addLanguage(lang.code)
        }>
        <span class="add-btn-label-wrap">
          {#if lang.selected}
            <span class="add-btn-label" in:fade out:fade>Remove</span>
          {:else}
            <span class="add-btn-label" in:fade out:fade>Add</span>
          {/if}
        </span>
      </button>
      <span class="lang-speakers">{formatSpeakers(lang.speakers)}</span>
      <span class="lang-label">{lang.name}</span>
      {#if lang.nativeName && lang.nativeName !== lang.name}
        <span class="lang-native">{lang.nativeName}</span>
      {/if}
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
  min-width: 70px;
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
.add-btn-label-wrap {
  position: relative;
  display: inline-block;
  width: 60px; /* or whatever fits both labels */
  height: 1.5em;
  text-align: center;
  vertical-align: middle;
}
.add-btn-label {
  position: absolute;
  left: 0; top: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.lang-label {
  font-weight: 600;
  font-size: 1.05em;
  display: block;
}
.lang-native {
  display: block;
  font-style: italic;
  color: #888;
  font-size: 0.97em;
  margin-top: -0.15em;
  margin-bottom: 0.1em;
  margin-left: 0.2em;
}
</style>