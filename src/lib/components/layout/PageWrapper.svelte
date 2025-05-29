<script>
  let { children, class: className = '' } = $props();
</script>

<div class="page-wrapper {className}">
  {@render children()}
</div>

<style>
  .page-wrapper {
    height: calc(100vh - 120px); /* Account for fixed navbar (60px) + body padding (60px) */
    overflow-y: auto;
    overflow-x: hidden;
    padding: 1rem;
    position: relative;
    /* Override global touch-action */
    touch-action: pan-y;
    -webkit-overflow-scrolling: touch;
    /* Ensure scrolling works */
    overscroll-behavior: auto;
  }

  /* Desktop */
  @media (min-width: 768px) {
    .page-wrapper {
      padding: 2rem;
    }
  }

  /* Large Desktop */
  @media (min-width: 1024px) {
    .page-wrapper {
      padding: 2rem 3rem;
      max-width: 1200px;
      margin: 0 auto;
    }
  }

  /* Mobile - force scrolling to work */
  @media (max-width: 767px) {
    .page-wrapper {
      height: calc(100vh - 120px); /* Account for fixed navbar + body padding */
      overflow-y: scroll; /* Force scroll instead of auto */
      padding: 1rem 0.75rem;
      /* Override global CSS restrictions */
      touch-action: pan-y !important;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: auto !important;
      /* Ensure user can select text in scrollable content */
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
      user-select: text !important;
    }
  }
</style>