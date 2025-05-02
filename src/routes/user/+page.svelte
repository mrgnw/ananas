<script>
  import { userStore } from '$lib/stores/user.svelte.js';
</script>

<h1>User Info</h1>
<h3>Selected languages:</h3>
<ul>
  {#each userStore.user.selectedLanguages as code}
    <li>
      <button on:click={() => userStore.removeLanguage(code)} style="margin-right: 1em">Remove</button>
      {code}
    </li>
  {/each}
</ul>