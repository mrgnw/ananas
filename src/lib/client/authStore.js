import { writable } from 'svelte/store';
import { checkAuthStatus, logout } from './webauthn.js';

// Create a writable store for auth state
export const auth = writable({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null
});

// Check if user is already authenticated
export async function initAuth() {
  auth.update(state => ({ ...state, loading: true, error: null }));
  
  try {
    const status = await checkAuthStatus();
    
    if (status.authenticated) {
      auth.update(state => ({
        ...state,
        user: { username: status.username },
        isAuthenticated: true
      }));
    } else {
      auth.update(state => ({
        ...state,
        user: null,
        isAuthenticated: false
      }));
    }
  } catch (error) {
    const errorMessage = error.message || 'Failed to check authentication status';
    auth.update(state => ({ ...state, error: errorMessage }));
    console.error('Auth initialization error:', error);
  } finally {
    auth.update(state => ({ ...state, loading: false }));
  }
}

// Logout the current user
export async function logoutUser() {
  auth.update(state => ({ ...state, loading: true, error: null }));
  
  try {
    await logout();
    auth.update(state => ({
      ...state,
      user: null,
      isAuthenticated: false
    }));
  } catch (error) {
    const errorMessage = error.message || 'Failed to logout';
    auth.update(state => ({ ...state, error: errorMessage }));
    console.error('Logout error:', error);
  } finally {
    auth.update(state => ({ ...state, loading: false }));
  }
}

// Set authenticated user
export function setAuthenticatedUser(username) {
  auth.update(state => ({
    ...state,
    user: { username },
    isAuthenticated: true,
    error: null
  }));
}
