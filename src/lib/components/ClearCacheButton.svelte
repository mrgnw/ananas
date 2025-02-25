<script>
  import { Button } from "$lib/components/ui/button";
  import { Settings } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";

  function clearCache() {
    try {
      localStorage.clear();
      toast.success("Cache cleared successfully");
    } catch (error) {
      toast.error("Failed to clear cache");
      console.error("Error clearing cache:", error);
    }
  }
</script>

<div class="fixed bottom-4 right-4">
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
      <DropdownMenu.Item on:click={clearCache}>
        Clear Cache
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>
