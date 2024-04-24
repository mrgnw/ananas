<script>
	import { fly, fade } from "svelte/transition";
	import Card from "$jibs/Card.svelte";
	
	let { languages, translationHistory } = $props();

	let lang_order = ['en', 'es', 'ca', 'ru'];
	let rtl_languages = ['ar'];
	
	function sort_languages(languages) {
		return languages.sort((a, b) => {
			return (lang_order.indexOf(a) === -1 ? Infinity : lang_order.indexOf(a)) -
				(lang_order.indexOf(b) === -1 ? Infinity : lang_order.indexOf(b));
		});
	}
	function deleteCard(index) {
		translationHistory.splice(index, 1);
	}

	let sorted_languages = $derived(sort_languages(languages));
</script>

<div class="grid">
	{#each translationHistory as translation, i (translation)}
	<Card {translation} {sorted_languages} {rtl_languages} {i} />
	{/each}
</div>

<style>
  .grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }
</style>