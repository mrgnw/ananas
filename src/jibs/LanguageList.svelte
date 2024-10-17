<script>
  import { Badge } from "$lib/components/ui/badge";
	import X from "lucide-svelte/icons/x";

  let { tgt_langs = $bindable([]) } = $props();
	
	function removeLanguage(lang) {
    tgt_langs = tgt_langs.filter(l => l !== lang);
		localStorage.setItem('tgt_langs', JSON.stringify(tgt_langs));
  }
	let selected_lang_to_remove = $state("");
	function handle_variant(hovered_lang) {
		return hovered_lang == selected_lang_to_remove ? "destructive" : "outline";
	}

</script>

<div class="selected-languages">
	<ul>
		{#each tgt_langs as langCode}
		<li>
			<Badge variant={handle_variant(langCode)}>
				{new Intl.DisplayNames(['en'], { type: 'language' }).of(langCode)}
				<!-- [{langCode}] -->
				<X onclick={() => removeLanguage(langCode)}
					onmouseover={() => selected_lang_to_remove = langCode}
					onmouseleave={() => selected_lang_to_remove = ""}
					/>
			</Badge>
		</li>
		{/each}
	</ul>
</div>

<style>
	
	/* selected languages should be in a row, not column */
	.selected-languages ul {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}
</style>