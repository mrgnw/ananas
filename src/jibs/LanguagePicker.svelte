<script lang="ts">
  import Check from "lucide-svelte/icons/check";
  import { Combobox } from "bits-ui";
  import { languages } from 'countries-list';
  import LanguageList from './LanguageList.svelte';
  import { translateLanguages } from '$lib/stores/translateLanguages.svelte.js';
  import languageData from '$lib/data/wikidata-languages.json';

  let selectedCodes = $derived(translateLanguages.selectedCodes);

  // First, create a map of 3-char to 2-char codes
  const iso3ToIso1Map = new Map(
    languageData
      .filter(lang => lang.iso1)
      .map(lang => [lang.iso, lang.iso1])
  );

  // Create a map of 2-char to language info
  const countryLanguages = new Map(
    Object.entries(languages).map(([code, info]) => [code, {
      value: code,
      label: info.name,
      native: info.native
    }])
  );

  // Add custom languages
  const customLanguages = new Map([
    ['scn', {
      value: 'scn',
      label: 'Sicilian',
      native: 'Sicilianu'
    }]
  ]);

  // Create a unified language map, preferring 2-char codes
  const allLanguages = new Map();

  // First add countries-list languages (2-char codes)
  countryLanguages.forEach((info, code) => {
    allLanguages.set(code, info);
  });

  // Add custom languages
  customLanguages.forEach((info, code) => {
    allLanguages.set(code, info);
  });

  // Add wikidata languages that don't have 2-char codes
  languageData.forEach(lang => {
    if (!lang.iso1 && !allLanguages.has(lang.iso)) {
      allLanguages.set(lang.iso, {
        value: lang.iso,
        label: lang.langLabel,
        native: lang.nativeNames?.[0] || lang.langLabel
      });
    }
  });

  // Convert to array for the combobox
  let langs = Array.from(allLanguages.values());

  function isLanguageSelected(langCode) {
    // If this is a 3-char code, try to get its 2-char equivalent
    const codeToCheck = iso3ToIso1Map.get(langCode) || langCode;
    return selectedCodes.includes(codeToCheck);
  }

  function handleLanguageAdd(langCode) {
    // Always use 2-char code if available
    const codeToUse = iso3ToIso1Map.get(langCode) || langCode;
    const langInfo = allLanguages.get(codeToUse) || allLanguages.get(langCode);
    
    if (!selectedCodes.includes(codeToUse)) {
      translateLanguages.addLanguage(codeToUse, {
        label: langInfo?.label || codeToUse,
        native: langInfo?.native || codeToUse,
        rtl: false,
        display: true
      });
    }
    inputValue = "";
  }

  let value = $state("");
  let inputValue = $state("");
  let open = $derived(inputValue.length > 0);
  let filteredLangs = $derived(filterLanguages(inputValue));

  let selectedValue = $derived(
    langs.find((lang) => lang.label === value || lang.native === value)?.label ?? "Add language..."
  );

  function filterLanguages(inputValue) {
    const lowerInput = inputValue.toLowerCase();
    return langs
      .filter(
        (lang) =>
          lang.value.toLowerCase().includes(lowerInput) ||
          lang.label.toLowerCase().includes(lowerInput) ||
          lang.native.toLowerCase().includes(lowerInput)
      )
      .sort((a, b) => {
        const aExactMatch = a.value.toLowerCase() === lowerInput;
        const bExactMatch = b.value.toLowerCase() === lowerInput;

        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;

        const aStartsWith = a.value.toLowerCase().startsWith(lowerInput) ||
          a.label.toLowerCase().startsWith(lowerInput) ||
          a.native.toLowerCase().startsWith(lowerInput);
        const bStartsWith = b.value.toLowerCase().startsWith(lowerInput) ||
          b.label.toLowerCase().startsWith(lowerInput) ||
          b.native.toLowerCase().startsWith(lowerInput);

        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return 0;
      });
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      const exactMatch = filteredLangs.find(lang => lang.value.toLowerCase() === inputValue.toLowerCase());
      if (exactMatch) {
        handleLanguageAdd(exactMatch.value);
      }
    }
  }

</script>

<Combobox.Root items={filteredLangs} bind:inputValue touchedInput=open>
  <div class="relative">
    <Combobox.Input
      class="inline-flex h-input w-[296px] truncate rounded-9px border border-border-input bg-background px-11 text-sm transition-colors placeholder:text-foreground-alt/50 focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 focus:ring-offset-background"
      placeholder="Add a language" aria-label="Add a language" onkeydown={handleKeyDown} />
  </div>
  <Combobox.Content class="w-full rounded-xl border border-muted bg-background px-1 py-3 shadow-popover outline-none">
    {#each filteredLangs as lang}
    <Combobox.Item value={lang.value} label="{lang.label} | {lang.native}"
      class="cursor-pointer flex items-center justify-between" onclick={()=> handleLanguageAdd(lang.value)}
    >
      <span class="flex items-center">
        {#if isLanguageSelected(lang.value)}
        <Check class="mr-2" />
        {:else}
        <span class="mr-2" style="width: 1em; height: 1em;"></span>
        {/if}
        {lang.label} | {lang.native}
      </span>
    </Combobox.Item>
    {:else}
    <span class="block px-5 py-2 text-sm text-muted-foreground">
      No results found
    </span>
    {/each}
  </Combobox.Content>
</Combobox.Root>

<LanguageList />

<style>
  .language-picker {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 10px;
    max-height: 300px;
    overflow-y: auto;
  }

  .language-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .flag {
    font-size: 1.5em;
  }

  .lang-name {
    font-size: 0.9em;
  }

  .selected-languages {
    margin-bottom: 20px;
  }

  .highlight {
    color: blue;
  }
</style>