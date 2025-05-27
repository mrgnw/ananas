<script>
	import { toast } from 'svelte-sonner';
	import { browser } from '$app/environment';
	import { getColorByIndex } from '$lib/colors';
	import { getEnglishName } from '$lib/utils/languages.js';
	import { Copy, Trash2, Clock } from 'lucide-svelte';
	import { userStore } from '$lib/stores/user.svelte.js';
	import { slide } from 'svelte/transition';

	let { translation, show_langs, truncate_lines, onDelete = null, timestamp = null, originalText = null, ...props } = $props();

	// Original text hover state
	let showOriginal = $state(false);
	let cardContainer = $state();

	// Check if original text matches any translation
	const originalMatchesTranslation = $derived(() => {
		if (!originalText) return null;
		
		for (const lang of userStore.user.selectedLanguages) {
			if (translation.translations[lang] && translation.translations[lang].trim() === originalText.trim()) {
				return lang;
			}
		}
		return null;
	});

	// Check if original text differs from target in the same language
	const originalDiffersFromTarget = $derived(() => {
		if (!originalText) return null;
		
		// First, try to get the source language from metadata
		let detectedSourceLang = translation.translations.metadata?.src_lang;
		
		// If src_lang is null, we need to intelligently detect the source language
		if (!detectedSourceLang && translation.translations.source) {
			const sourceText = translation.translations.source.trim();
			const inputText = originalText.trim();
			
			// Only proceed if source matches input (confirming this is the original text)
			if (sourceText === inputText) {
				// Strategy: Find a target language that has been "corrected"
				// Look for languages where the output differs from input but in the same language family
				
				// First, check if any target language has a very similar but different output
				// This would indicate it's the same language but "improved"
				for (const lang of userStore.user.selectedLanguages) {
					const langTranslation = translation.translations[lang];
					if (langTranslation && langTranslation.trim() !== inputText) {
						// Check if this could be a "correction" in the same language
						// For now, we'll use a simple heuristic: if the translation
						// contains similar words or structure, it might be a correction
						
						// Simple word overlap check (this could be improved)
						const inputWords = inputText.toLowerCase().split(/\s+/);
						const translationWords = langTranslation.toLowerCase().split(/\s+/);
						
						let commonWords = 0;
						for (const word of inputWords) {
							if (translationWords.includes(word)) {
								commonWords++;
							}
						}
						
						// If there's significant word overlap, this might be a correction
						const overlapRatio = commonWords / Math.max(inputWords.length, 1);
						if (overlapRatio > 0.3) { // 30% word overlap threshold
							detectedSourceLang = lang;
							break;
						}
					}
				}
				
				// Fallback: if no clear correction found, don't highlight anything
				// This is more conservative but avoids false positives
			}
		}
		
		// Only return the source language if we're confident it was corrected
		if (detectedSourceLang) {
			const sourceTranslation = translation.translations[detectedSourceLang];
			if (sourceTranslation && sourceTranslation.trim() !== originalText.trim()) {
				return detectedSourceLang;
			}
		}
		
		return null;
	});

	// Only show separate original row if it doesn't match any existing translation OR when hovering source language that differs
	const shouldShowSeparateOriginal = $derived(() => {
		if (!originalText) return false;
		
		// Show if original doesn't match any translation and card is hovered
		if (!originalMatchesTranslation() && showOriginal) return true;
		
		// Show if hovering over source language that differs from original
		const sourceLang = translation.translations.metadata?.src_lang;
		if (hoveredLanguage === sourceLang && originalDiffersFromTarget() === sourceLang) {
			return true;
		}
		
		return false;
	});

	// State for tracking which language row is being hovered
	let hoveredLanguage = $state(null);
	
	// State for original text popover
	let showOriginalPopover = $state(false);
	let popoverLanguage = $state(null);

	const deleteTranslation = () => {
		if (onDelete) {
			onDelete(translation);
		}
	};

	// Format timestamp for display
	/**
	 * @param {number | null} timestamp
	 */
	const formatTimestamp = (timestamp) => {
		if (!timestamp) return '';
		const date = new Date(timestamp);
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
		
		if (date >= today) {
			return `Today at ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
		} else if (date >= yesterday) {
			return `Yesterday at ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
		} else {
			return date.toLocaleDateString(undefined, { 
				month: 'short', 
				day: 'numeric',
				hour: '2-digit', 
				minute: '2-digit' 
			});
		}
	};

	// Handle escape key to close modal
	const handleKeydown = (/** @type {KeyboardEvent} */ event) => {
		// Reserved for future modal functionality
	};

	// Original text visibility handlers
	const handleMouseEnter = () => {
		if (originalText) {
			showOriginal = true;
		}
	};

	const handleMouseLeave = () => {
		showOriginal = false;
	};

	const handleTouchStart = () => {
		if (originalText) {
			showOriginal = !showOriginal;
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

<!-- Add global event listeners for escape key -->
<svelte:window onkeydown={handleKeydown} />

<div 
  class="translation-card"
  bind:this={cardContainer}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  ontouchstart={handleTouchStart}
>

  <div class="translations-container">
    <!-- Translation rows -->
    {#each userStore.user.selectedLanguages as lang, i}
      {#if translation.translations[lang]}
        {@const sourceLang = translation.translations.metadata?.src_lang || 'eng'}
        {@const isSourceLang = lang === sourceLang}
        {@const isOriginalMatch = originalMatchesTranslation() === lang}
        {@const isDifferentFromOriginal = originalDiffersFromTarget() === lang}
        {@const languageName = getEnglishName(lang)}
        <div 
          class="translation-row" 
          class:is-source={isSourceLang} 
          class:is-original={isOriginalMatch}
          class:is-different={isDifferentFromOriginal}
          onmouseenter={() => hoveredLanguage = lang}
          onmouseleave={() => hoveredLanguage = null}
        >
          <div class="language-indicator {getColorByIndex(i, true)}">
            <div class="language-bar" class:source-bar={isSourceLang} class:original-bar={isOriginalMatch} class:different-bar={isDifferentFromOriginal}></div>
          </div>
          <div class="translation-content">
            <div 
              class="language-label"
            >
              {languageName}{#if isOriginalMatch} • original{/if}
            </div>
            <div 
              class="translation-text {truncate_lines ? 'line-clamp-3' : ''} break-words"
              onmouseenter={() => {
                if (isDifferentFromOriginal) {
                  showOriginalPopover = true;
                  popoverLanguage = lang;
                }
              }}
              onmouseleave={() => {
                showOriginalPopover = false;
                popoverLanguage = null;
              }}
            >
              {translation.translations[lang]}
              
              <!-- Original text popover for different translations -->
              {#if showOriginalPopover && popoverLanguage === lang && isDifferentFromOriginal && originalText}
                <div class="original-popover">
                  {originalText}
                </div>
              {/if}
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

  <!-- Card footer with metadata (shown on hover) -->
  {#if onDelete || timestamp}
    <div class="card-footer">
      <div class="card-metadata">
        {#if timestamp}
          <div class="metadata-item">
            <Clock class="metadata-icon" size={14} />
            <span class="metadata-text">{formatTimestamp(timestamp)}</span>
          </div>
        {/if}
        {#if onDelete}
          <button
            class="delete-button"
            aria-label="Delete translation"
            onclick={deleteTranslation}
          >
            <Trash2 class="delete-icon" size={14} />
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .translation-card {
    position: relative;
    width: 100%;
    background: white;
    border-radius: 0.5rem;
    overflow: visible;
    cursor: pointer; /* Hint that it's interactive */
    transition: transform 0.15s ease;
  }

  .translation-card:active {
    transform: scale(0.98);
  }

  .card-footer {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    height: 0;
    overflow: hidden;
    transition: height 0.2s ease;
    z-index: 20;
  }

  .translation-card:hover .card-footer {
    height: auto;
  }

  .card-metadata {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem;
    gap: 0.5rem;
    margin: 0;
    background: rgba(248, 250, 252, 0.95);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(226, 232, 240, 0.8);
    border-top: none;
    border-bottom-left-radius: 0.5rem;
    border-bottom-right-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .metadata-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: #64748b;
    font-size: 0.75rem;
  }

  .metadata-icon {
    flex-shrink: 0;
  }

  .metadata-text {
    font-weight: 500;
  }

  .delete-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    border: none;
    background: transparent;
    color: #94a3b8;
    cursor: pointer;
    border-radius: 0.25rem;
    transition: all 0.15s ease;
  }

  .delete-button:hover {
    background: #f1f5f9;
    color: #ef4444;
  }

  .delete-button:active {
    transform: scale(0.95);
  }

  .delete-icon {
    flex-shrink: 0;
  }

  .translations-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0;
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

  .translation-row.is-original {
    background-color: #f0f9ff;
    border: 1px solid #0ea5e9;
    border-radius: 0.5rem;
  }

  .translation-row.is-original:hover {
    background-color: #e0f2fe;
  }

  .translation-row.is-different {
    background-color: #fef3f2;
    border: 1px solid #f97316;
    border-radius: 0.5rem;
  }

  .translation-row.is-different:hover {
    background-color: #fed7ca;
  }

  .original-row {
    background-color: #f0f9ff;
    border: 1px solid #0ea5e9;
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .original-row:hover {
    background-color: #e0f2fe;
  }

  .original-indicator {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding-top: 0.125rem;
  }

  .original-bar {
    width: 3px;
    height: 1.5rem;
    border-radius: 1.5px;
    background-color: #0ea5e9;
  }

  .original-label {
    position: absolute;
    top: 0.25rem;
    right: 3rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #0369a1;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0;
    transform: translateY(-0.125rem);
    transition: opacity 0.2s ease, transform 0.2s ease;
    background: rgba(240, 249, 255, 0.95);
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    backdrop-filter: blur(4px);
    border: 1px solid rgba(14, 165, 233, 0.2);
    z-index: 10;
    pointer-events: none;
  }

  .translation-row.is-original:hover .original-label {
    opacity: 1;
    transform: translateY(0);
  }

  .language-label {
    position: absolute;
    top: 0.25rem;
    right: 3rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0;
    transform: translateY(-0.125rem);
    transition: opacity 0.2s ease, transform 0.2s ease;
    background: rgba(248, 250, 252, 0.95);
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    backdrop-filter: blur(4px);
    border: 1px solid rgba(0, 0, 0, 0.05);
    z-index: 10;
    pointer-events: none;
  }

  .translation-row:hover .language-label {
    opacity: 1;
    transform: translateY(0);
  }

  .translation-row.is-original .language-label {
    color: #0369a1;
    background: rgba(240, 249, 255, 0.95);
    border-color: rgba(14, 165, 233, 0.2);
  }

  .translation-row.is-different .language-label {
    color: #c2410c;
    background: rgba(254, 243, 242, 0.95);
    border-color: rgba(249, 115, 22, 0.2);
  }

  .original-text {
    color: #0c4a6e;
    font-weight: 500;
  }

  .translation-row.is-original .translation-text {
    color: #0c4a6e;
    font-weight: 500;
  }

  .translation-row.is-different .translation-text {
    color: #9a3412;
    font-weight: 500;
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

  .original-bar {
    background-color: #0ea5e9;
  }

  .different-bar {
    background-color: #f97316;
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

  /* Original text popover */
  .original-popover {
    position: absolute;
    top: -0.5rem;
    left: 0;
    right: 0;
    background: rgba(17, 24, 39, 0.95);
    backdrop-filter: blur(8px);
    color: white;
    padding: 0.75rem;
    border-radius: 0.5rem;
    box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
    z-index: 50;
    transform: translateY(-100%);
    animation: popover-appear 0.15s ease-out;
    border: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 0.875rem;
    line-height: 1.5;
    word-break: break-word;
  }

  @keyframes popover-appear {
    from {
      opacity: 0;
      transform: translateY(calc(-100% + 0.25rem));
    }
    to {
      opacity: 1;
      transform: translateY(-100%);
    }
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

    .card-metadata {
      padding: 0.375rem 0.5rem;
    }

    .metadata-text {
      font-size: 0.75rem;
    }

    .delete-button {
      padding: 0.25rem;
    }
  }

  /* Touch device optimizations */
  @media (hover: none) and (pointer: coarse) {
    .copy-button {
      opacity: 1;
    }

    .translation-card {
      cursor: default;
    }

    /* Always show card footer on touch devices */
    .card-footer {
      opacity: 1;
      transform: translateY(0);
    }

    /* Language labels on touch devices - show only on tap/focus */
    .translation-row .language-label {
      opacity: 0;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .translation-row:active .language-label,
    .translation-row:focus .language-label {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
