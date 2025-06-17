<script>
  import { getContext } from 'svelte';
  import { page } from '$app/stores';
  import { toast } from "svelte-sonner";
  import { defaultLanguages } from '$lib/utils/languages.js';
  import { Copy } from 'lucide-svelte';

  const userStore = getContext('user');
  let props = $props();

  let highlightedJson = $derived.by(() => {
    return JSON.stringify(props.data ?? props, null, 2);
  });

  function copyToClipboard() {
    navigator.clipboard.writeText(highlightedJson);
    toast.success("Props copied");
  }

  function clearCache() {
    localStorage.clear();
    toast.success("Cache cleared");
    window.location.reload();
  }

  function addDefaultLanguages() {
    Object.keys(defaultLanguages).forEach(code => userStore.addLanguage(code));
    toast.success("Added default languages");
  }

  function resetLanguages() {
    userStore.user.selectedLanguages.slice().forEach(code => userStore.removeLanguage(code));
    Object.keys(defaultLanguages).forEach(code => userStore.addLanguage(code));
    toast.success("Reset languages");
  }

  function clearAllLanguages() {
    userStore.user.selectedLanguages.slice().forEach(code => userStore.removeLanguage(code));
    toast.success("Cleared languages");
  }
</script>

<svelte:head>
  <title>Debug</title>
</svelte:head>

<div class="debug">
  <div class="info">
    <div>languages: {userStore.user.selectedLanguages?.join(' ') || 'none'}</div>
  </div>

  <div class="actions">
    <a href="#" onclick={addDefaultLanguages}>+defaults</a> <a href="#" onclick={resetLanguages}>reset</a> <a href="#" onclick={clearAllLanguages}>clear</a>
    <br>
    <a href="#" onclick={clearCache}>clear cache</a>
  </div>

  <div class="props-container">
    <pre class="props">{highlightedJson}</pre>
    <button class="copy-btn" onclick={copyToClipboard} title="Copy">
      <Copy size={16} />
    </button>
  </div>
</div>

<style>
.debug {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  font-family: monospace;
  line-height: 1.5;
}

.actions {
  margin-bottom: 2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.actions a {
  color: #3730a3;
  text-decoration: none;
  padding: 0.25rem 0;
  border-bottom: 1px solid transparent;
}

.actions a:hover {
  border-bottom-color: #3730a3;
}

.info {
  margin-bottom: 2rem;
  color: #666;
}

.info div {
  margin-bottom: 0.5rem;
}

.props-container {
  position: relative;
}

.props {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 1rem;
  font-size: 0.875rem;
  overflow-x: auto;
  white-space: pre-wrap;
}

.copy-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.copy-btn:hover {
  opacity: 1;
}

@media (max-width: 600px) {
  .debug {
    margin: 1rem;
    padding: 1rem;
  }
  
  .actions {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>