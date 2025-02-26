<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Bug } from "lucide-svelte";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  
  const props = $props<{
    data?: Record<string, any>;
    title?: string;
  }>();
  
  const title = $derived(props.title ?? 'Debug Information');
  const data = $derived(props.data ?? {});
  
  function formatValue(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger asChild let:builder>
    <Button
      variant="outline"
      size="icon"
      class="rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800"
      builders={[builder]}
    >
      <Bug class="h-5 w-5" />
    </Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content class="w-80 max-h-[80vh] overflow-y-auto">
    <DropdownMenu.Label>{title}</DropdownMenu.Label>
    
    <div class="p-2 font-mono text-xs">
      {#if data && Object.keys(data).length > 0}
        {#each Object.entries(data) as [key, value]}
          <div class="mb-3">
            <div class="font-semibold text-sm">{key}</div>
            <div class="bg-gray-50 p-2 rounded border mt-1">
              {#if typeof value === 'object' && value !== null}
                {#each Object.entries(value) as [subKey, subValue]}
                  <div class="mb-1">
                    <span class="font-medium">{subKey}:</span>
                    {#if typeof subValue === 'object' && subValue !== null && Array.isArray(subValue)}
                      <div class="ml-2">
                        {#if subValue.length > 0}
                          <ul class="list-disc ml-4 mt-1">
                            {#each subValue as item}
                              <li class="mb-1">
                                {#if typeof item === 'object' && item !== null}
                                  <pre class="whitespace-pre-wrap break-all text-xs">{formatValue(item)}</pre>
                                {:else}
                                  {item}
                                {/if}
                              </li>
                            {/each}
                          </ul>
                        {:else}
                          <span class="text-gray-500">Empty array</span>
                        {/if}
                      </div>
                    {:else if typeof subValue === 'object' && subValue !== null}
                      <pre class="ml-2 whitespace-pre-wrap break-all text-xs">{formatValue(subValue)}</pre>
                    {:else}
                      <span class="ml-2">{formatValue(subValue)}</span>
                    {/if}
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
    
    <DropdownMenu.Separator />
    <DropdownMenu.Item on:click={() => console.log('Debug data:', data)}>
      Log to Console
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
