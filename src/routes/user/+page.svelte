<script>
  import { userStore } from '$lib/stores/user.svelte.js';
  let { user } = userStore;
  function removeLanguage(code) {
    userStore.removeLanguage(code);
  }
</script>

<section class="user-info">
  <div class="user-details">
    <h3>Selected languages:</h3>
    {#if user.selectedLanguages?.length}
      <ul class="lang-list">
        {#each user.selectedLanguages as code}
          <li>
            <button class="remove-btn" onclick={() => removeLanguage(code)} title="Remove language">✕</button>
            <span class="lang-code">{code}</span>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="empty">No languages selected.</p>
    {/if}
  </div>
</section>

<style>
.user-info {
  max-width: 480px;
  margin: 2rem auto;
  background: rgba(255,255,255,0.95);
  border-radius: 1.2em;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.07);
  padding: 2em 2em 1.5em 2em;
}
.user-info h1 {
  font-size: 2rem;
  margin-bottom: 1.2em;
  text-align: center;
}
.user-details h3 {
  margin-bottom: 0.7em;
  font-weight: 600;
}
.lang-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.lang-list li {
  display: flex;
  align-items: center;
  gap: 0.7em;
  margin-bottom: 0.5em;
  background: #f3f4f6;
  border-radius: 0.7em;
  padding: 0.4em 0.9em;
  transition: background 0.15s;
}
.lang-list li:hover {
  background: #e0e7ff;
}
.remove-btn {
  background: #f87171;
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 2em;
  height: 2em;
  font-size: 1.1em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.remove-btn:hover {
  background: #dc2626;
}
.lang-code {
  font-family: monospace;
  font-size: 1.08em;
  color: #3730a3;
}
.empty {
  color: #888;
  font-style: italic;
  margin-top: 0.5em;
}
@media (max-width: 600px) {
  .user-info {
    padding: 1em 0.5em 1em 0.5em;
  }
}
</style>