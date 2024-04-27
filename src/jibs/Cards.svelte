<script>
	import { fly, fade } from "svelte/transition";
	import Card from "$jibs/Card.svelte";

	let { languages, translationHistory } = $props();

	$effect(() => {
		console.log('languages', languages);
	});

</script>

<div class="grid">
	{#each translationHistory as translation, i (translation)}
	<Card {translation} {languages} {i} />
	{/each}
</div>

<style>
	.grid {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}
</style>