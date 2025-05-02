// src/lib/stores/user.svelte.js
let user = $state({
  selectedLanguages: [],
  translators: ['deepl'] // Default to deepl, can support others in future
});

// Load from localStorage on module load
if (typeof localStorage !== 'undefined') {
  const saved = localStorage.getItem('user');
  if (saved) {
    Object.assign(user, JSON.parse(saved));
  }
}

function save() {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
}

function addLanguage(code) {
  if (!user.selectedLanguages.includes(code)) {
    user.selectedLanguages.push(code);
    save();
  }
}

function removeLanguage(code) {
  user.selectedLanguages = user.selectedLanguages.filter(c => c !== code);
  save();
}

function setTranslators(translators) {
  user.translators = Array.isArray(translators) ? translators : [translators];
  save();
}

function addTranslator(translator) {
  if (!user.translators.includes(translator)) {
    user.translators.push(translator);
    save();
  }
}

function removeTranslator(translator) {
  user.translators = user.translators.filter(t => t !== translator);
  save();
}

export const userStore = {
  user,
  addLanguage,
  removeLanguage,
  setTranslators,
  addTranslator,
  removeTranslator
};