<script>
	import { fly } from "svelte/transition";
	let { translation, translate_languages, index = 0 } = $props();
	let rtl_languages = ['ar'];
	let lang_class = $derived(translate_languages.length === 1 ? 'single-language' : '');
</script>

<div class="card {lang_class}" in:fly={{ y: -200, duration: 500, delay: index * 100 }} out:fly={{ y: -200, duration: 500 }}>
	{#each translate_languages as lang}
	{#if translation[lang]}
	<div class:rtl={rtl_languages.includes(lang)}>
		{translation[lang]}
	</div>
	{:else}
	<div class="missing-translation">▸ {lang}</div>
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