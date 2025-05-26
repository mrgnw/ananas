// src/lib/stores/user.svelte.js
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { invalidateAll } from '$app/navigation';

// Using Svelte 5 state with a mutable object
// This creates a deep reactive state that will track all property changes
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

// Merge local preferences into server data (only adds, never removes)
function mergeLocalIntoServerData(serverPreferences) {
  if (!serverPreferences) return;
  
  // Create copies to avoid mutating original server data
  const serverLanguages = [...(serverPreferences.selected_languages || [])];
  const serverTranslators = [...(serverPreferences.translators || ['deepl'])];
  const originalServerLanguageCount = serverLanguages.length;
  const originalServerTranslatorCount = serverTranslators.length;
  
  console.log('Merging preferences:', {
    serverLanguages,
    localLanguages: user.selectedLanguages,
    serverTranslators,
    localTranslators: user.translators
  });
  
  // Add any local languages that aren't already in server data
  user.selectedLanguages.forEach(lang => {
    if (!serverLanguages.includes(lang)) {
      serverLanguages.push(lang);
      console.log(`Added local language "${lang}" to server data`);
    }
  });
  
  // Add any local translators that aren't already in server data  
  user.translators.forEach(translator => {
    if (!serverTranslators.includes(translator)) {
      serverTranslators.push(translator);
      console.log(`Added local translator "${translator}" to server data`);
    }
  });
  
  // Update user with merged data
  user.selectedLanguages = serverLanguages;
  user.translators = serverTranslators;
  save();
  
  console.log('Final merged result:', {
    selectedLanguages: user.selectedLanguages,
    translators: user.translators
  });
  
  // Sync back to server if we added anything
  if (serverLanguages.length > originalServerLanguageCount ||
      serverTranslators.length > originalServerTranslatorCount) {
    console.log('Changes detected, syncing to server');
    syncToServer();
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
    // In Svelte 5, we can directly assign to object properties for reactivity
    user.auth.isAuthenticated = true;
    user.auth.id = userData.id;
    user.auth.email = userData.email;
    user.auth.username = userData.username || null;
  } else {
    user.auth.isAuthenticated = false;
    user.auth.id = null;
    user.auth.email = null;
    user.auth.username = null;
  }
  // Save to localStorage
  save();
  
  // Force a microtask to ensure updates are processed
  Promise.resolve().then(() => {
    // This empty microtask helps ensure reactivity completes
    console.log('Auth state updated:', user.auth.isAuthenticated);
  });
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
    
    // Cache current preferences before setting auth state
    const currentPrefs = {
      selectedLanguages: [...user.selectedLanguages],
      translators: [...user.translators]
    };
    
    // Set auth state directly from response
    if (data.user) {
      setAuthState(data.user);
    }
    
    console.log('Login: server preferences data:', data.preferences);
    console.log('Login: cached current preferences:', currentPrefs);
    
    // Merge local preferences into server data if available
    if (data.preferences) {
      mergeLocalIntoServerData(data.preferences);
    } else {
      // No server preferences, sync current local preferences to server
      if (currentPrefs.selectedLanguages.length || currentPrefs.translators.length) {
        await syncToServer();
      }
    }
    
    // Import translationHistoryStore to merge history after login
    const { translationHistoryStore } = await import('./translationHistory.svelte.js');
    if (translationHistoryStore) {
      // Merge any existing local translations with the database
      await translationHistoryStore.mergeWithDatabase();
      // Load translations from database
      await translationHistoryStore.loadFromDatabase();
    }
    
    // Invalidate all page data to refresh authentication state
    await invalidateAll();
    
    // Redirect to translate page
    goto('/', { replaceState: true });
    
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
    
    // Clear selected languages as requested
    user.selectedLanguages = [];
    user.translators = ['deepl']; // Reset to default
    
    // Save the cleared state to localStorage
    save();
    
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
    
    // Invalidate all page data to refresh authentication state  
    await invalidateAll();
    
    // Redirect to home page
    goto('/', { replaceState: true });
    
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
  mergeLocalIntoServerData,
  syncToServer
};