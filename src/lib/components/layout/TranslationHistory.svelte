<script>
  let { children } = $props();
</script>

<main class="translation-history">
  {@render children()}
</main>

<style>
  .translation-history {
    padding: 0 1rem 1rem 1rem;
    overflow-y: auto;
    touch-action: manipulation;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    overscroll-behavior: contain;
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