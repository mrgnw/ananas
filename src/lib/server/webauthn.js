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
            fallbackPublicKey = Buffer.from(response.response.publicKey, 'base64');
          }
        } catch (e) {
          console.error('Failed to extract fallback public key:', e);
        }
        
        // Create a minimal credential with what we have
        const credential = {
          credentialID: credentialID || Buffer.from(response.id, 'base64url'),
          credentialPublicKey: fallbackPublicKey || Buffer.alloc(0),
          counter: counter || 0,
          transports: response.response.transports || []
        };
        
        console.log('Using fallback credential data:', {
          idLength: credential.credentialID.length,
          hasPublicKey: !!credential.credentialPublicKey,
          publicKeyLength: credential.credentialPublicKey.length
        });
        
        // Add credential to user without validation (may not work for authentication)
        user.credentials.push(credential);
        console.warn(`Added credential with potentially invalid public key for ${username}`);
        
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
    
    // Enhanced validation for the credential public key
    if (!credential.credentialPublicKey) {
      console.error('Credential missing public key');
      throw new Error('Invalid credential: missing public key');
    }
    
    if (credential.credentialPublicKey.length === 0) {
      console.error('Credential has empty public key');
      throw new Error('Invalid credential: empty public key');
    }
    
    console.log('Authenticating with credential:', {
      id: Buffer.from(credential.credentialID).toString('base64url'),
      counter: credential.counter, 
      hasPublicKey: !!credential.credentialPublicKey,
      publicKeyLength: credential.credentialPublicKey.length,
      firstBytesOfPublicKey: credential.credentialPublicKey.slice(0, 10).toString('hex')
    });
    
    // Create a CLEAN authenticator object for verification
    const authenticator = {
      credentialID: credential.credentialID,
      credentialPublicKey: credential.credentialPublicKey,
      counter: credential.counter
    };
    
    // Double check all required properties
    if (!authenticator.credentialID || !authenticator.credentialPublicKey || typeof authenticator.counter !== 'number') {
      console.error('Invalid authenticator object:', authenticator);
      throw new Error('Invalid authenticator object for verification');
    }
    
    console.log('Authenticator object keys:', Object.keys(authenticator));
    
    // Full, explicit configuration
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID: rpID,
      authenticator,
      requireUserVerification: false,
    });
    
    if (verification.verified) {
      // Update the signature counter
      credential.counter = verification.authenticationInfo.newCounter;
      console.log('Updated counter to:', credential.counter);
    }
    
    return { verification, user };
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
