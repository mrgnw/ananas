<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Bug } from "lucide-svelte";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import { onMount } from "svelte";
  
  const props = $props<{
    data?: Record<string, any>;
    title?: string;
  }>();
  
  const title = $derived(props.title ?? 'Country Info');
  const data = $derived(props.data ?? {});
  
  // Get headers from top-level allHeaders property
  const allHeaders = $derived(data.allHeaders || {});
  
  // Extract just the country code
  const countryCode = $derived(allHeaders['cf-ipcountry'] || data.ip_country || 'Unknown');
  
  // Count headers for display
  const headerCount = $derived(Object.keys(allHeaders).length);
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
  <DropdownMenu.Content class="w-48">
    <DropdownMenu.Label>{title}</DropdownMenu.Label>
    
    <div class="p-3 font-mono">
      <!-- Show just the country code and header count -->
      <div class="text-center mb-2">
        <div class="text-2xl font-bold text-blue-700">{countryCode}</div>
        <div class="text-xs text-gray-500">Headers: {headerCount}</div>
      </div>
      
      <!-- Show just the cf-ipcountry value if expanded -->
      <div class="mt-2 text-xs">
        <div class="font-semibold">cf-ipcountry:</div>
        <div class="bg-gray-50 p-2 rounded border overflow-hidden">{allHeaders['cf-ipcountry'] || 'Not available'}</div>
      </div>
    </div>
    
    <DropdownMenu.Separator />
    <DropdownMenu.Item on:click={() => console.log('Raw Headers:', allHeaders)}>
      Log All Headers to Console
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
