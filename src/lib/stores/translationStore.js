import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Create a writable store with an initial empty state
export const translationInput = writable('');

// Initialize store from localStorage if we're in the browser
if (browser) {
  const savedTranslation = localStorage.getItem('translation-input');
  if (savedTranslation) {
    translationInput.set(savedTranslation);
  }
  
  // Set up subscription to save to localStorage when value changes
  translationInput.subscribe(value => {
    localStorage.setItem('translation-input', value);
  });
}

// Helper functions for common operations
export function updateTranslationInput(text) {
  translationInput.set(text);
}

export function clearTranslationInput() {
  translationInput.set('');
}

// This function can be called to manually initialize from storage
// (useful if you need to force a refresh from localStorage)
export function initializeFromStorage() {
  if (browser) {
    const saved = localStorage.getItem('translation-input');
    if (saved) {
      translationInput.set(saved);
    }
  }
}
