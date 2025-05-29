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
    overflow-x: hidden; /* Prevent horizontal scroll */
    width: 100%;
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
      top: 0; /* Start at top, input will position itself */
      left: 0;
      right: 0;
      bottom: 0;
      grid-template-rows: 1fr auto;
      gap: 0;
      overflow-x: hidden; /* Prevent horizontal scroll */
      overflow-y: hidden; /* Let child components handle vertical scroll */
      touch-action: manipulation;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
      overscroll-behavior-x: contain; /* Only contain horizontal overscroll */
      overscroll-behavior-y: auto; /* Allow vertical overscroll for child scrolling */
      padding-top: 60px; /* Add padding instead of changing top position */
    }
  }
</style>