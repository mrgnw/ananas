import { 
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server';
import { isoUint8Array } from '@simplewebauthn/server/helpers';
import { dev } from '$app/environment';

// Relying Party configuration
const rpName = 'Ananas Passkeys';
const rpID = dev ? 'localhost' : 'your-production-domain.com';
const expectedOrigin = dev 
  ? ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:5179'] 
  : [`https://${rpID}`];

// In-memory user storage - completely simplified structure
const users = new Map();
const challenges = new Map();

// User and challenge management functions
export function getUser(username) {
  return users.get(username);
}

export function createUser(username) {
  if (users.has(username)) {
    return users.get(username);
  }
  
  const newUser = {
    id: crypto.randomUUID(),
    username,
    credentials: []
  };
  
  users.set(username, newUser);
  return newUser;
}

export function storeChallenge(key, challenge) {
  challenges.set(key, challenge);
}

export function getChallenge(key) {
  return challenges.get(key);
}

export function removeChallenge(key) {
  challenges.delete(key);
}

// WebAuthn registration functions
export async function generateRegOptions(username) {
  const user = getUser(username) || createUser(username);
  console.log(`Generating registration options for ${username}`);
  
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: isoUint8Array.fromUTF8String(user.id), // Convert string to Uint8Array
    userName: username,
    attestationType: 'none',
    // Default to recommended passkey settings
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
    // No excluded credentials for simplicity
    excludeCredentials: []
  });
  
  // Store challenge for verification
  storeChallenge(username, options.challenge);
  console.log(`Registration challenge stored for ${username}`);
  
  return options;
}

