<script>
  import { Button } from "$lib/components/ui/button";
  import { Settings } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import { userStore } from '$lib/stores/user.svelte.js';
  import { defaultLanguages } from '$lib/utils/languages.js';

  let props = $props();
  let showProps = $state(false);

  let highlightedJson = $derived.by(() =>
    typeof highlightedPropsJson === 'string' && highlightedPropsJson.length > 0
      ? highlightedPropsJson
      : JSON.stringify(props.data ?? props, null, 2)
  );

  function clearCache() {
    try {
      localStorage.clear();
      toast.success("Cache cleared successfully");
      // Reload the page to reinitialize everything
      window.location.reload();
    } catch (error) {
      toast.error("Failed to clear cache");
      console.error("Error clearing cache:", error);
    }
  }

  function addDefaultLanguages() {
    Object.keys(defaultLanguages).forEach(code => userStore.addLanguage(code));
    toast.success("Added default languages");
  }

  function resetLanguages() {
    // Remove all, then add defaults
    userStore.user.selectedLanguages.slice().forEach(code => userStore.removeLanguage(code));
    Object.keys(defaultLanguages).forEach(code => userStore.addLanguage(code));
    toast.success("Reset to default languages");
  }

  function clearAllLanguages() {
    userStore.user.selectedLanguages.slice().forEach(code => userStore.removeLanguage(code));
    toast.success("Cleared all languages");
  }

  function toggleShowProps() {
    showProps = !showProps;
  }

  function getHighlightedJson() {
    return highlightedJson;
  }
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger asChild let:builder>
    <Button
      variant="outline"
      size="icon"
      class="rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-white dark:bg-gray-800"
      builders={[builder]}
    >
      <Settings class="h-5 w-5" />
    </Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content class="w-48">
    <DropdownMenu.Item on:click={addDefaultLanguages}>
      Add Default Languages
    </DropdownMenu.Item>
    <DropdownMenu.Item on:click={resetLanguages}>
      Reset to Defaults
    </DropdownMenu.Item>
    <DropdownMenu.Item class="text-destructive" on:click={clearAllLanguages}>
      Clear All Languages
    </DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item class="text-destructive" on:click={clearCache}>
      Clear Cache
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>

<Button
  variant="outline"
  size="icon"
  class="rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-white dark:bg-gray-800"
  onclick={toggleShowProps}
  style="margin-right: 0.5em;"
>
  <span title={showProps ? 'Hide Props' : 'Show Props'}>🧩</span>
</Button>


{#if showProps}
  <div class="floating-props-window">
    <div class="props-header">
      <span>Props</span>
      <button class="close-btn"onclick={() => showProps = !showProps} title="Close">✕</button>
    </div>
    <pre class="props-json" tabindex="0"><code class="language-json">{@html getHighlightedJson()}</code></pre>
  </div>
{/if}

<style>
.floating-props-window {
  position: fixed;
  bottom: 5.5em;
  right: 1.5em;
  z-index: 2000;
  background: #18181b;
  color: #e0e7ef;
  border-radius: 10px;
  box-shadow: 0 4px 24px 0 rgba(55,48,163,0.18);
  padding: 1em 1.2em 1em 1em;
  min-width: 260px;
  max-width: 90vw;
  max-height: 60vh;
  overflow: auto;
  font-size: 1em;
  border: 1.5px solid #6366f1;
  animation: fadeIn 0.2s;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.props-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 1.08em;
  margin-bottom: 0.5em;
  color: #a5b4fc;
}
.close-btn {
  background: none;
  border: none;
  color: #fca5a5;
  font-size: 1.1em;
  cursor: pointer;
  padding: 0 0.2em;
  border-radius: 3px;
  transition: background 0.15s;
}
.close-btn:hover {
  background: #27272a;
}
.props-json {
  background: #232336;
  border-radius: 6px;
  padding: 0.7em 1em;
  font-size: 0.98em;
  font-family: 'JetBrains Mono', 'Fira Mono', 'Menlo', 'monospace';
  overflow-x: auto;
  white-space: pre-wrap;
}
.json-key     { color: #a5b4fc; }
.json-string  { color: #a5ffb7; }
.json-number  { color: #facc15; }
.json-boolean { color: #fca5a5; }
.json-null    { color: #f472b6; }
@media (max-width: 600px) {
  .floating-props-window {
    right: 0.5em;
    left: 0.5em;
    min-width: unset;
    max-width: 98vw;
    font-size: 0.95em;
    padding: 0.7em 0.5em 0.7em 0.5em;
  }
}

</style>
