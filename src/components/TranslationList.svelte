<script>
	import { Badge } from "$components/ui/badge";
	import { fly } from "svelte/transition";
	let { languages, translationHistory } = $props();

	let lang_order = ['en', 'es', 'ca', 'it', 'ru', 'de'];
	function sort_languages(languages) {
		return languages.sort((a, b) => lang_order.indexOf(a) - lang_order.indexOf(b));
	}

	let sorted_languages = $derived(sort_languages(languages));
</script>

<div class="grid">
	{#each translationHistory as translation, i (translation)}
	<div class="card" in:fly={{ y: 200, duration: 500, delay: i * 100 }} out:fly={{ y: -200, duration: 500 }}>
		{#each sorted_languages as language (language)}
		<div class="translation">
			<Badge variant="outline"><span class="language">{language}</span>
			</Badge>
			{translation[language]}
		</div>
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

	.language {
		font-family: monospace;
	}
</style>