<script>
	import { toast } from 'svelte-sonner';
	import { browser } from '$app/environment';
	import { getColorByIndex } from '$lib/colors';
	import { Copy } from 'lucide-svelte';
	import { userStore } from '$lib/stores/user.svelte.js';

	let { translation, show_langs, truncate_lines, onDelete = null, ...props } = $props();

	const deleteTranslation = () => {
		if (onDelete) {
			onDelete(translation);
		}
	};

	/**
	 * @param {string} text
	 */
	const copyToClipboard = async (text) => {
		try {
			if (browser && navigator.clipboard && navigator.clipboard.writeText) {
				await navigator.clipboard.writeText(text);
				toast.success('Copied to clipboard!');
			} else {
				// Fallback for environments where Clipboard API is not available
				const textArea = document.createElement('textarea');
				textArea.value = text;
				document.body.appendChild(textArea);
				textArea.select();
				try {
					document.execCommand('copy');
					toast.success('Copied to clipboard!');
				} catch (err) {
					console.error('Failed to copy text:', err);
					toast.error('Failed to copy text. Please copy manually.');
				}
				document.body.removeChild(textArea);
			}
		} catch (err) {
			console.error('Failed to copy text:', err);
			toast.error('Failed to copy text. Please copy manually.');
		}
	};
</script>

<div class="translation-card">
  <div class="translations-container">
    {#each userStore.user.selectedLanguages as lang, i}
      {#if translation.translations[lang]}
        {@const sourceLang = translation.translations.metadata?.src_lang || 'eng'}
        {@const isSourceLang = lang === sourceLang}
        <div class="translation-row" class:is-source={isSourceLang}>
          <div class="language-indicator {getColorByIndex(i, true)}">
            <div class="language-bar" class:source-bar={isSourceLang}></div>
          </div>
          <div class="translation-content">
            <div class="translation-text {truncate_lines ? 'line-clamp-3' : ''} break-words">
              {translation.translations[lang]}
            </div>
          </div>
          <button
            class="copy-button"
            aria-label="Copy translation"
            onclick={() => copyToClipboard(translation.translations[lang])}
          >
            <Copy class="copy-icon" />
          </button>
        </div>
      {/if}
    {/each}
  </div>
</div>

<style>
  .translation-card {
    position: relative;
    width: 100%;
    background: white;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .translations-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem 0;
  }

  .translation-row {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.5rem;
    border-radius: 0.375rem;
    transition: background-color 0.15s ease;
    position: relative;
    min-height: 2.5rem;
  }

  .translation-row:hover {
    background-color: #f8fafc;
  }

  .translation-row.is-source {
    background-color: #eff6ff;
  }

  .translation-row.is-source:hover {
    background-color: #dbeafe;
  }

  .language-indicator {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding-top: 0.125rem;
  }

  .language-bar {
    width: 3px;
    height: 1.5rem;
    border-radius: 1.5px;
    background-color: #e5e7eb;
    transition: background-color 0.15s ease;
  }

  .source-bar {
    background-color: #3b82f6;
  }

  .translation-content {
    flex: 1;
    min-width: 0;
  }

  .translation-text {
    font-size: 0.875rem;
    line-height: 1.5;
    color: #374151;
    word-break: break-word;
    hyphens: auto;
  }

  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .copy-button {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: none;
    background: none;
    color: #9ca3af;
    cursor: pointer;
    border-radius: 0.375rem;
    transition: all 0.15s ease;
    opacity: 0;
  }

  .translation-row:hover .copy-button {
    opacity: 1;
  }

  .copy-button:hover {
    background-color: #f3f4f6;
    color: #3b82f6;
  }

  .copy-button:active {
    transform: scale(0.95);
  }

  .copy-icon {
    width: 0.875rem;
    height: 0.875rem;
  }

  /* Mobile optimizations */
  @media (max-width: 640px) {
    .translation-row {
      gap: 0.5rem;
      padding: 0.375rem;
    }

    .copy-button {
      opacity: 1; /* Always show on mobile since hover doesn't work */
      width: 1.75rem;
      height: 1.75rem;
    }

    .translation-text {
      font-size: 0.8125rem;
    }
  }

  /* Touch device optimizations */
  @media (hover: none) and (pointer: coarse) {
    .copy-button {
      opacity: 1;
    }
  }
</style>
