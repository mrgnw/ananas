<script lang="ts">
  import { userStore } from '$lib/stores/user.svelte.js';
  import languageData from '$lib/data/wikidata-languages.json';
  import Check from "lucide-svelte/icons/check";

  // All available languages
  const allLanguages = languageData.map(lang => ({
    code: lang.iso,
    label: lang.langLabel,
    native: lang.nativeNames?.[0] || lang.langLabel
  }));

  function addLanguage(code) {
    userStore.addLanguage(code);
  }

  function removeLanguage(code) {
    userStore.removeLanguage(code);
  }

  function isSelected(code) {
    // Always reference the store directly for reactivity
    return userStore.user.selectedLanguages.includes(code);
  }
</script>

<!-- Selected languages at the top -->
<div class="selected-languages flex gap-2 mb-4 flex-wrap">
  {#each userStore.user.selectedLanguages as code (code)}
    <span class="px-2 py-1 bg-gray-200 rounded flex items-center gap-1">
      {allLanguages.find(l => l.code === code)?.label || code}
      <button on:click={() => removeLanguage(code)} aria-label="Remove">
        &times;
      </button>
    </span>
  {/each}
</div>

<!-- All languages (no sorting) -->
<ul class="all-languages space-y-1">
  {#each allLanguages as lang (lang.code)}
    <li class="flex items-center gap-2">
      <button
        disabled={isSelected(lang.code)}
        on:click={() => addLanguage(lang.code)}
        class="border rounded px-2 py-1"
        aria-label={isSelected(lang.code) ? "Selected" : "Add"}
      >
        {#if isSelected(lang.code)}
          <Check class="inline w-4 h-4 text-green-600" />
        {:else}
          +
        {/if}
      </button>
      <span>{lang.label} <span class="text-gray-500">({lang.native})</span></span>
    </li>
  {/each}
</ul>

<style>
.selected-languages {
  flex-wrap: wrap;
}
</style>