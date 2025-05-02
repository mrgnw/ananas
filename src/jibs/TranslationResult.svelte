<script>
  export let result = null;
  import MultiLangCard from '$jibs/MultiLangCard.svelte';
</script>

{#if result}
  <h2 class="mt-4 text-lg font-bold">Results</h2>
  <MultiLangCard translation={{ translations: result }} />
  <ul class="mt-2 space-y-2">
    {#each Object.entries(result) as [key, value]}
      <li>
        <strong>{key}:</strong>
        {#if typeof value === 'object' && value !== null}
          <pre class="bg-gray-100 rounded p-2 text-xs overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>
        {:else}
          {value}
        {/if}
      </li>
    {/each}
  </ul>
{/if}
