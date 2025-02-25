import { defaultLanguages } from '$lib/utils/languages.js';

export function createTranslateLanguages() {
  // Using an object to store language data instead of an array
  let languages = $state({});

  function initializeFromStorage() {
    // Always start with default languages
    languages = { ...defaultLanguages };
    
    if (typeof localStorage === 'undefined') return;

    try {
        const savedUserLangs = localStorage.getItem('user_langs');
        if (savedUserLangs) {
            // Merge saved languages with defaults, preserving user settings
            const saved = JSON.parse(savedUserLangs);
            languages = { ...languages, ...saved };
        }
        saveToStorage();
    } catch (e) {
        console.error('Failed to initialize languages from storage:', e);
    }
  }

  function saveToStorage() {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const languagesStr = JSON.stringify(languages);
      localStorage.setItem('user_langs', languagesStr);
      // Keep tgt_langs in sync for backward compatibility
      localStorage.setItem('tgt_langs', JSON.stringify(Object.keys(languages)));
    } catch (e) {
      console.error('Failed to save languages to storage:', e);
    }
  }

  function addLanguage(code, info) {
    if (!code || !info) {
      throw new Error('Language code and info are required');
    }

    languages = {
      ...languages,
      [code]: {
        label: info.label || code,
        native: info.native || code,
        rtl: info.rtl || false,
        display: true
      }
    };
    saveToStorage();
  }

  function removeLanguage(code) {
    if (!code) {
      throw new Error('Language code is required');
    }

    const newLanguages = { ...languages };
    delete newLanguages[code];
    languages = newLanguages;
    saveToStorage();
  }

  function getSelectedCodes() {
    return Object.keys(languages);
  }

  function getLanguageInfo(code) {
    return languages[code];
  }

  function clearLanguages() {
    languages = {};
    saveToStorage();
  }

  // Initialize on creation
  initializeFromStorage();

  return {
    get languages() { return languages },
    get selectedCodes() { return getSelectedCodes() },
    getLanguageInfo,
    addLanguage,
    removeLanguage,
    clearLanguages,
    // Exposed for testing
    _initializeFromStorage: initializeFromStorage
  };
}

// Create a singleton instance
export const translateLanguages = createTranslateLanguages();