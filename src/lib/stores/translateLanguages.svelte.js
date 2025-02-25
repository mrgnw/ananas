import { defaultLanguages } from '$lib/utils/languages.js';
import languageData from '$lib/data/wikidata-languages.json';

// Create maps for code conversion - normalize to 2-char ISO codes
const iso3ToIso1Map = new Map(
  languageData
    .filter(lang => lang.iso1 && lang.iso)
    .map(lang => [lang.iso, lang.iso1])
);

// Normalize a language code to its 2-char version if available
function normalizeLanguageCode(code) {
  // If it's already a 2-char code, return it
  if (code.length === 2) return code;
  // Try to convert from 3-char code to 2-char code
  return iso3ToIso1Map.get(code) || code;
}

export function createTranslateLanguages() {
  let languages = $state({});
  
  // Track if we've initialized from storage yet
  let isInitialized = false;

  function initializeFromStorage() {
    if (isInitialized) return;
    isInitialized = true;
    
    if (typeof localStorage === 'undefined') {
      // If localStorage isn't available, just use defaults
      languages = { ...defaultLanguages };
      return;
    }

    try {
      // Load saved languages if they exist
      const savedUserLangs = localStorage.getItem('user_langs');
      if (savedUserLangs) {
        const saved = JSON.parse(savedUserLangs);
        // Normalize all codes in saved data
        languages = Object.entries(saved).reduce((acc, [code, info]) => {
          const normalizedCode = normalizeLanguageCode(code);
          acc[normalizedCode] = info;
          return acc;
        }, {});
      } else {
        // If no saved languages, use defaults
        languages = { ...defaultLanguages };
        
        // Check legacy format as fallback
        const oldLangs = localStorage.getItem('tgt_langs');
        if (oldLangs) {
          const oldCodes = JSON.parse(oldLangs);
          oldCodes.forEach(code => {
            const normalizedCode = normalizeLanguageCode(code);
            if (!languages[normalizedCode]) {
              languages[normalizedCode] = {
                label: code,
                native: code,
                rtl: false,
                display: true
              };
            }
          });
        }
      }
      
      saveToStorage();
      console.log('Initialized languages:', Object.keys(languages));
    } catch (e) {
      console.error('Failed to initialize languages from storage:', e);
      // Fallback to defaults
      languages = { ...defaultLanguages };
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
    // Clear all languages
    languages = {};
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('user_langs');
      localStorage.removeItem('tgt_langs');
    }
    
    saveToStorage();
    console.log('Cleared all languages');
  }
  
  // New function to add default languages
  function addDefaultLanguages() {
    // Add default languages to the current set
    languages = { ...languages, ...defaultLanguages };
    saveToStorage();
    console.log('Added default languages:', Object.keys(defaultLanguages));
  }
  
  // New function to reset to defaults only (replacing current languages)
  function resetToDefaults() {
    // Clear current languages and set to defaults
    languages = { ...defaultLanguages };
    saveToStorage();
    console.log('Reset to defaults:', Object.keys(languages));
  }

  function toggleLanguageDisplay(code) {
    const normalizedCode = normalizeLanguageCode(code);
    const langInfo = languages[normalizedCode];
    if (langInfo) {
      languages = {
        ...languages,
        [normalizedCode]: {
          ...langInfo,
          display: !langInfo.display
        }
      };
      saveToStorage();
      console.log('Toggled display for:', normalizedCode, 'to:', !langInfo.display);
    }
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
    addDefaultLanguages,
    resetToDefaults,
    toggleLanguageDisplay,
    // Utility functions
    normalizeLanguageCode,
    // Exposed for testing
    _initializeFromStorage: initializeFromStorage
  };
}

// Create a singleton instance
export const translateLanguages = createTranslateLanguages();