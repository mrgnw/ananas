// src/lib/stores/translationHistory.svelte.js
import { browser } from '$app/environment';
import { userStore } from './user.svelte.js';

let history = $state({
  translations: [], // Each item: { input, output, sourceLang, targetLang, timestamp }
  loading: false
});

// Load from localStorage on module load
if (browser) {
  const saved = localStorage.getItem('translationHistory');
  if (saved) {
    Object.assign(history, JSON.parse(saved));
  }
}

function save() {
  if (browser) {
    localStorage.setItem('translationHistory', JSON.stringify({ translations: history.translations }));
  }
}

async function addTranslation(translation) {
  // translation: { input, output, sourceLang, targetLang, timestamp }
  history.translations.unshift(translation); // newest first
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
  history.translations.splice(index, 1);
  save();
}

function clearHistory() {
  history.translations = [];
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
    history.loading = true;
    const response = await fetch('/api/translate/history');
    
    if (!response.ok) {
      throw new Error('Failed to load translations');
    }
    
    const data = await response.json();
    history.translations = data.translations;
    save();
  } catch (error) {
    console.error('Error loading translations from database:', error);
  } finally {
    history.loading = false;
  }
}

// Loads translations from database in background without showing loading state
async function loadFromDatabaseInBackground() {
  if (!userStore.user.auth.isAuthenticated) {
    return { newItems: [], hasUpdates: false };
  }

  try {
    const response = await fetch('/api/translate/history');
    
    if (!response.ok) {
      throw new Error('Failed to load translations');
    }
    
    const data = await response.json();
    const serverTranslations = data.translations;
    
    // Find new translations that aren't in our local history
    const localTimestamps = new Set(history.translations.map(t => t.timestamp));
    const newTranslations = serverTranslations.filter(t => !localTimestamps.has(t.timestamp));
    
    if (newTranslations.length > 0) {
      // Add new translations to the front of our local history
      history.translations = [...newTranslations, ...history.translations];
      save();
      return { newItems: newTranslations, hasUpdates: true };
    }
    
    return { newItems: [], hasUpdates: false };
  } catch (error) {
    console.error('Error loading translations from database in background:', error);
    return { newItems: [], hasUpdates: false };
  }
}

// Merge local translations with database (used on login)
async function mergeWithDatabase() {
  if (!userStore.user.auth.isAuthenticated || history.translations.length === 0) {
    return;
  }

  try {
    const response = await fetch('/api/translate/history/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        translations: history.translations 
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

export const translationHistoryStore = {
  history,
  addTranslation,
  removeTranslation,
  clearHistory,
  loadFromDatabase,
  loadFromDatabaseInBackground,
  mergeWithDatabase
};
