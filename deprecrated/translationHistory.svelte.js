import { browser } from '$app/environment';

// Create a custom store with getters and setters
function createTranslationHistoryStore() {
  // Private history array
  let _history = [];

  // Load initial data if in browser environment
  if (browser) {
    try {
      const stored = localStorage.getItem('translationHistory');
      if (stored) {
        _history = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load translation history:', error);
    }
  }

  // Custom store functions
  const subscribers = new Set();

  // Notify all subscribers of changes
  function notify() {
    subscribers.forEach(subscriber => subscriber(_history));
  }

  // Save history to localStorage
  function saveToStorage() {
    if (browser) {
      try {
        localStorage.setItem('translationHistory', JSON.stringify(_history));
      } catch (error) {
        console.error('Failed to save translation history:', error);
      }
    }
  }

  return {
    // Standard Svelte store subscribe method
    subscribe(subscriber) {
      subscribers.add(subscriber);
      subscriber(_history);
      
      return () => {
        subscribers.delete(subscriber);
      };
    },
    
    // Method to delete a translation by index
    deleteTranslation(index) {
      _history = _history.filter((_, i) => i !== index);
      saveToStorage();
      notify();
    },
    
    // Method to add a new translation
    addTranslation(text, translations) {
      _history = [
        {
          text,
          translations,
          timestamp: new Date().toISOString()
        },
        ..._history
      ];
      saveToStorage();
      notify();
    },
    
    // Method to get the raw history array
    get() {
      return [..._history]; // Return a copy to prevent direct mutations
    },
    
    // Getter that returns the length of the history
    get length() {
      return _history.length;
    }
  };
}

// Create and export the store
export const translationHistory = createTranslationHistoryStore();
