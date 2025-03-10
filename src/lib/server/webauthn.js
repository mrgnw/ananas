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
const rpID = dev ? 'localhost' : 'your-production-domain.com'; // Update this with your domain
const expectedOrigin = dev 
  ? ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:5179'] 
  : [`https://${rpID}`];

// In-memory storage for demo purposes - replace with a database in production
const userStore = new Map();
const challengeStore = new Map();

// User management functions
export function getUser(username) {
  return userStore.get(username);
}

export function createUser(username) {
  if (userStore.has(username)) {
    return userStore.get(username);
  }
  
  const user = {
    id: crypto.randomUUID(),
    username,
    credentials: []
  };
  
  userStore.set(username, user);
  return user;
}

// Challenge management functions
export function storeChallenge(username, challenge) {
  challengeStore.set(username, challenge);
}

export function getChallenge(username) {
  return challengeStore.get(username);
}

export function removeChallenge(username) {
  challengeStore.delete(username);
}

// WebAuthn registration functions
export async function generateRegOptions(username) {
  const user = getUser(username) || createUser(username);
  console.log(`Generating registration options for ${username}, user ID: ${user.id}`);
  
  // Get existing credentials to exclude
  const excludeCredentials = user.credentials.map(cred => ({
    id: cred.credentialID,
    type: 'public-key',
    transports: cred.transports || [],
  }));
  
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: isoUint8Array.fromUTF8String(user.id), // Convert string to Uint8Array
    userName: user.username,
    attestationType: 'none',
    excludeCredentials,
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    }
  });
  
  // Store challenge for verification later
  storeChallenge(username, options.challenge);
  console.log(`Stored challenge for ${username}`);
  
  return options;
}

export async function verifyRegResponse(username, response) {
  const user = getUser(username);
  console.log(`Verifying registration for ${username}`, user ? 'User found' : 'User not found');
  
  if (!user) throw new Error("User not found");
  
  const challenge = getChallenge(username);
  console.log(`Challenge for ${username}:`, challenge ? 'Found' : 'Not found');
  
  if (!challenge) throw new Error("Challenge not found");
  
  // Remove challenge to prevent replay attacks
  removeChallenge(username);
  
  try {
    console.log(`Verifying registration response for ${username}`);
    console.log('Response data:', JSON.stringify(response, null, 2));
    
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });
    
    if (verification.verified) {
      const { registrationInfo } = verification;
      console.log(`Registration verified for ${username}, registration info:`, registrationInfo);
      
      // More robust error handling for missing credentialID
      if (!registrationInfo || !registrationInfo.credentialID) {
        console.error(`Missing credentialID in verification response for ${username}`);
        // Use the response.id instead of creating a random ID
        const credentialID = response.id ? 
          Buffer.from(response.id, 'base64url') : 
          Buffer.alloc(32).fill(0); // Safe fallback if even response.id is missing
        
        if (!registrationInfo?.credentialPublicKey) {
          console.error('Missing credentialPublicKey in verification response');
        }
        
        // Log what we're storing
        console.log('Storing credential with:', {
          credentialIDExists: !!credentialID,
          credentialIDLength: credentialID?.length,
          publicKeyExists: !!registrationInfo?.credentialPublicKey,
          publicKeyType: typeof registrationInfo?.credentialPublicKey
        });
        
        // Save the credential with the parsed ID from the response
        user.credentials.push({
          credentialID,
          credentialPublicKey: registrationInfo?.credentialPublicKey || Buffer.from([]),
          counter: 0, // Initialize counter to 0
          transports: response.response.transports || []
        });
        
        console.log(`Created credential from response ID for ${username}`);
      } else {
        // Normal flow - save the credential with the real ID
        // Log what we're storing
        console.log('Storing credential with:', {
          credentialIDExists: !!registrationInfo.credentialID,
          credentialIDLength: registrationInfo.credentialID?.length,
          publicKeyExists: !!registrationInfo.credentialPublicKey,
          publicKeyType: typeof registrationInfo.credentialPublicKey
        });
        
        user.credentials.push({
          credentialID: Buffer.from(registrationInfo.credentialID),
          credentialPublicKey: registrationInfo.credentialPublicKey,
          counter: registrationInfo.counter || 0, // Ensure counter has a default value
          transports: response.response.transports || []
        });
        
        console.log(`Saved credential for ${username} with ID:`, registrationInfo.credentialID);
      }
      
      console.log(`Current credentials for ${username}:`, user.credentials.length);
    } else {
      console.log(`Registration verification failed for ${username}`);
    }
    
    return verification;
  } catch (error) {
    console.error(`Error during registration verification for ${username}:`, error);
    throw error;
  }
}

// WebAuthn authentication functions
export async function generateAuthOptions(username = null) {
  // For passkey (discoverable credential) flow, username can be null
  const user = username ? getUser(username) : null;
  
  // Get user's credentials or empty array for passkey flow
  const allowCredentials = user?.credentials.map(cred => {
    // Convert credentialID to base64url string for authentication options
    const credentialIdBuffer = Buffer.isBuffer(cred.credentialID) ? 
      cred.credentialID : 
      Buffer.from(cred.credentialID || []);
    
    return {
      // SimpleWebAuthn expects a base64url string here, not a raw Buffer
      id: Buffer.from(credentialIdBuffer).toString('base64url'),
      type: 'public-key',
      transports: cred.transports || [],
    };
  }) || [];
  
  console.log('Credential IDs for authentication:', allowCredentials.map(c => c.id));
  
  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: allowCredentials.length ? allowCredentials : undefined,
    userVerification: 'preferred',
  });
  
  // Store challenge for later verification
  // Use a special key for passkey auth when username is not known
  storeChallenge(username || '_passkey_auth_', options.challenge);
  
  return options;
}

