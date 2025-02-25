export function createTranslateLanguages() {
  // Using an object to store language data instead of an array
  let languages = $state({});

  function initializeFromStorage() {
    if (typeof localStorage === 'undefined') return;

    try {
      // Try to load from user_langs first, fall back to tgt_langs for migration
      const savedUserLangs = localStorage.getItem('user_langs');
      const savedTgtLangs = localStorage.getItem('tgt_langs');
      
      if (savedUserLangs) {
        languages = JSON.parse(savedUserLangs);
      } else if (savedTgtLangs) {
        // Migrate from old format to new format
        const tgtLangs = JSON.parse(savedTgtLangs);
        const newLanguages = {};
        
        tgtLangs.forEach(code => {
          try {
            newLanguages[code] = {
              label: new Intl.DisplayNames(['en'], { type: 'language' }).of(code),
              native: new Intl.DisplayNames([code], { type: 'language' }).of(code),
              rtl: false, // Default to false, can be updated later
              display: true
            };
          } catch (e) {
            console.warn(`Failed to migrate language ${code}:`, e);
          }
        });
        
        languages = newLanguages;
        // Save in new format
        saveToStorage();
      }
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