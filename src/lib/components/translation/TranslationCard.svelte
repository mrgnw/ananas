<script>
  import MultiLangCard from '$jibs/MultiLangCard.svelte';

  let { translation, index, onDelete, translationId } = $props();
</script>

<MultiLangCard 
  translation={{ translations: translation.output }} 
  show_langs={true}
  {onDelete}
  truncate_lines={true}
  timestamp={translation.timestamp}
  originalText={translation.input}
  {translationId}
/>