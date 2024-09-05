<script lang="ts">
	
	// import Check from "lucide-svelte/icons/check";
	// import ChevronsUpDown from "lucide-svelte/icons/chevrons-up-down";
	import * as Command from "$lib/components/ui/command/index.ts";
	import * as Popover from "$lib/components/ui/popover/index.ts";
	import { Button } from "$lib/components/ui/button/index.ts";
	import { cn } from "$lib/utils.ts";
	import { tick } from "svelte";
	import { languages } from 'countries-list';
	import LanguageList from './LanguageList.svelte';

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

	let sortedLanguages = Object.entries(languages)
		.sort((a, b) => a[1].name.localeCompare(b[1].name))
		.map(([langCode, langInfo]) => ({ value: langCode, label: langInfo.name }));

	let open = $state(false);
	let value = $state("");

	let selectedValue = $derived(sortedLanguages.find((lang) => lang.value === value)?.label ?? "Add language...");

	function closeAndFocusTrigger(triggerId) {
		open = false;
		tick().then(() => {
			// document.getElementById(triggerId)?.focus();
		});
	}
</script>

<LanguageList bind:translate_languages></LanguageList>


<Popover.Root bind:open let:ids>
	<Popover.Trigger asChild let:builder>
		<Button builders={[builder]} variant="outline" role="combobox" aria-expanded={open}
			class="w-[200px] justify-between">
			{selectedValue}
			<!-- <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" /> -->
		</Button>
	</Popover.Trigger>
	<Popover.Content class="w-[200px] p-0">
		<Command.Root>
			<Command.Input placeholder="Search language..." />
			<Command.Empty>No language found.</Command.Empty>
			<Command.Group>
				{#each sortedLanguages as lang}
				<Command.Item value={lang.value} onSelect={(currentValue)=> {
					value = currentValue;
					handleLanguageAdd(currentValue);
					closeAndFocusTrigger(ids.trigger);
					}}
					>
					<div class={cn( "mr-2 h-4 w-4" , value !==lang.value && "text-transparent" )}></div>
					{lang.label}
				</Command.Item>
				{/each}
			</Command.Group>
		</Command.Root>
	</Popover.Content>
</Popover.Root>

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