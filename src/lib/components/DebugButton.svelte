<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Bug } from "lucide-svelte";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import { onMount } from "svelte";
  
  const props = $props<{
    data?: Record<string, any>;
    title?: string;
  }>();
  
  const title = $derived(props.title ?? 'Debug Information');
  const data = $derived(props.data ?? {});
  
  // Log received data on mount
  onMount(() => {
    console.log('[DEBUG BUTTON] Received data keys:', Object.keys(data));
    if (data.headers) {
      console.log('[DEBUG BUTTON] Headers available:', Object.keys(data.headers).length);
    } else {
      console.log('[DEBUG BUTTON] No headers object found in data');
    }
  });
  
  // Determine which headers object to use (supporting both data.headers and data.allHeaders)
  const headers = $derived(() => {
    if (data.headers) return data.headers;
    if (data.allHeaders) return data.allHeaders;
    return null;
  });
  
  // Add fallback debugging info if headers are missing
  const debugInfo = $derived(() => {
    return {
      dataAvailable: Object.keys(data).length > 0,
      headersAvailable: headers ? Object.keys(headers).length : 0,
      timestamp: new Date().toISOString()
    };
  });
  
  // Check if we have Cloudflare-specific headers
  const hasCfHeaders = $derived(() => {
    if (!headers) return false;
    return Object.keys(headers).some(key => key.startsWith('cf-'));
  });
  
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
      <!-- Diagnostic Information -->
      <div class="mb-3 bg-yellow-50 p-2 rounded border">
        <div class="font-semibold text-sm text-yellow-700">Diagnostic Info</div>
        <div class="mt-1">
          <div>Data keys: {Object.keys(data).join(', ') || 'none'}</div>
          <div>Headers: {headers ? Object.keys(headers).length : 'Not available'}</div>
          <div>CF detected: {hasCfHeaders ? 'Yes' : 'No'}</div>
          <div>Timestamp: {debugInfo.timestamp}</div>
        </div>
      </div>
    
      {#if data && Object.keys(data).length > 0}
        {#if data.ip_country}
          <div class="mb-3 bg-blue-50 p-2 rounded border">
            <div class="font-semibold text-sm text-blue-700">Cloudflare Country</div>
            <div class="mt-1">
              <div class="text-lg font-bold">{data.ip_country || 'Not available'}</div>
              {#if data.country_phone}
                <div class="text-sm">Phone Code: {data.country_phone}</div>
              {/if}
            </div>
          </div>
        {/if}
        
        {#if headers}
          <div class="mb-3">
            <div class="font-semibold text-sm text-green-700">HTTP Headers {hasCfHeaders ? '✓ Cloudflare Detected' : ''}</div>
            <div class="bg-gray-50 p-2 rounded border mt-1 max-h-80 overflow-y-auto">
              <input 
                type="text" 
                placeholder="Filter headers..." 
                class="w-full p-1 mb-2 border rounded text-xs"
                on:input={(e) => {
                  const value = e.target.value.toLowerCase();
                  const rows = document.querySelectorAll('tr.header-row');
                  rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(value) ? '' : 'none';
                  });
                }}
              />
              <table class="w-full text-left">
                <thead>
                  <tr>
                    <th class="pb-1 border-b">Header</th>
                    <th class="pb-1 border-b">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {#each Object.entries(headers) as [key, value]}
                    <tr class="border-b border-gray-100 header-row {key.startsWith('cf-') ? 'bg-blue-50' : ''}">
                      <td class="pr-2 py-1 font-medium">{key}</td>
                      <td class="py-1 break-all">{value}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}
        
        {#each Object.entries(data) as [key, value]}
          {#if key !== 'headers' && key !== 'allHeaders' && key !== 'ip_country' && key !== 'country_phone'}
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
          {/if}
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
