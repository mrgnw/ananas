<script>
  import { Button } from "$lib/components/ui/button";
  import { Settings } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import { translateLanguages } from '$lib/stores/translateLanguages.svelte.js'
  import { userStore } from '$lib/stores/user.svelte.js';
  import { defaultLanguages } from '$lib/utils/languages.js';

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
