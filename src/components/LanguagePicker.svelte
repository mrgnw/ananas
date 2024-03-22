<script>
	import { Checkbox } from '$components/ui/checkbox';
	import { Label } from '$components/ui/label';
	import * as Collapsible from "$components/ui/collapsible";

	let { languages } = $props();
	languages = ['en', 'es', 'ca', 'it', 'ru', 'de'];
	const cataloniaFlagEmoji = String.fromCodePoint(0x1F3F4, 0xE0065, 0xE0073, 0xE0063, 0xE0074, 0xE007F);

	let flags = {
		en: '🇺🇸',
		es: '🇪🇸',
		ru: '🇷🇺',
		it: '🇮🇹',
		ca: cataloniaFlagEmoji,
		de: '🇩🇪'
	};

	let language_selections = $state({});
	languages.forEach(language => language_selections[language] = true);

	let selected_languages = $derived(
		Object.keys(language_selections).filter(language => language_selections[language])
	);
</script>

<div class="language-picker">
	{#each languages as language}
	<span class="flag {language_selections[language] ? 'selected' : ''}" on:click={()=> language_selections[language] =
		!language_selections[language]}
		>
		{flags[language]}
	</span>
	{/each}
</div>



<style>
	.flag {
		opacity: 0.3;
		transition: opacity 0.3s ease;
		cursor: pointer;
		font-size: 2em;
	}

	.flag.selected {
		opacity: 1;
	}
</style>