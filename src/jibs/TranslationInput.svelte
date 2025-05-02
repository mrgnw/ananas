<script>
  export let text = '';
  export let loading = false;
  export let onTranslate;

  function handleSubmit(e) {
    e.preventDefault();
    if (onTranslate) onTranslate();
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <textarea bind:value={text} rows="3" class="w-full border rounded p-2" placeholder="Enter text to translate"></textarea>
  <button type="submit" class="mt-2 px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>
    {loading ? 'Translating...' : 'Translate'}
  </button>
</form>
