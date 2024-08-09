<script>
	import { onMount } from 'svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Collapsible from "$lib/components/ui/collapsible";
	import { countries } from 'countries-list';

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

	const availableLanguages = Object.values(countries).reduce((acc, country) => {
		if (country.languages) {
			country.languages.forEach(lang => {
				if (!acc.has(lang)) {
					acc.set(lang, country.emoji);
				}
			});
		}
		return acc;
	}, new Map());

	let sortedLanguages = $derived(
		Array.from(availableLanguages)
			.sort((a, b) => {
				const nameA = new Intl.DisplayNames(['en'], { type: 'language' }).of(a[0]);
				const nameB = new Intl.DisplayNames(['en'], { type: 'language' }).of(b[0]);
				return nameA.localeCompare(nameB);
			})
			.sort((a, b) => {
				const aSelected = translate_languages.includes(a[0]);
				const bSelected = translate_languages.includes(b[0]);
				return bSelected - aSelected;
			}));

</script>

<Collapsible.Root>
	<Collapsible.Trigger>Select Languages</Collapsible.Trigger>
	<Collapsible.Content>
		<div class="language-picker">
			{#each sortedLanguages as [langCode, flag]}
			<label class="language-item">
				<Checkbox checked={translate_languages.includes(langCode)} onCheckedChange={(checked)=>
					handleLanguageToggle(langCode, checked)}
					/>
					<span class="flag">{flag}</span>
					<span class="lang-name">{new Intl.DisplayNames(['en'], { type: 'language' }).of(langCode)}</span>
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
</style>