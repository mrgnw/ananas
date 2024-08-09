<script>
	import { fly, fade } from "svelte/transition";
	import Card from "$jibs/Card.svelte";

	let { translate_languages, translationHistory } = $props();

</script>

<div class="grid">
	{#each translationHistory as translation, i (translation)}
	<Card {translation} {translate_languages} {i} />
	{/each}
</div>

<style>
	.grid {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}
</style>