// src/lib/stores/user.svelte.js
let user = $state({
  selectedLanguages: [],
  translators: ['deepl'], // Default to deepl, can support others in future
  auth: {
    isAuthenticated: false,
    id: null,
    email: null,
    username: null
  }
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

// Language management
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

// Translator management
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

// Authentication management
function setAuthState(userData) {
  if (userData) {
    user.auth = {
      isAuthenticated: true,
      id: userData.id,
      email: userData.email,
      username: userData.username || null
    };
  } else {
    user.auth = {
      isAuthenticated: false,
      id: null,
      email: null,
      username: null
    };
  }
  save();
}

async function login(email, password) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    // We'll load the user data from the layout data
    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      error: error.message || 'Login failed' 
    };
  }
}

async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    setAuthState(null);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { 
      success: false, 
      error: error.message || 'Logout failed' 
    };
  }
}

async function signup(email, password, username = '') {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Signup error:', error);
    return { 
      success: false, 
      error: error.message || 'Signup failed' 
    };
  }
}

export const userStore = {
  user,
  // Language management
  addLanguage,
  removeLanguage,
  // Translator management
  setTranslators,
  addTranslator,
  removeTranslator,
  // Authentication management
  setAuthState,
  login,
  logout,
  signup
};