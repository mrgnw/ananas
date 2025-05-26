// src/lib/stores/translationsStore.svelte.js
import { browser } from '$app/environment';
import { userStore } from './user.svelte.js';

let translations = $state({
  history: [], // Each item: { input, output, sourceLang, targetLang, timestamp }
  loading: false
});

// Computed current translation (most recent)
const current = $derived(translations.history[0] || null);

// Load from localStorage on module load
if (browser) {
  const saved = localStorage.getItem('translationHistory');
  if (saved) {
    const parsed = JSON.parse(saved);
    // Handle both old and new structure
    if (parsed.translations) {
      translations.history = parsed.translations;
    } else if (Array.isArray(parsed.history)) {
      translations.history = parsed.history;
    }
  }
}

function save() {
  if (browser) {
    localStorage.setItem('translationHistory', JSON.stringify({ translations: translations.history }));
  }
}

async function addTranslation(translation) {
  // translation: { input, output, sourceLang, targetLang, timestamp }
  translations.history.unshift(translation); // newest first
  save();

  // If user is authenticated, save to database
  if (userStore.user.auth.isAuthenticated) {
    try {
      const response = await fetch('/api/translate/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ translation })
      });

      if (!response.ok) {
        console.error('Failed to save translation to database');
      }
    } catch (error) {
      console.error('Error saving translation to database:', error);
    }
  }
}

function removeTranslation(index) {
  translations.history.splice(index, 1);
  save();
}

function clearHistory() {
  translations.history = [];
  save();

  // If user is authenticated, clear from database
  if (userStore.user.auth.isAuthenticated) {
    fetch('/api/translate/history', {
      method: 'DELETE'
    }).catch(error => {
      console.error('Error clearing translation history from database:', error);
    });
  }
}

// Loads translations from the database
async function loadFromDatabase() {
  if (!userStore.user.auth.isAuthenticated) {
    return;
  }

  try {
    translations.loading = true;
    const response = await fetch('/api/translate/history');
    
    if (!response.ok) {
      throw new Error('Failed to load translations');
    }
    
    const data = await response.json();
    translations.history = data.translations;
    save();
  } catch (error) {
    console.error('Error loading translations from database:', error);
  } finally {
    translations.loading = false;
  }
}

// Merge local translations with database (used on login)
async function mergeWithDatabase() {
  if (!userStore.user.auth.isAuthenticated || translations.history.length === 0) {
    return;
  }

  try {
    const response = await fetch('/api/translate/history/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        translations: translations.history 
      })
    });

    if (!response.ok) {
      throw new Error('Failed to merge translations');
    }

    // After merging, load fresh data from the database
    await loadFromDatabase();
  } catch (error) {
    console.error('Error merging translations with database:', error);
  }
}

export const translationsStore = {
  translations,
  current,
  addTranslation,
  removeTranslation,
  clearHistory,
  loadFromDatabase,
  mergeWithDatabase
};

// Legacy export for backward compatibility during transition
export const translationHistoryStore = translationsStore;