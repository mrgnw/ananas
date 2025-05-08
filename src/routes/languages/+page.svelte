<script>
  import { fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { userStore } from '$lib/stores/user.svelte.js';
  import { getAllLanguages, isLocalLanguage, filterLanguages } from '$lib/utils/languages.js';

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

  let filteredLanguages = $derived.by(() => filterLanguages(languageOptions, filter));

  let flipDuration = 222;

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

<div class="filter-bar">
  <input
    class="language-filter-input"
    type="text"
    placeholder="Filter languages..."
    bind:value={filter}
    autocomplete="off"
  />
</div>

<ul class="languages-list">
  {#each [...filteredLanguages].filter(lang => lang.selected) as lang (lang.code)}
    <li class="language-item selected" role="button" tabindex="0"
      animate:flip={{ duration: flipDuration, easing: t => t*t*(3-2*t) }}
      onclick={() => userStore.removeLanguage(lang.code)}
      onkeydown={e => (e.key === 'Enter' || e.key === ' ') && userStore.removeLanguage(lang.code)}
      aria-label={`Remove ${lang.name}`}
    >
      <span class="lang-action">–</span>
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
    <li class="language-item" role="button" tabindex="0"
    animate:flip={{ duration: flipDuration, easing: t => t*t*(3-2*t) }}
      onclick={() => userStore.addLanguage(lang.code)}
      onkeydown={e => (e.key === 'Enter' || e.key === ' ') && userStore.addLanguage(lang.code)}
      aria-label={`Add ${lang.name}`}
    >
      <span class="lang-action">+</span>
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
  transition: background 0.12s, box-shadow 0.12s;
  will-change: transform, opacity;
  cursor: pointer;
  outline: none;
}
.language-item:hover, .language-item:focus {
  background: #f6f8fa;
  box-shadow: 0 0 0 2px #6366f1;
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

.filter-bar {
  display: flex;
  align-items: center;
  max-width: 420px;
  margin: .7rem auto .5rem auto;
  padding: 0 0.5rem;
  border-bottom: 2px solid #e5e7eb;
  background: none;
}
.language-filter-input {
  flex: 1;
  border: none;
  outline: none;
  background: none;
  font-size: 1.15em;
  padding: 0em 0 0em 0;
  color: #222;
  transition: box-shadow 0.15s, border-color 0.15s;
}
.language-filter-input:focus {
  box-shadow: 0 2px 0 0 #6366f1;
  border-bottom: 2px solid #6366f1;
}
</style>