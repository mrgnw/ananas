<script lang="ts">
	
	import Check from "lucide-svelte/icons/check";
	import ChevronsUpDown from "lucide-svelte/icons/chevrons-up-down";
	
	// import * as Command from "$lib/components/ui/command/index.ts";
	// import * as Popover from "$lib/components/ui/popover/index.ts";
	import { Combobox } from "bits-ui";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Button } from "$lib/components/ui/button/index.ts";
	import { cn } from "$lib/utils.ts";
	import { tick } from "svelte";
	import { languages } from 'countries-list';
	import LanguageList from './LanguageList.svelte';

	$effect(() => {
		console.debug("languages", languages);
	})

	// TODO: confirm that this is reactive
	let { translate_languages = $bindable([]) } = $props();

	// Load saved languages from localStorage on component mount
	$effect(() => {
		const savedLanguages = localStorage.getItem('translate_languages');
		if (savedLanguages) {
			translate_languages = JSON.parse(savedLanguages);
		}
	})

	function handleLanguageToggle(langCode, checked) {
		if (checked) {
			translate_languages = [...translate_languages, langCode];
		} else {
			translate_languages = translate_languages.filter(lang => lang !== langCode);
		}
		// Save updated languages to localStorage
		localStorage.setItem('translate_languages', JSON.stringify(translate_languages));
	}

	// TODO: Rune-ify
	function handleLanguageAdd(langCode) {
		if (!translate_languages.includes(langCode)) {
			translate_languages = [...translate_languages, langCode];
			localStorage.setItem('translate_languages', JSON.stringify(translate_languages));
		}
	}
	let langs = Object.entries(languages).map(([langCode, langInfo]) => ({
		value: langCode,
		label: langInfo.name,
		native: langInfo.native
	}));

	let value = $state("");
	let inputValue = $state("");
	let open = $derived(inputValue.length > 0);
	let filteredLangs = $derived(filterLanguages(inputValue));

	let selectedValue = $derived(
		langs.find((lang) => lang.label === value || lang.native === value)?.label ?? "Add language..."
	);
	


	function filterLanguages(inputValue) {
		return langs.filter(
			(lang) =>
				lang.label.toLowerCase().includes(inputValue.toLowerCase()) ||
				lang.native.toLowerCase().includes(inputValue.toLowerCase())
		);
	}

</script>


<Combobox.Root items={filteredLangs} bind:inputValue touchedInput=open>
	<div class="relative">
		<Combobox.Input
      class="inline-flex h-input w-[296px] truncate rounded-9px border border-border-input bg-background px-11 text-sm transition-colors placeholder:text-foreground-alt/50 focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 focus:ring-offset-background"
      placeholder="Search a lang"
      aria-label="Search a lang"
    />
	</div>
	  <Combobox.Content
    class="w-full rounded-xl border border-muted bg-background px-1 py-3 shadow-popover outline-none"
		>
		{#each filteredLangs as lang}
		<Combobox.Item 
		value={lang.value} 
		label="{lang.label} | {lang.native}"
		class="cursor-pointer">
		</Combobox.Item>
		{:else}
      <span class="block px-5 py-2 text-sm text-muted-foreground">
        No results found
      </span>
		{/each}
	</Combobox.Content>
</Combobox.Root>


<LanguageList bind:translate_languages></LanguageList>


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

</style>