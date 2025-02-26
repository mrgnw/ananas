<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Bug } from "lucide-svelte";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import * as Dialog from "$lib/components/ui/dialog";
  
  const props = $props<{
    data?: Record<string, any>;
    title?: string;
  }>();
  
  const title = $derived(props.title ?? 'Debug Information');
  const data = $derived(props.data ?? {});
  
  let dialogOpen = $state(false);
  
  function formatValue(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }
</script>

<div class="fixed bottom-4 left-4">
  <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild let:builder>
      <Button
        variant="outline"
        size="icon"
        class="rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-white dark:bg-gray-800"
        builders={[builder]}
      >
        <Bug class="h-5 w-5" />
      </Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content class="w-48">
      <DropdownMenu.Label>Debug Options</DropdownMenu.Label>
      <DropdownMenu.Item on:click={() => dialogOpen = true}>
        View Debug Info
      </DropdownMenu.Item>
      <DropdownMenu.Item on:click={() => console.log('Debug data:', data)}>
        Log to Console
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>

<Dialog.Root bind:open={dialogOpen}>
  <Dialog.Content class="max-w-3xl max-h-[80vh] overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>{title}</Dialog.Title>
    </Dialog.Header>
    
    <div class="font-mono text-xs overflow-x-auto">
      {#if data && Object.keys(data).length > 0}
        {#each Object.entries(data) as [key, value]}
          <div class="mb-4">
            <h3 class="font-semibold text-sm mb-1">{key}</h3>
            <div class="bg-gray-50 p-3 rounded border">
              {#if typeof value === 'object' && value !== null}
                {#each Object.entries(value) as [subKey, subValue]}
                  <div class="mb-2">
                    <div class="font-medium">{subKey}:</div>
                    <div class="ml-4">
                      {#if typeof subValue === 'object' && subValue !== null && Array.isArray(subValue)}
                        <div>{subValue.length} items</div>
                        {#if subValue.length > 0}
                          <ul class="ml-4 list-disc">
                            {#each subValue as item}
                              <li class="mb-1">
                                {#if typeof item === 'object' && item !== null}
                                  <pre class="whitespace-pre-wrap break-all">{formatValue(item)}</pre>
                                {:else}
                                  {item}
                                {/if}
                              </li>
                            {/each}
                          </ul>
                        {/if}
                      {:else if typeof subValue === 'object' && subValue !== null}
                        <pre class="whitespace-pre-wrap break-all">{formatValue(subValue)}</pre>
                      {:else}
                        {formatValue(subValue)}
                      {/if}
                    </div>
                  </div>
                {/each}
              {:else}
                {formatValue(value)}
              {/if}
            </div>
          </div>
        {/each}
      {:else}
        <div class="text-gray-400">No debug data available</div>
      {/if}
    </div>
    
    <Dialog.Footer>
      <Button on:click={() => dialogOpen = false}>Close</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
