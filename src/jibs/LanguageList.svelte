<script>
  import { Badge } from "$lib/components/ui/badge";
  import X from "lucide-svelte/icons/x";
  import { translateLanguages } from '$lib/stores/translateLanguages.svelte.js';

  let selectedCodes = $derived(translateLanguages.selectedCodes);
  
  function removeLanguage(code) {
    // The store will handle normalization internally
    translateLanguages.removeLanguage(code);
  }

  let selected_lang_to_remove = $state("");
  function handle_variant(hovered_lang) {
    return hovered_lang == selected_lang_to_remove ? "destructive" : "outline";
  }

</script>

<div class="selected-languages">
  <ul>
    {#each selectedCodes as langCode}
    <li>
      <Badge variant={handle_variant(langCode)}>
        {translateLanguages.getLanguageInfo(langCode)?.label || langCode}
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