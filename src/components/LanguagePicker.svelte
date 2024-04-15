<script>
	import { Checkbox } from '$components/ui/checkbox';
	import { Label } from '$components/ui/label';
	import * as Collapsible from "$components/ui/collapsible";

	let { languages } = $props();
	let language_options = ['en', 'es', 'ca', 'ar', 'it', 'ru', 'de'];
	// languages = ['en', 'es', 'ca', 'it', 'ru', 'de'];
	// const cataloniaFlagEmoji = String.fromCodePoint(0x1F3F4, 0xE0065, 0xE0073, 0xE0063, 0xE0074, 0xE007F);

	function toggle_language(lang_code) {
		if (languages.includes(lang_code)) {
			languages = languages.filter(l => l !== lang_code);
			console.log(`- ${lang_code}`)
		} else {
			languages = [...languages, lang_code];
			console.log(`+ ${lang_code}`)
		}
	}

	let flags = {
		en: '🇺🇸',
		es: '🇪🇸',
		ru: '🇷🇺',
		ar: '🇲🇦',
		it: '🇮🇹',
		ca: '',
		de: '🇩🇪',
	};

	let language_selections = $state({});
	languages.forEach(language => language_selections[language] = true);


</script>

<div class="language-picker">
	{#each language_options as language}
	<span class="flag {languages.includes(language) ? 'selected' : ''}" on:click={()=> toggle_language(language)}>
		{#if language === 'ca'}
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 810 540" width="1em" height="1em">
			<rect width="810" height="540" fill="#FCDD09" />
			<path stroke="#DA121A" stroke-width="60" d="M0,90H810m0,120H0m0,120H810m0,120H0" />
		</svg>
		{:else}
		{flags[language]}
		{/if}
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

	.flag svg {
		display: inline-block;
		/* Add this line */
		width: 1em;
		height: 1em;
		vertical-align: -0.125em;
	}
</style>