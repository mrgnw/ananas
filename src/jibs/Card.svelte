<script>
  import { fly } from "svelte/transition";
  export let translation;
  export let sorted_languages;
  export let rtl_languages;
  export let i;
</script>

<div class="card {sorted_languages.length === 1 ? 'single-language' : ''}"
  in:fly={{ y: -200, duration: 500, delay: i * 100 }} 
  out:fly={{ y: -200, duration: 500 }}>
  {#each sorted_languages as language (language)}
    {#if translation[language] != undefined}
      <div class={rtl_languages.includes(language) ? 'translation rtl' : 'translation' }>
        {translation[language]}
      </div>
    {:else}
      <div class="missing-translation">▸ {language}</div>
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
		padding: 0px;
		margin: 0px;
	}
	.rtl {
		direction: rtl;
	}
	.missing-translation {
		color: rgba(0, 0, 0, 0.5);
		font-style: italic;
	}
</style>