<script>
  import { Badge } from "$lib/components/ui/badge";
	import X from "lucide-svelte/icons/x";

  let { translate_languages = $bindable([]) } = $props();
	
	function removeLanguage(lang) {
    translate_languages = translate_languages.filter(l => l !== lang);
  }
	let selected_lang_to_remove = $state("");
	function handle_variant(hovered_lang) {
		return hovered_lang == selected_lang_to_remove ? "destructive" : "outline";
	}

</script>

<div class="selected-languages">
	<ul>
		{#each translate_languages as langCode}
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