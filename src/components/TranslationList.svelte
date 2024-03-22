<script>
	import { Badge } from "$components/ui/badge";

	export let translationHistory = [];
	export let languages = ['en', 'es', 'ru', 'it', 'ca', 'de'];

	$: if (translationHistory.length > 0) {
		languages = Object.keys(translationHistory[0]);
	}
</script>

<div class="grid">
	{#each translationHistory as translation (translation)}
	<div class="card">
		{#each languages as language (language)}
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