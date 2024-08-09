<script>
	import { Checkbox, Label } from '$lib/components/ui/checkbox';
	import * as Collapsible from "$lib/components/ui/collapsible";

	let { languages } = $props();

	function toggle_language(lang_code) {
    const currentValue = languages.get(lang_code);
    languages.set(lang_code, currentValue === 1 ? 0 : 1);
		// Re-assign to trigger reactivity
		languages = new Map(languages);
  }

	let flags = {
		en: '🇺🇸',
		es: '🇪🇸',
		pt: '🇧🇷',
		ru: '🇷🇺',
		ar: '🇲🇦',
		it: '🇮🇹',
		cs: '🇨🇿',
		ca: '',
		hy: '🇦🇲',
	};


</script>

<div class="language-picker">
	{#each Array.from(languages) as [language, is_selected]}
	<span class="flag" class:selected={is_selected} on:click={()=> toggle_language(language)}>
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