<script>
  import { userStore } from '$lib/stores/user.svelte.js';
  import TranslationInput from '$jibs/TranslationInput.svelte';
  import TranslationResult from '$jibs/TranslationResult.svelte';

let error = $state('');
let result = $state(null); // Add result state to hold translation result
</script>

  <main class="translate-main">
      <TranslationInput
          bind:result
          bind:error={error}
      />
      {#if error}
          <div class="error-message">{error}</div>
      {/if}
      <TranslationResult {result} />
  </main>

  <style>
      </style>