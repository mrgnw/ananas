import { checkAuthStatus, logout } from './webauthn.js';

// Create reactive state for auth
export const auth = $state({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null
});

// Check if user is already authenticated
export async function initAuth() {
  auth.loading = true;
  auth.error = null;
  
  try {
    const status = await checkAuthStatus();
    
    if (status.authenticated) {
      auth.user = { username: status.username };
      auth.isAuthenticated = true;
    } else {
      auth.user = null;
      auth.isAuthenticated = false;
    }
  } catch (error) {
    auth.error = error.message || 'Failed to check authentication status';
    console.error('Auth initialization error:', error);
  } finally {
    auth.loading = false;
  }
}

// Logout the current user
export async function logoutUser() {
  auth.loading = true;
  auth.error = null;
  
  try {
    await logout();
    auth.user = null;
    auth.isAuthenticated = false;
  } catch (error) {
    auth.error = error.message || 'Failed to logout';
    console.error('Logout error:', error);
  } finally {
    auth.loading = false;
  }
}

// Set authenticated user
export function setAuthenticatedUser(username) {
  auth.user = { username };
  auth.isAuthenticated = true;
  auth.error = null;
}
