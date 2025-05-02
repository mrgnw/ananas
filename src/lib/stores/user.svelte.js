// src/lib/stores/user.svelte.js
let user = $state({
  selectedLanguages: []
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

export const userStore = {
  user,
  addLanguage,
  removeLanguage
};