export async function verifyAuthResponse(response, username = null) {
  let user;
  let challenge;
  
  if (username) {
    // Username-first authentication flow
    user = getUser(username);
    if (!user) throw new Error('User not found');
    challenge = getChallenge(username);
  } else {
    // Passkey authentication flow (username not known yet)
    challenge = getChallenge('_passkey_auth_');
    
    // We need to find the user based on the credential ID
    // Ensure response.id exists and is valid
    if (!response.id) {
      throw new Error('Missing credential ID in authentication response');
    }
    
    console.log('Looking up credential with ID:', response.id);
    
    // Convert the response.id to a Buffer for consistent comparison
    const responseIdBuffer = Buffer.from(response.id, 'base64url');
    
    for (const [storedUsername, storedUser] of userStore.entries()) {
      console.log(`Checking credentials for user ${storedUsername}, has ${storedUser.credentials.length} credentials`);
      
      const cred = storedUser.credentials.find(c => {
        if (!c.credentialID) {
          console.log('- Skipping credential with null credentialID');
          return false;
        }
        
        const credBuffer = Buffer.isBuffer(c.credentialID) ? 
          c.credentialID : 
          Buffer.from(c.credentialID);
          
        const matches = Buffer.compare(credBuffer, responseIdBuffer) === 0;
        console.log(`- Credential check: ${matches ? 'MATCH' : 'no match'}`);
        return matches;
      });
      
      if (cred) {
        user = storedUser;
        username = storedUsername;
        break;
      }
    }
    
    if (!user) throw new Error('Unknown credential');
  }

  if (!challenge) throw new Error('Challenge not found');
  
  // Remove challenge to prevent replay attacks
  removeChallenge(username || '_passkey_auth_');
  
  let verification;
  try {
    // Find the matching credential based on ID (using Buffer comparison)
    const responseIdBuffer = Buffer.from(response.id, 'base64url');
    console.log(`Looking for credential with ID buffer length:`, responseIdBuffer.length);
    
    // Find user credential with more detailed logging
    const credential = user.credentials.find(c => {
      if (!c.credentialID) {
        console.log('- Found credential without credentialID');
        return false;
      }
      
      const credBuffer = Buffer.isBuffer(c.credentialID) ? 
        c.credentialID : 
        Buffer.from(c.credentialID);
      
      // Log credential buffer details
      console.log('- Comparing credential:', {
        storedLength: credBuffer.length,
        responseLength: responseIdBuffer.length,
        storedType: typeof c.credentialID,
        isBuffer: Buffer.isBuffer(c.credentialID)
      });
          
      const matches = Buffer.compare(credBuffer, responseIdBuffer) === 0;
      console.log(`- Credential check: ${matches ? 'MATCH' : 'no match'}`);
      return matches;
    });
    
    if (!credential) {
      console.error('No matching credential found for', response.id);
      throw new Error('Credential not found');
    }
    
    // Ensure credentials have all required properties
    if (!credential.counter && credential.counter !== 0) {
      console.log('Adding missing counter property to credential');
      credential.counter = 0;
    }
    
    if (!credential.credentialPublicKey) {
      console.error('Credential missing public key');
      throw new Error('Invalid credential: missing public key');
    }
    
    // Log detailed information about the credential for debugging
    console.log('Credential public key:', {
      type: typeof credential.credentialPublicKey,
      isBuffer: Buffer.isBuffer(credential.credentialPublicKey),
      length: credential.credentialPublicKey.length,
      bufferData: Buffer.isBuffer(credential.credentialPublicKey) ? 
        credential.credentialPublicKey.toString('hex').substring(0, 20) + '...' : 'not a buffer'
    });
    
    console.log('Using credential for verification:', {
      idLength: credential.credentialID.length,
      hasPublicKey: !!credential.credentialPublicKey,
      credentialPublicKeyType: typeof credential.credentialPublicKey,
      isPublicKeyBuffer: Buffer.isBuffer(credential.credentialPublicKey),
      counter: credential.counter
    });
    
    // Create an authenticator object with all required properties
    const authenticator = {
      credentialID: credential.credentialID,
      credentialPublicKey: credential.credentialPublicKey,
      counter: credential.counter || 0
    };
    
    console.log('Authenticator object keys:', Object.keys(authenticator));
    
    // Make sure we're passing the right data to the verification function
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID: rpID,
      authenticator,
      requireUserVerification: false,
    });
    
    if (verification.verified) {
      // Update the stored signature counter
      credential.counter = verification.authenticationInfo.newCounter;
    }
    
    return { 
      verification, 
      user 
    };
  } catch (error) {
    console.error('Authentication error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

// For development and testing - get all users
export function getAllUsers() {
  return Array.from(userStore.values());
}
