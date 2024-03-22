<script>
	import { Checkbox } from '$components/ui/checkbox';
	import { Label } from '$components/ui/label';
	import * as Collapsible from "$components/ui/collapsible";

	export let languages = ['en', 'es', 'ru', 'it', 'ca', 'de'];
	const cataloniaFlagEmoji = String.fromCodePoint(0x1F3F4, 0xE0065, 0xE0073, 0xE0063, 0xE0074, 0xE007F);
	console.log(cataloniaFlagEmoji);

	let flags = {
		en: '🇺🇸',
		es: '🇪🇸',
		ru: '🇷🇺',
		it: '🇮🇹',
		ca: cataloniaFlagEmoji,
		de: '🇩🇪'
	};

	let language_selections = {};
	languages.forEach(language => language_selections[language] = false);
	$: selected_languages = Object.keys(language_selections).filter(language => language_selections[language]);
</script>

<div class="language-picker">
	<Collapsible.Root>
		<Collapsible.Trigger>
			{#each languages as language}
			{flags[language]}
			{/each}
		</Collapsible.Trigger>
		<Collapsible.Content>
			{#each languages as language}
			<div>
				<Checkbox bind:checked={language_selections[language]}>{language}</Checkbox>
				<Label for={language}>{flags[language]} {language}</Label>
			</div>
			{/each}
		</Collapsible.Content>
	</Collapsible.Root>
</div>