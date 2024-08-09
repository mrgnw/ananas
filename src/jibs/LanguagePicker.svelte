<script>
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Collapsible from "$lib/components/ui/collapsible";
	import { countries } from 'countries-list';

	let { languages } = $props();

	function toggle_language(lang_code) {
		const currentValue = languages.get(lang_code);
		languages.set(lang_code, currentValue === 1 ? 0 : 1);
		languages = new Map(languages);
	}

	const availableLanguages = Object.entries(countries).reduce((acc, [_, country]) => {
		if (country.languages) {
			country.languages.forEach(lang => {
				if (!acc.has(lang)) {
					acc.set(lang, country.emoji);
				}
			});
		}
		return acc;
	}, new Map());

</script>

<Collapsible.Root>
	<Collapsible.Trigger>Select Languages</Collapsible.Trigger>
	<Collapsible.Content>
		<div class="language-picker">
			{#each Array.from(availableLanguages) as [langCode, flag]}
			<label class="language-item">
				<Checkbox checked={languages.get(langCode)===1} onCheckedChange={()=> toggle_language(langCode)} />
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