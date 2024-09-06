<script lang="ts">
	
	import Check from "lucide-svelte/icons/check";
	import ChevronsUpDown from "lucide-svelte/icons/chevrons-up-down";
	
	import * as Command from "$lib/components/ui/command/index.ts";
	import * as Popover from "$lib/components/ui/popover/index.ts";
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
	let searchTerm = $state("");
	let open = $derived(searchTerm.length > 0);
	let filteredLangs = $derived(filterLanguages(searchTerm));

	let selectedValue = $derived(
		langs.find((lang) => lang.label === value || lang.native === value)?.label ?? "Add language..."
	);
	


	function filterLanguages(searchTerm) {
		return langs.filter(
			(lang) =>
				lang.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
				lang.native.toLowerCase().includes(searchTerm.toLowerCase())
		);
	}

	function closeAndFocusTrigger(triggerId) {
		searchTerm = "";
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}
</script>


<Input type="text" placeholder="add a language" bind:value={searchTerm}/>
<Popover.Root open={open}>
	<Popover.Trigger >
		<Button > +
		</Button>
	</Popover.Trigger>
	<Popover.Content>
		{#if searchTerm.length > 0}
		<ul>
			{#each filteredLangs as lang}
			<li onclick={()=>handleLanguageAdd(lang.value)}>
				{lang.value} : {lang.label} | {lang.native}
			</li>
			{/each}
		</ul>
		{/if}
		
	</Popover.Content>
</Popover.Root>
<!-- {#if searchTerm.length > 0}
	<ul>
		{#each filteredLangs as lang}
		<li onclick={()=>handleLanguageAdd(lang.value)}>
			{lang.value} : {lang.label} | {lang.native}
		</li>
		{/each}
	</ul>
{/if} -->

<LanguageList bind:translate_languages></LanguageList>

<!-- <ul>
	{#each filteredLangs as lang}
	<li>{lang.value}:{lang.label}|{lang.native}</li>
	{/each}
</ul> -->

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