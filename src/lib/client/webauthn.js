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
    console.log('Registration options received:', { 
      ...options, 
      challenge: '...',  // Don't log the challenge directly
      user: options.user ? { 
        ...options.user, 
        id: typeof options.user.id === 'string' ? options.user.id.substring(0, 10) + '...' : 'invalid' 
      } : null 
    });
    
    // Start the WebAuthn registration process
    console.log('Starting browser registration flow');
    let credential;
    try {
      credential = await startRegistration(options);
    } catch (err) {
      // Log more details about browser registration errors
      console.error('Browser registration error:', err);
      if (err.name === 'NotAllowedError') {
        throw new Error('Registration was denied by the user or device');
      }
      throw err;
    }
    
    // More detailed logging about the credential
    console.log('Registration credential received from browser:', {
      id: credential.id,
      type: credential.type,
      hasClientDataJSON: !!credential.response.clientDataJSON,
      hasAttestationObject: !!credential.response.attestationObject,
      transports: credential.response.transports,
      hasPublicKey: !!credential.response.publicKey
    });
    
    // Add the raw attestation object for debugging
    if (credential.response.attestationObject) {
      console.log('First 64 chars of attestationObject:', 
        credential.response.attestationObject.substring(0, 64));
    }
    
    // Add extensive logging of credential details to help troubleshoot
    console.log('Client data JSON length:', credential.response.clientDataJSON?.length || 0);
    console.log('Attestation object length:', credential.response.attestationObject?.length || 0);
    
    // Include all response properties in the verification request
    const verificationData = {
      ...credential,
      // Ensure we pass along any additional properties that might be helpful
      extraData: {
        browserInfo: navigator.userAgent,
        platform: navigator.platform
      }
    };
    
    // Send the credential to the server for verification
    console.log('Sending credential to server for verification');
    const verificationResponse = await fetch('/api/auth/register/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verificationData),
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
    
    // Add detailed logging for authentication credential
    console.log('Authentication credential received from browser:', {
      id: credential.id,
      type: credential.type,
      responseProperties: Object.keys(credential.response)
    });
    
    // Log the specific response properties needed for verification
    console.log('Authentication response details:', {
      clientDataJSONLength: credential.response.clientDataJSON?.length || 0,
      authenticatorDataLength: credential.response.authenticatorData?.length || 0,
      signatureLength: credential.response.signature?.length || 0,
      userHandlePresent: !!credential.response.userHandle
    });
    
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
