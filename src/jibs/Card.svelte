<script>
	import { fly } from "svelte/transition";
	let { translation, languages, i } = $props();
	let rtl_languages = ['ar'];
	let language_selections = $derived(
		Array.from(languages).filter(([key, value]) => value === 1).map(([key]) => key)
	)
	let lang_class = $derived(language_selections ? (language_selections.length === 1 ? 'single-language' : '') : '');
</script>

<div class="card {lang_class}" in:fly={{ y: -200, duration: 500, delay: i * 100 }} out:fly={{ y: -200, duration: 500 }}>
	{#each language_selections as lang}
	{#if languages.get(lang) === 1}
	<div class:rtl={rtl_languages.includes(lang)}>
		{#if translation[lang]}
		{translation[lang]}
		{:else}
		<div class="missing-translation">▸ {lang}</div>
		{/if}
	</div>
	{/if}
	{/each}
</div>

<style>
	.card {
		border: 1px solid #ddd;
		padding: 1rem;
		border-radius: 0.5rem;
		flex: 1 1 auto;
		max-width: fit-content;
	}

	.card.single-language {
		border: none;
		padding: 0;
		margin: 0;
	}

	.rtl {
		direction: rtl;
	}

	.translation {
		margin-bottom: 0.5rem;
	}

	.missing-translation {
		color: rgba(0, 0, 0, 0.5);
		font-style: italic;
	}
</style>