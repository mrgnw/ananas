// src/lib/stores/user.svelte.js
import { browser } from '$app/environment';
import { goto } from '$app/navigation';

let user = $state({
  selectedLanguages: [],
  translators: ['deepl'], // Default to deepl, can support others in future
  auth: {
    isAuthenticated: false,
    id: null,
    email: null,
    username: null
  },
  syncing: false
});

// Load from localStorage on module load
if (browser) {
  const saved = localStorage.getItem('user');
  if (saved) {
    Object.assign(user, JSON.parse(saved));
  }
}

function save() {
  if (browser) {
    localStorage.setItem('user', JSON.stringify(user));
  }
}

// Save preferences to server if user is authenticated
async function syncToServer() {
  if (!user.auth.isAuthenticated || !user.auth.id || user.syncing) {
    return;
  }
  
  try {
    user.syncing = true;
    
    const response = await fetch('/api/user/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selected_languages: user.selectedLanguages,
        translators: user.translators
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save preferences');
    }
    
    console.log('User preferences synced to server');
  } catch (error) {
    console.error('Error syncing preferences to server:', error);
  } finally {
    user.syncing = false;
  }
}

// Initialize user preferences from server data
function initializeFromServerData(serverPreferences) {
  if (serverPreferences) {
    user.selectedLanguages = serverPreferences.selected_languages || [];
    user.translators = serverPreferences.translators || ['deepl'];
    save();
  }
}

// Language management
function addLanguage(code) {
  if (!user.selectedLanguages.includes(code)) {
    user.selectedLanguages.push(code);
    save();
    if (user.auth.isAuthenticated) {
      syncToServer();
    }
  }
}

function removeLanguage(code) {
  user.selectedLanguages = user.selectedLanguages.filter(c => c !== code);
  save();
  if (user.auth.isAuthenticated) {
    syncToServer();
  }
}

// Translator management
function setTranslators(translators) {
  user.translators = Array.isArray(translators) ? translators : [translators];
  save();
  if (user.auth.isAuthenticated) {
    syncToServer();
  }
}

function addTranslator(translator) {
  if (!user.translators.includes(translator)) {
    user.translators.push(translator);
    save();
    if (user.auth.isAuthenticated) {
      syncToServer();
    }
  }
}

function removeTranslator(translator) {
  user.translators = user.translators.filter(t => t !== translator);
  save();
  if (user.auth.isAuthenticated) {
    syncToServer();
  }
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
    
    // Set auth state directly from response
    if (data.user) {
      setAuthState(data.user);
    }
    
    // Import translationHistoryStore to merge history after login
    const { translationHistoryStore } = await import('./translationHistory.svelte.js');
    if (translationHistoryStore) {
      // Merge any existing local translations with the database
      await translationHistoryStore.mergeWithDatabase();
      // Load translations from database
      await translationHistoryStore.loadFromDatabase();
    }
    
    // Redirect to translate page
    goto('/');
    
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
    // First clear local state to prevent UI flashing
    setAuthState(null);
    
    // Make sure to clear localStorage entirely
    if (browser) {
      localStorage.removeItem('user');
    }
    
    // Make server-side request to logout
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Import translationHistoryStore to clear history on logout
    const { translationHistoryStore } = await import('./translationHistory.svelte.js');
    if (translationHistoryStore) {
      // Clear the translation history
      translationHistoryStore.clearHistory();
    }
    
    // Redirect to home page after logout
    goto('/');
    
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
  signup,
  // Server sync
  initializeFromServerData,
  syncToServer
};