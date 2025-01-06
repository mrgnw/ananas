<script lang="ts">


	import Check from "lucide-svelte/icons/check";
	import { Combobox } from "bits-ui";
	import { languages } from 'countries-list';
	import LanguageList from './LanguageList.svelte';

	// TODO: confirm that this is reactive
	let { tgt_langs = $bindable([]) } = $props();

	// Let's also log the initial languages array
	console.log('Initial languages:', Object.keys(languages));

	// Load saved languages from localStorage on component mount
	$effect(() => {
		const savedLanguages = localStorage.getItem('tgt_langs');
		console.log('Loaded from localStorage:', savedLanguages);
		if (savedLanguages) {
			tgt_langs = JSON.parse(savedLanguages);
			console.log('Current tgt_langs:', tgt_langs);
		}
	})

	function handleLanguageAdd(langCode) {
		if (!tgt_langs.includes(langCode)) {
			tgt_langs = [...tgt_langs, langCode];
			localStorage.setItem('tgt_langs', JSON.stringify(tgt_langs));
			console.log('tgt_langs after add:', tgt_langs);
		} else {
			console.log('Language already in tgt_langs');
		}
		inputValue = "";
	}
	let langs = Object.entries(languages).map(([langCode, langInfo]) => ({
		value: langCode,
		label: langInfo.name,
		native: langInfo.native
	}));

	// Add custom languages that aren't in countries-list
	const customLanguages = {
		scn: {
			value: 'scn',
			label: 'Sicilian',
			native: 'Sicilianu'
		}
	};

	langs = [...langs, ...Object.values(customLanguages)];

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
				{#if tgt_langs.includes(lang.value)}
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


<LanguageList bind:tgt_langs></LanguageList>


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