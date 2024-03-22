<script>
	import { Checkbox } from '$components/ui/checkbox';
	import { Label } from '$components/ui/label';

	export let languages = ['en', 'es', 'ru', 'it', 'ca', 'de'];
	let language_selections = {};
	languages.forEach(language => language_selections[language] = false);
	$: selected_languages = Object.keys(language_selections).filter(language => language_selections[language]);
</script>

<div class="language-picker">

	{#each languages as language}
	<div>
			<Checkbox bind:checked={language_selections[language]}>{language}</Checkbox>
			<Label for={language}>{language}</Label>
		</div>
	{/each}
</div>

<p>{selected_languages}</p>