<script>
	import { fly, fade } from "svelte/transition";
	// import { Button } from "$lib/components/ui/button";
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
	<div class="card {sorted_languages.length === 1 ? 'single-language' : ''}"
		in:fly={{ y: -200, duration: 500, delay: i * 100 }} out:fly={{ y: -200, duration: 500 }}>
		{#each sorted_languages as language (language)}
		{#if translation[language] != undefined}
		<div class={rtl_languages.includes(language) ? 'translation rtl' : 'translation' } transition:fade={{ duration: 200
			}}>
			{translation[language]}
		</div>
		{:else}
		<div class="missing-translation">▸ {language}</div>
		{/if}
		{/each}
	</div>
	{/each}
</div>

<style>
	.grid {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.card {
		border: 1px solid #ddd;
		padding: 1rem;
		border-radius: 0.5rem;
		flex: 1 1 auto;
		max-width: fit-content;
	}
	.card.single-language {
    border: none;
    padding: 0px;
		margin: 0px;
  }

	.language {
		font-family: monospace;
	}

	.rtl {
		direction: rtl;
	}

	.missing-translation {
		color: rgba(0, 0, 0, 0.5);
		font-style: italic;
	}

	.delete-item {
		position: absolute;
		top: 0;
		right: 0;
		display: none;
	}

	.card:hover .delete-button {
		display: block;
	}
</style>