<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Bug } from "lucide-svelte";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import { onMount } from "svelte";
  
  const props = $props<{
    data?: Record<string, any>;
    title?: string;
  }>();
  
  const title = $derived(props.title ?? 'Raw Headers');
  const data = $derived(props.data ?? {});
  
  // Enable this for additional debugging
  onMount(() => {
    console.log('[DEBUG BUTTON] Received data:', data);
    console.log('[DEBUG BUTTON] Data keys:', Object.keys(data));
    console.log('[DEBUG BUTTON] Has allHeaders?', !!data.allHeaders);
  });
  
  // Get headers from top-level allHeaders property
  const allHeaders = $derived(data.allHeaders || {});
  
  // Count headers for display
  const headerCount = $derived(Object.keys(allHeaders).length);
  
  // Check for Cloudflare headers
  const hasCfHeaders = $derived(Object.keys(allHeaders).some(key => key.startsWith('cf-')));
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger asChild let:builder>
    <Button
      variant="outline"
      size="icon"
      class="rounded-full bg-blue-100 hover:bg-blue-200"
      builders={[builder]}
    >
      <Bug class="h-5 w-5" />
    </Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content class="w-[90vw] max-w-[800px] max-h-[80vh] overflow-y-auto">
    <DropdownMenu.Label>{title}</DropdownMenu.Label>
    
    <div class="p-2 font-mono text-xs">
      <!-- Show debugging info -->
      <div class="bg-yellow-50 p-2 rounded border mb-2">
        <div>Data keys received: {Object.keys(data).join(', ')}</div>
        <div>allHeaders present: {data.allHeaders ? 'Yes' : 'No'}</div>
      </div>
      
      <!-- Show raw headers data -->
      <div class="bg-gray-50 p-2 rounded border mt-1 overflow-auto">
        <pre class="whitespace-pre-wrap break-all">{JSON.stringify(allHeaders, null, 2)}</pre>
      </div>
      
      <!-- Basic stats about the data -->
      <div class="mt-2 text-xs text-gray-500">
        Headers count: {headerCount}
        {#if hasCfHeaders}
          <span class="ml-2 text-green-600 font-bold">✓ Cloudflare headers present</span>
        {/if}
      </div>
    </div>
    
    <DropdownMenu.Separator />
    <DropdownMenu.Item on:click={() => console.log('Raw Headers:', allHeaders)}>
      Log Headers to Console
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
