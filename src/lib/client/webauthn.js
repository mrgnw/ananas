import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

/**
 * Register a new passkey credential
 * @param {string} username - Username to register
 * @returns {Promise<Object>} - Registration verification result
 */
export async function registerPasskey(username) {
  try {
    console.log(`Starting registration for user: ${username}`);
    
    // Get registration options from server
    const optionsResponse = await fetch('/api/auth/register/options', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    });
    
    if (!optionsResponse.ok) {
      const error = await optionsResponse.json();
      console.error('Failed to get registration options:', error);
      throw new Error(error.error || 'Failed to get registration options');
    }

    // Get the options from the server response
    const { options } = await optionsResponse.json();
    console.log('Registration options received:', { ...options, challenge: '...' });
    
    // Start the WebAuthn registration process
    console.log('Starting browser registration flow');
    const credential = await startRegistration(options);
    console.log('Registration credential received from browser');
    
    // Send the credential to the server for verification
    const verificationResponse = await fetch('/api/auth/register/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credential),
    });

    // Get verification result
    const result = await verificationResponse.json();
    console.log('Registration verification result:', result);

    // Return the verification result
    return result;
  } catch (error) {
    console.error('Error during registration:', error);
    throw error;
  }
}

/**
 * Authenticate with a passkey
 * @param {string|null} username - Username to authenticate (optional for passkey flow)
 * @returns {Promise<Object>} - Authentication verification result
 */
export async function authenticateWithPasskey(username = null) {
  try {
    // Get authentication options from server
    const optionsResponse = await fetch('/api/auth/login/options', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    });

    if (!optionsResponse.ok) {
      const error = await optionsResponse.json();
      throw new Error(error.error || 'Failed to get authentication options');
    }

    // Get the options from the server response
    const { options } = await optionsResponse.json();
    
    // Start the WebAuthn authentication process
    const credential = await startAuthentication(options);
    
    // Send the credential to the server for verification
    const verificationResponse = await fetch('/api/auth/login/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credential),
    });

    // Return the verification result
    return await verificationResponse.json();
  } catch (error) {
    console.error('Error during authentication:', error);
    throw error;
  }
}

/**
 * Check the current authentication status
 * @returns {Promise<Object>} - Authentication status
 */
export async function checkAuthStatus() {
  try {
    const response = await fetch('/api/auth/session');
    return await response.json();
  } catch (error) {
    console.error('Error checking auth status:', error);
    return { authenticated: false };
  }
}

/**
 * Logout the current user
 * @returns {Promise<Object>} - Logout result
 */
export async function logout() {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'DELETE',
    });
    return await response.json();
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
}
