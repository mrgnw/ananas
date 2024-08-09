<script>
	import { onMount } from 'svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Collapsible from "$lib/components/ui/collapsible";
	import { languages } from 'countries-list';

	let { translate_languages = [] } = $props();

	// Load saved languages from localStorage on component mount
	onMount(() => {
		const savedLanguages = localStorage.getItem('translate_languages');
		if (savedLanguages) {
			translate_languages = JSON.parse(savedLanguages);
		}
	});

	function handleLanguageToggle(langCode, checked) {
		if (checked) {
			translate_languages = [...translate_languages, langCode];
		} else {
			translate_languages = translate_languages.filter(lang => lang !== langCode);
		}
		// Save updated languages to localStorage
		localStorage.setItem('translate_languages', JSON.stringify(translate_languages));
	}

	let sortedLanguages = $derived(
		Object.entries(languages)
			.sort((a, b) => a[1].name.localeCompare(b[1].name))
	);
			
</script>

<div class="selected-languages">
	<ul>
		{#each translate_languages as langCode}
			<li>
				{new Intl.DisplayNames(['en'], { type: 'language' }).of(langCode)}
			</li>
		{/each}
	</ul>
</div>

<Collapsible.Root>
	<Collapsible.Trigger>Select Languages</Collapsible.Trigger>
	<Collapsible.Content>
		<div class="language-picker">
			{#each sortedLanguages as [langCode, langInfo]}
				<label class="language-item">
					<Checkbox 
						checked={translate_languages.includes(langCode)} 
						onCheckedChange={(checked) => handleLanguageToggle(langCode, checked)}
					/>
					<span class="lang-name">{langInfo.name} ({langInfo.native})</span>
				</label>
			{/each}
		</div>
	</Collapsible.Content>
</Collapsible.Root>

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

	.selected-languages ul {
		list-style-type: none;
		padding: 0;
	}

	.selected-languages li {
		margin-bottom: 5px;
	}
</style>