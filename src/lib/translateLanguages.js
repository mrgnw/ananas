export function createTranslateLanguages() {
  let languages = $state(['es', 'ru']);

  // Load saved languages from localStorage on initialization
  if (typeof localStorage !== 'undefined') {
    const savedLanguages = localStorage.getItem('tgt_langs');
    if (savedLanguages) {
      languages = JSON.parse(savedLanguages);
    }
  }

  // Save to localStorage whenever the languages change
  $effect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('tgt_langs', JSON.stringify(languages));
    }
  });

  function addLanguage(lang) {
    if (!languages.includes(lang)) {
      languages = [...languages, lang];
    }
  }

  function removeLanguage(lang) {
    languages = languages.filter(l => l !== lang);
  }

  return {
    get languages() { return languages },
    addLanguage,
    removeLanguage
  };
}