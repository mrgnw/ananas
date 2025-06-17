<script>
  import { getContext } from 'svelte';
  import { page } from '$app/stores';
  import { Button } from "$lib/components/ui/button";
  import { Bug, Code, Settings, Languages, Trash2 } from 'lucide-svelte';
  import { toast } from "svelte-sonner";
  import { defaultLanguages } from '$lib/utils/languages.js';

  // Get user store from context
  const userStore = getContext('user');

  // Get props from page data for debug functionality
  let props = $props();
  let showProps = $state(true);

  let highlightedJson = $derived.by(() => {
    return JSON.stringify(props.data ?? props, null, 2);
  });

  function getHighlightedJson() {
    return highlightedJson;
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(highlightedJson);
  }

  // Settings functions moved from user page
  function clearCache() {
    try {
      localStorage.clear();
      toast.success("Cache cleared successfully");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to clear cache");
      console.error("Error clearing cache:", error);
    }
  }

  function addDefaultLanguages() {
    Object.keys(defaultLanguages).forEach(code => userStore.addLanguage(code));
    toast.success("Added default languages");
  }

  function resetLanguages() {
    userStore.user.selectedLanguages.slice().forEach(code => userStore.removeLanguage(code));
    Object.keys(defaultLanguages).forEach(code => userStore.addLanguage(code));
    toast.success("Reset to default languages");
  }

  function clearAllLanguages() {
    userStore.user.selectedLanguages.slice().forEach(code => userStore.removeLanguage(code));
    toast.success("Cleared all languages");
  }
</script>

<svelte:head>
  <title>Debug - Ananas</title>
</svelte:head>

<section class="debug-page">
  <div class="debug-header">
    <h1><Bug size={24} style="display: inline; margin-right: 0.5rem;" />Debug Tools</h1>
    <p>Development and debugging utilities</p>
  </div>

  <div class="debug-section">
    <h2><Code size={20} style="display: inline; margin-right: 0.5rem;" />Page Props</h2>
    <div class="debug-controls">
      <Button variant="outline" onclick={() => showProps = !showProps}>
        {showProps ? 'Hide Props' : 'Show Props'}
      </Button>
      <Button variant="outline" onclick={copyToClipboard}>
        Copy Props
      </Button>
    </div>
    
    {#if showProps}
      <div class="props-display">
        <pre class="props-json"><code>{@html getHighlightedJson()}</code></pre>
      </div>
    {/if}
  </div>

  <div class="debug-section">
    <h2><Settings size={20} style="display: inline; margin-right: 0.5rem;" />Development Settings</h2>
    
    <div class="settings-subsection">
      <h3><Languages size={18} style="display: inline; margin-right: 0.5rem;" />Language Management</h3>
      <div class="settings-buttons">
        <Button variant="outline" onclick={addDefaultLanguages}>
          Add Default Languages
        </Button>
        <Button variant="outline" onclick={resetLanguages}>
          Reset to Defaults
        </Button>
        <Button variant="destructive" onclick={clearAllLanguages}>
          Clear All Languages
        </Button>
      </div>
    </div>

    <div class="settings-subsection">
      <h3><Trash2 size={18} style="display: inline; margin-right: 0.5rem;" />System</h3>
      <div class="settings-buttons">
        <Button variant="destructive" onclick={clearCache}>
          Clear Cache & Reload
        </Button>
      </div>
    </div>
  </div>

  <div class="debug-section">
    <h2>Page Information</h2>
    <div class="info-grid">
      <div class="info-item">
        <strong>Current Route:</strong>
        <span>{$page.route.id || 'Unknown'}</span>
      </div>
      <div class="info-item">
        <strong>URL:</strong>
        <span>{$page.url.pathname}</span>
      </div>
      <div class="info-item">
        <strong>Search Params:</strong>
        <span>{$page.url.search || 'None'}</span>
      </div>
      <div class="info-item">
        <strong>Selected Languages:</strong>
        <span>{userStore.user.selectedLanguages?.join(', ') || 'None'}</span>
      </div>
    </div>
  </div>
</section>

<style>
.debug-page {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background: rgba(255,255,255,0.95);
  border-radius: 1.2rem;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.07);
}

.debug-header {
  margin-bottom: 2rem;
  text-align: center;
}

.debug-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.debug-header p {
  margin: 0;
  color: #666;
  font-size: 1.1rem;
}

.debug-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
}

.debug-section h2 {
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.debug-controls {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.props-display {
  margin-top: 1rem;
}

.props-json {
  background: #1e1e1e;
  color: #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  font-size: 0.9rem;
  font-family: 'JetBrains Mono', 'Fira Code', 'Menlo', monospace;
  overflow-x: auto;
  white-space: pre-wrap;
  border: 1px solid #333;
  max-height: 400px;
  overflow-y: auto;
}

.info-grid {
  display: grid;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.info-item strong {
  color: #374151;
  font-weight: 600;
}

.info-item span {
  color: #6b7280;
  font-family: monospace;
  font-size: 0.9rem;
}

.settings-subsection {
  margin-bottom: 1.5rem;
}

.settings-subsection h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
}

.settings-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

@media (max-width: 600px) {
  .debug-page {
    margin: 1rem;
    padding: 1rem;
  }
  
  .debug-controls,
  .settings-buttons {
    flex-direction: column;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>