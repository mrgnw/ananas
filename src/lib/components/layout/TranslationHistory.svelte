<script>
  import { onMount, setContext } from 'svelte';
  
  let { children } = $props();
  let historyContainer = $state();

  // Provide scroll container to children
  setContext('scrollContainer', historyContainer);

  // On mobile, scroll to bottom by default since newest items appear there
  onMount(() => {
    if (historyContainer && window.innerWidth <= 767) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        historyContainer.scrollTop = historyContainer.scrollHeight;
      }, 100);
    }
  });

  // Export function to scroll to bottom
  export function scrollToBottom() {
    if (historyContainer) {
      historyContainer.scrollTop = historyContainer.scrollHeight;
    }
  }
</script>

<main class="translation-history" bind:this={historyContainer}>
  {@render children()}
</main>

<style>
  .translation-history {
    padding: 0 1rem 1rem 1rem;
    overflow-y: auto;
    height: 100%;
    /* Fix scrolling */
    touch-action: pan-y;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: auto;
    /* Allow text selection */
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
    user-select: text;
  }

  /* Desktop Layout */
  @media (min-width: 768px) {
    .translation-history {
      padding: 0 2rem 2rem 2rem;
    }
  }

  /* Large Desktop */
  @media (min-width: 1024px) {
    .translation-history {
      padding: 0 3rem 2rem 3rem;
    }
  }

  /* Mobile Layout */
  @media (max-width: 767px) {
    .translation-history {
      order: 1;
      padding: 1rem 0.75rem 0.5rem 0.75rem;
      overflow-y: scroll !important;
      touch-action: pan-y !important;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: auto !important;
    }
  }

  /* Allow text selection inside translation content */
  :global(.translation-history .translation-text),
  :global(.translation-history [contenteditable]) {
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
    user-select: text;
  }
</style>