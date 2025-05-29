<script>
  let { children, class: className = '' } = $props();
</script>

<div class="translator-layout {className}">
  {@render children()}
</div>

<style>
  .translator-layout {
    min-height: 100vh;
    min-height: 100dvh;
    display: grid;
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Desktop Layout - Top to Bottom Flow */
  @media (min-width: 768px) {
    .translator-layout {
      grid-template-rows: auto 1fr;
      gap: 1rem;
    }
  }

  /* Mobile Layout - Bottom to Top Flow */
  @media (max-width: 767px) {
    .translator-layout {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      grid-template-rows: 1fr auto;
      gap: 0;
      touch-action: manipulation;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
      overscroll-behavior: contain;
    }
  }
</style>