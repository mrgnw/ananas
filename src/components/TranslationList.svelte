<script>
	import { Badge } from "$components/ui/badge";
	import { fly } from "svelte/transition";
	export let translationHistory = [];
	export let lang_opts = ['en', 'es', 'ru', 'it', 'ca', 'de'];
	$: if (translationHistory.length > 0) {
		lang_opts = Object.keys(translationHistory[0]);
	}
</script>

<div class="grid">
	{#each translationHistory as translation, i (translation)}
	<div class="card" in:fly={{ y: 200, duration: 500, delay: i * 100 }} out:fly={{ y: -200, duration: 500 }}>
		{#each lang_opts as language (language)}
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