// src/lib/stores/translationsStore.svelte.js
import { browser } from '$app/environment';
import { userStore } from './user.svelte.js';

let translations = $state({
  history: [], // Each item: { input, output, sourceLang, targetLang, timestamp }
  loading: false,
  lastSyncTimestamp: null
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

// Initialize from server data (for cross-session persistence)
function initializeFromServerData(serverTranslations) {
  if (serverTranslations?.length > 0) {
    // Process server data to match our format
    const processedTranslations = serverTranslations.map(t => ({
      id: t.id,
      input: t.input_text,
      output: JSON.parse(t.output_json),
      sourceLang: t.source_lang,
      targetLang: JSON.parse(t.target_langs),
      timestamp: t.created_at
    }));
    
    translations.history = processedTranslations;
    translations.lastSyncTimestamp = Date.now();
    save(); // Update localStorage cache
    
    console.log('[TRANSLATIONS STORE] Initialized from server data:', {
      count: processedTranslations.length
    });
  }
}

async function addTranslation(translation) {
  // translation: { input, output, sourceLang, targetLang, timestamp }
  translations.history.unshift(translation); // newest first
  
  // Keep only last 80 translations in memory
  if (translations.history.length > 80) {
    translations.history = translations.history.slice(0, 80);
  }
  
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

async function removeTranslation(index) {
  const translationToRemove = translations.history[index];
  
  // 1. Remove from local state immediately (optimistic)
  translations.history.splice(index, 1);
  save();
  
  // 2. Sync deletion to server if authenticated and translation has ID
  if (userStore.user.auth.isAuthenticated && translationToRemove?.id) {
    try {
      const response = await fetch(`/api/translate/history/${translationToRemove.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        console.error('Failed to delete translation from database');
      }
    } catch (error) {
      console.error('Error deleting translation from database:', error);
      // Could add rollback logic here if needed
    }
  }
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
  mergeWithDatabase,
  initializeFromServerData
};

// Legacy export for backward compatibility during transition
export const translationHistoryStore = translationsStore;