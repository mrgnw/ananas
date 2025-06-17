<script>
  import { getContext } from 'svelte';
  import { toast } from "svelte-sonner";
  import { defaultLanguages } from '$lib/utils/languages.js';
  import { Copy } from 'lucide-svelte';

  const userStore = getContext('user');
  let { data } = $props();

  // Raw JSON for copying
  let rawJson = $derived.by(() => {
    const { highlightedPropsJson, ...propsData } = data;
    return JSON.stringify(propsData, null, 2);
  });

  function copyToClipboard() {
    navigator.clipboard.writeText(rawJson);
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
    <div><b>languages</b> {data.user?.selectedLanguages?.join(' ') || userStore.user.selectedLanguages?.join(' ') || 'none'}</div>
  </div>

  <div class="actions">
    <a href="#" onclick={addDefaultLanguages}>+defaults</a> <a href="#" onclick={resetLanguages}>reset</a> <a href="#" onclick={clearAllLanguages}>clear</a>
    <br>
    <a href="#" onclick={clearCache}>clear cache</a>
  </div>

  <div class="props-container">
    <div class="props">{@html data.highlightedPropsJson}</div>
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

.actions a {
  color: #3730a3;
  text-decoration: none;
  border-bottom: 1px solid transparent;
}

.actions a:hover {
  border-bottom-color: #3730a3;
}

.info {
  color: #666;
}

.props-container {
  position: relative;
}

.props {
  border-radius: 4px;
  overflow-x: auto;
}

.props :global(pre) {
  margin: 0;
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