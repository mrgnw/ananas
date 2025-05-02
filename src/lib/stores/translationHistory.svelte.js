// src/lib/stores/translationHistory.svelte.js

let history = $state({
  translations: [] // Each item: { input, output, sourceLang, targetLang, timestamp }
});

// Load from localStorage on module load
if (typeof localStorage !== 'undefined') {
  const saved = localStorage.getItem('translationHistory');
  if (saved) {
    Object.assign(history, JSON.parse(saved));
  }
}

function save() {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('translationHistory', JSON.stringify(history));
  }
}

function addTranslation(translation) {
  // translation: { input, output, sourceLang, targetLang, timestamp }
  history.translations.unshift(translation); // newest first
  save();
}

function removeTranslation(index) {
  history.translations.splice(index, 1);
  save();
}

function clearHistory() {
  history.translations = [];
  save();
}

export const translationHistoryStore = {
  history,
  addTranslation,
  removeTranslation,
  clearHistory
};
