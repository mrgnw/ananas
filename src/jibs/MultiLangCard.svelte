<script>
	import { toast } from 'svelte-sonner';
	import { browser } from '$app/environment';
	import { getColorByIndex } from '$lib/colors';
	import { Copy, MoreHorizontal, Trash2 } from 'lucide-svelte';
	import { userStore } from '$lib/stores/user.svelte.js';

	let { translation, show_langs, truncate_lines, onDelete = null, ...props } = $props();

	// Menu state
	let showContextMenu = $state(false);

	const deleteTranslation = () => {
		if (onDelete) {
			onDelete(translation);
		}
	};

	const toggleContextMenu = () => {
		showContextMenu = !showContextMenu;
	};

	const closeContextMenu = () => {
		showContextMenu = false;
	};

	// Handle click outside to close menu
	const handleClickOutside = (/** @type {MouseEvent} */ event) => {
		if (showContextMenu && !event.target.closest('.context-menu-container')) {
			closeContextMenu();
		}
	};

	// Handle escape key to close menu
	const handleKeydown = (/** @type {KeyboardEvent} */ event) => {
		if (event.key === 'Escape' && showContextMenu) {
			closeContextMenu();
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

<!-- Add global event listeners for click outside and escape key -->
<svelte:window onclick={handleClickOutside} onkeydown={handleKeydown} />

<div class="translation-card">
  <!-- Contextual menu button -->
  {#if onDelete}
    <div class="context-menu-container">
      <button
        class="context-menu-button"
        aria-label="More options"
        onclick={toggleContextMenu}
      >
        <MoreHorizontal class="context-menu-icon" />
      </button>
      
      <!-- Dropdown menu -->
      {#if showContextMenu}
        <div class="context-dropdown">
          <button
            class="dropdown-item delete-item"
            onclick={() => { deleteTranslation(); closeContextMenu(); }}
          >
            <Trash2 class="dropdown-icon" />
            <span>Delete</span>
          </button>
        </div>
      {/if}
    </div>
  {/if}
  
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
    overflow: visible; /* Changed from hidden to allow dropdown to show */
  }

  .context-menu-container {
    position: absolute;
    top: -0.25rem;
    right: -0.25rem;
    z-index: 20;
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

  /* Contextual menu button */
  .context-menu-button {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border: none;
    background: rgba(255, 255, 255, 0.95);
    color: #6b7280;
    cursor: pointer;
    border-radius: 0.5rem;
    transition: all 0.15s ease;
    opacity: 0;
    backdrop-filter: blur(8px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(0, 0, 0, 0.05);
  }

  .translation-card:hover .context-menu-button {
    opacity: 1;
  }

  .context-menu-button:hover {
    background: white;
    color: #374151;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
    transform: scale(1.05);
  }

  .context-menu-button:active {
    transform: scale(0.95);
  }

  .context-menu-icon {
    width: 0.875rem;
    height: 0.875rem;
  }

  /* Dropdown menu */
  .context-dropdown {
    position: absolute;
    top: calc(100% + 0.25rem);
    right: 0;
    min-width: 8rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
    z-index: 50;
    overflow: hidden;
    animation: dropdown-appear 0.15s ease-out;
  }

  @keyframes dropdown-appear {
    from {
      opacity: 0;
      transform: translateY(-0.25rem) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: none;
    background: none;
    color: #374151;
    font-size: 0.875rem;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .dropdown-item:hover {
    background-color: #f3f4f6;
  }

  .dropdown-item.delete-item:hover {
    background-color: #fef2f2;
    color: #ef4444;
  }

  .dropdown-icon {
    width: 0.875rem;
    height: 0.875rem;
    flex-shrink: 0;
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

    .context-menu-button {
      opacity: 1; /* Always show on mobile since hover doesn't work */
      width: 1.5rem;
      height: 1.5rem;
    }

    .context-menu-icon {
      width: 0.75rem;
      height: 0.75rem;
    }
  }

  /* Touch device optimizations */
  @media (hover: none) and (pointer: coarse) {
    .copy-button {
      opacity: 1;
    }

    .context-menu-button {
      opacity: 1;
    }
  }
</style>
