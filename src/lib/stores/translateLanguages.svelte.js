import { defaultLanguages } from '$lib/utils/languages.js';
import languageData from '$lib/data/wikidata-languages.json';

// Create maps for code conversion - normalize to 3-char ISO codes
const iso1ToIso3Map = new Map(
  languageData
    .filter(lang => lang.iso1)
    .map(lang => [lang.iso1, lang.iso])
);

// Normalize a language code to its 3-char version if available
function normalizeLanguageCode(code) {
  // If it's already a 3-char code, return it
  if (code.length === 3) return code;
  // Try to convert from 2-char code to 3-char code
  return iso1ToIso3Map.get(code) || code;
}

export function createTranslateLanguages() {
  let languages = $state({});

  function initializeFromStorage() {
    // Always start with default languages
    languages = { ...defaultLanguages };
    
    if (typeof localStorage === 'undefined') return;

    try {
        // First check for legacy tgt_langs format
        const oldLangs = localStorage.getItem('tgt_langs');
        if (oldLangs) {
            const oldCodes = JSON.parse(oldLangs);
            // Normalize old codes
            const normalizedOld = oldCodes.reduce((acc, code) => {
                const normalizedCode = normalizeLanguageCode(code);
                if (!languages[normalizedCode]) {
                    acc[normalizedCode] = {
                        label: code,
                        native: code,
                        rtl: false,
                        display: true
                    };
                }
                return acc;
            }, {});
            languages = { ...languages, ...normalizedOld };
        }

        // Then check for new format
        const savedUserLangs = localStorage.getItem('user_langs');
        if (savedUserLangs) {
            const saved = JSON.parse(savedUserLangs);
            // Normalize all codes in saved data
            const normalized = Object.entries(saved).reduce((acc, [code, info]) => {
                const normalizedCode = normalizeLanguageCode(code);
                acc[normalizedCode] = info;
                return acc;
            }, {});
            languages = { ...languages, ...normalized };
        }
        
        saveToStorage();
        console.log('Initialized languages:', Object.keys(languages));
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
      console.log('Saved languages:', Object.keys(languages));
    } catch (e) {
      console.error('Failed to save languages to storage:', e);
    }
  }

  function addLanguage(code, info) {
    if (!code || !info) {
      throw new Error('Language code and info are required');
    }

    const normalizedCode = normalizeLanguageCode(code);
    console.log('Adding language:', { original: code, normalized: normalizedCode });
    
    // If it's already in the store with the normalized code, don't add it again
    if (languages[normalizedCode]) {
      console.log('Language already exists with normalized code:', normalizedCode);
      return;
    }

    languages = {
      ...languages,
      [normalizedCode]: {
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

    const normalizedCode = normalizeLanguageCode(code);
    console.log('Removing language:', { original: code, normalized: normalizedCode });
    
    const newLanguages = { ...languages };
    delete newLanguages[normalizedCode];
    languages = newLanguages;
    saveToStorage();
  }

  function getSelectedCodes() {
    return Object.keys(languages);
  }

  function getLanguageInfo(code) {
    const normalizedCode = normalizeLanguageCode(code);
    return languages[normalizedCode];
  }

  function clearLanguages() {
    // Clear both the store and localStorage
    languages = {};
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('user_langs');
      localStorage.removeItem('tgt_langs');
    }
    
    // Reset to defaults
    languages = { ...defaultLanguages };
    saveToStorage();
    console.log('Reset to defaults:', Object.keys(languages));
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
    // Utility functions
    normalizeLanguageCode,
    // Exposed for testing
    _initializeFromStorage: initializeFromStorage
  };
}

// Create a singleton instance
export const translateLanguages = createTranslateLanguages();