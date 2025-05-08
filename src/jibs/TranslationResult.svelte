<script>
  export let result = null;
  import MultiLangCard from '$jibs/MultiLangCard.svelte';
</script>

{#if result}
  <h2 class="mt-4 text-lg font-bold">Results</h2>
  <MultiLangCard translation={{ translations: result }} />
{/if}
