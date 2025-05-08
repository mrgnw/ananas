<script>
  import { userStore } from '$lib/stores/user.svelte.js';
  import TranslationInput from '$jibs/TranslationInput.svelte';
  import MultiLangCard from '$jibs/MultiLangCard.svelte';

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
      {#if result}
        <MultiLangCard translation={{ translations: result }} />
      {/if}

  </main>

  <style>
      </style>