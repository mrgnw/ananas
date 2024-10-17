<script>
	import { fly, fade } from "svelte/transition";
	import Card from "$jibs/Card.svelte";

	let { tgt_langs, translationHistory } = $props();

</script>

<div class="grid">
	{#each translationHistory as translation, i (translation)}
	<Card {translation} {tgt_langs} {i} />
	{/each}
</div>

<style>
	.grid {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}
</style>