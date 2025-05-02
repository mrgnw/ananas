import { defaultLanguages } from '$lib/utils/languages.js';
import languageData from '$lib/data/wikidata-languages.json';

function normalizeLanguageCode(code) {
  return code;
}

// Single source of truth for selected languages
let languages = $state({});

function loadFromStorage() {
  if (typeof localStorage === 'undefined') return false;
  try {
    const saved = localStorage.getItem('user_langs');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.keys(languages).forEach(k => delete languages[k]);
      Object.assign(languages, parsed);
      return true;
    }
  } catch (e) {
    // ignore
  }
  return false;
}

function saveToStorage() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem('user_langs', JSON.stringify(languages));
    localStorage.setItem('tgt_langs', JSON.stringify(Object.keys(languages)));
  } catch (e) {
    // ignore
  }
}

function addLanguage(code, info) {
  const normalized = normalizeLanguageCode(code);
  if (!languages[normalized]) {
    languages[normalized] = {
      label: info.label || code,
      native: info.native || code,
      rtl: info.rtl || false,
      display: true
    };
    saveToStorage();
  }
}

function removeLanguage(code) {
  const normalized = normalizeLanguageCode(code);
  if (languages[normalized]) {
    delete languages[normalized];
    saveToStorage();
  }
}

function clearLanguages() {
  Object.keys(languages).forEach(k => delete languages[k]);
  saveToStorage();
}

function resetToDefaults() {
  Object.keys(languages).forEach(k => delete languages[k]);
  Object.assign(languages, defaultLanguages);
  saveToStorage();
}

function addDefaultLanguages() {
  Object.assign(languages, defaultLanguages);
  saveToStorage();
}

function toggleLanguageDisplay(code) {
  const normalized = normalizeLanguageCode(code);
  if (languages[normalized]) {
    languages[normalized].display = !languages[normalized].display;
    saveToStorage();
  }
}

function getLanguageInfo(code) {
  const normalized = normalizeLanguageCode(code);
  return languages[normalized];
}

// On module load, initialize from storage or defaults
if (!loadFromStorage()) {
  Object.assign(languages, defaultLanguages);
  saveToStorage();
}

export const translateLanguages = {
  languages, // $state object
  addLanguage,
  removeLanguage,
  clearLanguages,
  resetToDefaults,
  addDefaultLanguages,
  toggleLanguageDisplay,
  getLanguageInfo,
  normalizeLanguageCode
};