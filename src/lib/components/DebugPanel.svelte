<script lang="ts">
    // Use proper Svelte 5 rune syntax for props
    const props = $props<{
        visible?: boolean;
        title?: string;
        data?: Record<string, any>;
    }>();

    // Default values for props
    const visible = $derived(props.visible ?? false);
    const title = $derived(props.title ?? 'Debug Information');
    const data = $derived(props.data ?? {});
</script>

<div class="mt-8 border-t border-gray-200 pt-4">
    <details class="cursor-pointer" open={visible}>
        <summary class="mb-2 font-medium text-gray-700">{title}</summary>
        <div class="rounded border bg-gray-50 p-4 font-mono text-xs">
            {#if data && Object.keys(data).length > 0}
                {#each Object.entries(data) as [key, value]}
                    <div class="mb-2">
                        <div class="font-semibold">{key}:</div>
                        <div class="ml-4">
                            {#if typeof value === 'object' && value !== null}
                                {#each Object.entries(value) as [subKey, subValue]}
                                    <div>
                                        {subKey}: 
                                        {#if typeof subValue === 'object' && subValue !== null && Array.isArray(subValue)}
                                            <span>{subValue.length} items</span>
                                            {#if subValue.length > 0}
                                                <ul class="ml-4 mt-1">
                                                    {#each subValue as item}
                                                        <li>
                                                            {#if typeof item === 'object' && item !== null}
                                                                {JSON.stringify(item)}
                                                            {:else}
                                                                {item}
                                                            {/if}
                                                        </li>
                                                    {/each}
                                                </ul>
                                            {/if}
                                        {:else}
                                            {subValue}
                                        {/if}
                                    </div>
                                {/each}
                            {:else}
                                {value}
                            {/if}
                        </div>
                    </div>
                {/each}
            {:else}
                <div class="text-gray-400">No data available</div>
            {/if}
        </div>
    </details>
</div>
