<script>
  import { page } from '$app/stores';
  import { Button } from "$lib/components/ui/button";
  import { Bug, Code } from 'lucide-svelte';

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

@media (max-width: 600px) {
  .debug-page {
    margin: 1rem;
    padding: 1rem;
  }
  
  .debug-controls {
    flex-direction: column;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>