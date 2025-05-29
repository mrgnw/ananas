<script>
  import { userStore } from '$lib/stores/user.svelte.js';
  import { translationHistoryStore } from '$lib/stores/translationHistory.svelte.js';
  import { Send } from 'lucide-svelte';

  let { result = $bindable() } = $props()
  let text = $state('');
  let loading = $state(false);
  let error = $state('');
  let isInputFocused = $state(false);

  async function handleTranslate() {
    error = '';
    result = null;
    if (!text.trim()) return;
    if (!userStore.user.selectedLanguages.length) {
      error = 'Please select at least one language.';
      return;
    }
    loading = true;
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          tgt_langs: userStore.user.selectedLanguages
        })
      });
      if (!res.ok) throw new Error('API error');
      result = await res.json();
      translationHistoryStore.addTranslation({
        input: text,
        output: result,
        sourceLang: 'auto',
        targetLang: userStore.user.selectedLanguages,
        timestamp: Date.now()
      });
      
      // IMMEDIATELY scroll to show new translation on mobile
      if (window.innerWidth <= 767) {
        setTimeout(() => {
          const historyEl = document.querySelector('.translation-history');
          if (historyEl) {
            console.log('SCROLLING TO SHOW NEW TRANSLATION');
            historyEl.scrollTop = historyEl.scrollHeight;
          }
        }, 100);
      }
      
      text = '';
    } catch (e) {
      error = e.message || 'Unknown error';
    } finally {
      loading = false;
    }
  }

  function handleFocus() { isInputFocused = true; }
  function handleBlur() { isInputFocused = false; }
</script>

<main class="translate-main">
  <form class="input-form" onsubmit={e => { e.preventDefault(); handleTranslate(); }}>
    <div class="input-container {isInputFocused ? 'focused' : ''} {loading ? 'loading' : ''}">
      <input
        class="translate-input"
        type="text"
        placeholder="Enter text to translate..."
        bind:value={text}
        onfocus={handleFocus}
        onblur={handleBlur}
        disabled={loading}
        autocomplete="off"
        spellcheck="true"
        aria-label="Text to translate"
      />
      <button
        type="submit"
        class="send-btn"
        disabled={loading || !text.trim()}
        aria-label={loading ? 'Translating...' : 'Translate'}
      >
        {#if loading}
          <span class="spinner"></span>
        {:else}
          <Send class="send-icon" />
        {/if}
      </button>
    </div>
  </form>
  
</main>

<style>
.translate-main {
  max-width: 520px;
  margin: 0 auto;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  /* Prevent horizontal overflow */
  overflow-x: hidden;
  width: 100%;
}
.input-form {
  width: 100%;
}
.input-container {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 999px;
  border: 2px solid #e5e7eb;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.04);
  padding: 0.25em 0.5em 0.25em 1.2em;
  transition: border-color 0.18s, box-shadow 0.18s;
  position: relative;
  /* Prevent horizontal overflow and scrolling */
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  touch-action: manipulation; /* Prevent unwanted touch gestures */
}
.input-container.focused {
  border-color: #3730a3;
  box-shadow: 0 4px 24px 0 rgba(55,48,163,0.10);
}
.input-container.loading {
  opacity: 0.7;
}
.translate-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 1.25rem;
  padding: 0.7em 0.5em 0.7em 0;
  color: #232323;
  font-weight: 500;
  letter-spacing: -0.01em;
  min-width: 0;
}
.send-btn {
  background: #3730a3;
  color: #fff;
  border: none;
  border-radius: 999px;
  width: 2.5em;
  height: 2.5em;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.5em;
  font-size: 1.2em;
  box-shadow: 0 2px 8px 0 rgba(55,48,163,0.10);
  transition: background 0.15s, box-shadow 0.15s, color 0.15s;
  cursor: pointer;
  position: absolute;
  right: 0.5em;
  top: 50%;
  transform: translateY(-50%);
}
.send-btn:disabled {
  background: #e5e7eb;
  color: #bdbdbd;
  cursor: not-allowed;
  box-shadow: none;
}
.send-btn:hover:not(:disabled), .send-btn:focus-visible:not(:disabled) {
  background: #4f46e5;
  color: #fff;
  box-shadow: 0 4px 16px 0 rgba(55,48,163,0.13);
}
.send-icon {
  width: 1.3em;
  height: 1.3em;
}
.spinner {
  width: 1.3em;
  height: 1.3em;
  border: 2px solid #fff;
  border-top: 2px solid #3730a3;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.error-message {
  color: #dc2626;
  background: none;
  border-radius: 0.5em;
  padding: 0.5em 0.7em;
  margin: 1em 0 0.5em 0;
  text-align: center;
  font-size: 1.05em;
}
:global(.translation-result) {
  margin-top: 1.2em;
}
@media (max-width: 600px) {
  .translate-main {
    padding: 0 0.3em;
  }
  .translate-input {
    font-size: 1.05rem;
    padding: 0.6em 0.3em 0.6em 0;
  }
  .input-container {
    padding: 0.15em 0.2em 0.15em 0.7em;
  }
}
</style>
