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
      <div class="result centered-result">
        <MultiLangCard translation={{ translations: result }} />
      </div>
      {/if}

  </main>

  <style>
  .centered-result {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    width: 100%;
  }
  </style>