export async function verifyRegResponse(username, response) {
  const user = getUser(username);
  const challenge = getChallenge(username);
  
  if (!user) throw new Error('User not found');
  if (!challenge) throw new Error('Challenge not found');
  
  // Remove challenge to prevent replay attacks
  removeChallenge(username);
  
  // Log the raw response for debugging
  console.log('Raw registration response:', JSON.stringify({
    id: response.id,
    type: response.type,
    transports: response.response.transports
  }, null, 2));
  
  try {
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });
    
    if (verification.verified && verification.registrationInfo) {
      const { registrationInfo } = verification;
      
      // Add more detailed logging about the registration info
      console.log('Registration info raw structure:', {
        hasCredentialID: !!registrationInfo.credentialID,
        hasCredentialPublicKey: !!registrationInfo.credentialPublicKey,
        publicKeyType: typeof registrationInfo.credentialPublicKey,
        // Only try to access properties if it exists
        publicKeyLength: registrationInfo.credentialPublicKey ? registrationInfo.credentialPublicKey.length : 'N/A'
      });
      
      // Extract credential data with safer handling
      const { credentialID, credentialPublicKey, counter } = registrationInfo;
      
      // Handle potentially problematic public key with a more robust approach
      if (!credentialPublicKey) {
        console.warn('No credentialPublicKey in registration response, attempting to extract from raw response');
        
        // Try to extract public key from the raw response if available
        let fallbackPublicKey;
        try {
          if (response.response && response.response.publicKey) {
            console.log('Found publicKey in raw response');
            
            // Log more details about the raw public key
            console.log('Raw public key info:', {
              type: typeof response.response.publicKey,
              length: response.response.publicKey.length
            });
            
            // Try to decode the public key with different formats
            try {
              fallbackPublicKey = Buffer.from(response.response.publicKey, 'base64');
              console.log('Decoded public key (base64):', {
                length: fallbackPublicKey.length,
                firstBytes: fallbackPublicKey.slice(0, 10).toString('hex')
              });
            } catch (e) {
              console.error('Failed to decode as base64:', e);
            }
            
            // If that didn't work, try other formats
            if (!fallbackPublicKey || fallbackPublicKey.length === 0) {
              fallbackPublicKey = Buffer.from(response.response.publicKey, 'base64url');
              console.log('Decoded public key (base64url):', {
                length: fallbackPublicKey.length,
                firstBytes: fallbackPublicKey.length > 0 ? fallbackPublicKey.slice(0, 10).toString('hex') : 'empty'
              });
            }
            
            // If still not working, try using the raw bytes
            if (!fallbackPublicKey || fallbackPublicKey.length === 0) {
              console.warn('Failed to decode public key from string, trying direct buffer creation');
              fallbackPublicKey = Buffer.from(response.response.authenticatorData || []);
            }
          } else if (response.response && response.response.authenticatorData) {
            console.log('No publicKey in response, trying authenticatorData');
            fallbackPublicKey = Buffer.from(response.response.authenticatorData);
          }
        } catch (e) {
          console.error('Failed to extract fallback public key:', e);
        }
        
        // Only proceed if we have a valid fallback credential ID
        const fallbackCredentialID = 
          credentialID || (response.id ? Buffer.from(response.id, 'base64url') : null);
        
        if (!fallbackCredentialID) {
          console.error('Could not obtain valid credential ID from response');
          throw new Error('Invalid credential: missing credential ID');
        }
        
        // Create a minimal credential with what we have
        const credential = {
          credentialID: fallbackCredentialID,
          credentialPublicKey: fallbackPublicKey || Buffer.alloc(0),
          counter: counter || 0,
          transports: response.response.transports || []
        };
        
        console.log('Using fallback credential data:', {
          idLength: credential.credentialID.length,
          hasPublicKey: !!credential.credentialPublicKey,
          publicKeyLength: credential.credentialPublicKey?.length || 0
        });
        
        // Only add the credential if we have BOTH id and key
        if (credential.credentialID && credential.credentialID.length > 0 && 
            credential.credentialPublicKey && credential.credentialPublicKey.length > 0) {
          // Add credential to user
          user.credentials.push(credential);
          console.log(`Added credential with fallback public key for ${username}`);
        } else {
          console.error('Cannot create credential with missing ID or empty public key');
          throw new Error('Invalid credential: missing required components');
        }
        
      } else if (credentialPublicKey.length === 0) {
        console.error('Error: Empty credential public key in registration response');
        throw new Error('Empty credential public key received from authenticator');
      } else {
        // Normal flow with complete data
        // Log the actual public key content for debugging
        console.log('Public key details:', {
          length: credentialPublicKey.length,
          firstBytes: credentialPublicKey.slice(0, 10).toString('hex'),
          isBuffer: Buffer.isBuffer(credentialPublicKey)
        });
        
        // Store credential using a very simple structure - no nesting or complexity
        const credential = {
          credentialID: credentialID, // This is already a Buffer from SimpleWebAuthn
          credentialPublicKey: credentialPublicKey, // This is already a Buffer from SimpleWebAuthn
          counter: counter || 0,
          transports: response.response.transports || []
        };
        
        // Log detailed info about what we're storing
        console.log('Storing credential with ID:', Buffer.from(credentialID).toString('base64url'));
        console.log('Credential structure:', {
          hasID: !!credential.credentialID,
          idType: typeof credential.credentialID,
          idIsBuffer: Buffer.isBuffer(credential.credentialID),
          idLength: credential.credentialID.length,
          hasPublicKey: !!credential.credentialPublicKey,
          publicKeyType: typeof credential.credentialPublicKey,
          publicKeyIsBuffer: Buffer.isBuffer(credential.credentialPublicKey),
          counter: credential.counter,
          transports: credential.transports
        });
        
        // Add credential to user
        user.credentials.push(credential);
        console.log(`User ${username} now has ${user.credentials.length} credential(s)`);
      }
    }
    
    return verification;
  } catch (error) {
    console.error('Error during registration verification:', error);
    throw error;
  }
}

// WebAuthn authentication functions
export async function generateAuthOptions(username = null) {
  // For passkey authentication with no username
  if (!username) {
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'preferred',
      // Allow any credential (passkey mode)
      allowCredentials: []
    });
    
    storeChallenge('_passkey_auth_', options.challenge);
    console.log('Passkey auth challenge stored');
    
    return options;
  }
  
  // For username-first authentication
  const user = getUser(username);
  if (!user) throw new Error('User not found');
  
  // Format credentials properly for authentication
  const allowCredentials = user.credentials.map(cred => ({
    id: Buffer.from(cred.credentialID).toString('base64url'),
    type: 'public-key',
    transports: cred.transports || []
  }));
  
  console.log('Authentication allowCredentials:', allowCredentials);
  
  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials,
    userVerification: 'preferred',
  });
  
  storeChallenge(username, options.challenge);
  console.log(`Auth challenge stored for ${username}`);
  
  return options;
}

export async function verifyAuthResponse(response, username = null) {
  let user;
  let challenge;
  
  if (username) {
    // Username-first flow
    user = getUser(username);
    if (!user) throw new Error('User not found');
    challenge = getChallenge(username);
  } else {
    // Passkey flow - we need to find the user by credential ID
    challenge = getChallenge('_passkey_auth_');
    
    if (!response.id) {
      throw new Error('Missing credential ID in authentication response');
    }
    
    // Find the user with this credential
    const credentialIdBase64 = response.id;
    const credentialIdBuffer = Buffer.from(credentialIdBase64, 'base64url');
    
    console.log('Looking for credential with ID:', credentialIdBase64);
    
    for (const [storedUsername, storedUser] of users.entries()) {
      const credential = storedUser.credentials.find(c => {
        // Ensure consistent comparison by converting both to Buffers
        return Buffer.isBuffer(c.credentialID) && 
               Buffer.compare(c.credentialID, credentialIdBuffer) === 0;
      });
      
      if (credential) {
        user = storedUser;
        username = storedUsername;
        console.log(`Found matching credential for user: ${username}`);
        break;
      }
    }
    
    if (!user) {
      console.error('No user found with credential ID:', credentialIdBase64);
      throw new Error('Unknown credential');
    }
  }
  
  if (!challenge) {
    throw new Error('Challenge not found');
  }
  
  // Remove challenge to prevent replay attacks
  if (username) {
    removeChallenge(username);
  } else {
    removeChallenge('_passkey_auth_');
  }
  
  try {
    // Find the specific credential to use
    const credentialIdBuffer = Buffer.from(response.id, 'base64url');
    
    const credential = user.credentials.find(c => 
      Buffer.isBuffer(c.credentialID) && 
      Buffer.compare(c.credentialID, credentialIdBuffer) === 0
    );
    
    if (!credential) {
      console.error('Credential not found in user credentials');
      throw new Error('Credential not found');
    }
    
    // Enhanced validation and debugging for credential
    console.log('Raw credential data dump:', JSON.stringify({
      id: Buffer.from(credential.credentialID).toString('base64url'),
      credentialID: {
        type: typeof credential.credentialID,
        isBuffer: Buffer.isBuffer(credential.credentialID),
        length: credential.credentialID?.length,
        bytesHex: Buffer.isBuffer(credential.credentialID) ? 
          credential.credentialID.slice(0, 10).toString('hex') : 'not a buffer'
      },
      credentialPublicKey: {
        type: typeof credential.credentialPublicKey,
        isBuffer: Buffer.isBuffer(credential.credentialPublicKey),
        length: credential.credentialPublicKey?.length,
        bytesHex: Buffer.isBuffer(credential.credentialPublicKey) ? 
          credential.credentialPublicKey.slice(0, 10).toString('hex') : 'not a buffer'
      },
      counter: credential.counter,
      hasCounter: 'counter' in credential,
      counterType: typeof credential.counter
    }, null, 2));
    
    // Ensure all required fields are present and have the correct types
    if (!Buffer.isBuffer(credential.credentialID) || credential.credentialID.length === 0) {
      throw new Error('Invalid credential: credentialID must be a non-empty Buffer');
    }
    
    if (!Buffer.isBuffer(credential.credentialPublicKey) || credential.credentialPublicKey.length === 0) {
      throw new Error('Invalid credential: credentialPublicKey must be a non-empty Buffer');
    }
    
    // Ensure counter exists and is a number (very important!)
    if (credential.counter === undefined || credential.counter === null) {
      console.log('Missing counter in credential, setting to 0');
      credential.counter = 0;
    }
    
    // Ensure counter is a number type
    if (typeof credential.counter !== 'number') {
      console.log(`Converting counter from ${typeof credential.counter} to number`);
      credential.counter = Number(credential.counter) || 0;
    }
    
    console.log('Authenticating with credential:', {
      id: Buffer.from(credential.credentialID).toString('base64url'),
      counter: credential.counter, 
      hasPublicKey: !!credential.credentialPublicKey,
      publicKeyLength: credential.credentialPublicKey?.length || 0,
      firstBytesOfPublicKey: credential.credentialPublicKey ? 
        credential.credentialPublicKey.slice(0, 10).toString('hex') : 'none'
    });
    
    // Create a fresh authenticator object with EXACTLY the required properties
    // This is the critical part that needs fixing
    const authenticator = {
      credentialID: credential.credentialID,
      credentialPublicKey: credential.credentialPublicKey,
      counter: credential.counter || 0
    };
    
    // Double check all required properties with more detailed validation
    if (!authenticator.credentialID || authenticator.credentialID.length === 0) {
      throw new Error('Invalid authenticator: missing or empty credentialID');
    }
    
    if (!authenticator.credentialPublicKey || authenticator.credentialPublicKey.length === 0) {
      throw new Error('Invalid authenticator: missing or empty credentialPublicKey');
    }
    
    if (typeof authenticator.counter !== 'number') {
      console.log(`Converting counter from ${typeof authenticator.counter} to number`);
      authenticator.counter = Number(authenticator.counter) || 0;
    }
    
    console.log('Final authenticator object:', {
      credentialIDLength: authenticator.credentialID.length,
      credentialPublicKeyLength: authenticator.credentialPublicKey.length,
      counter: authenticator.counter,
      objectKeys: Object.keys(authenticator)
    });
    
    // Full, explicit configuration (use a try/catch to get better error info)
    try {
      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: challenge,
        expectedOrigin,
        expectedRPID: rpID,
        authenticator: {
          // Create a completely fresh object with exactly these properties
          credentialID: Buffer.from(authenticator.credentialID),
          credentialPublicKey: Buffer.from(authenticator.credentialPublicKey),
          counter: authenticator.counter
        },
        requireUserVerification: false,
      });
      
      if (verification.verified) {
        // Update the signature counter
        credential.counter = verification.authenticationInfo.newCounter;
        console.log('Updated counter to:', credential.counter);
      }
      
      return { verification, user };
    } catch (verifyError) {
      // Log the detailed error information
      console.error('SimpleWebAuthn verification error:', verifyError);
      console.error('Verification error details:', {
        name: verifyError.name,
        message: verifyError.message,
        stack: verifyError.stack
      });
      
      // Additional debugging for the exact point of failure
      try {
        console.log('Inspecting response data:');
        console.log('- clientDataJSON present:', !!response.response.clientDataJSON);
        console.log('- authenticatorData present:', !!response.response.authenticatorData);
        console.log('- signature present:', !!response.response.signature);
        
        if (response.response.authenticatorData) {
          console.log('- authenticatorData length:', response.response.authenticatorData.length);
        }
      } catch (e) {
        console.error('Error during response inspection:', e);
      }
      
      throw verifyError;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// For development and testing
export function getAllUsers() {
  return Array.from(users.values());
}

// For debugging
export function clearAllData() {
  users.clear();
  challenges.clear();
}
