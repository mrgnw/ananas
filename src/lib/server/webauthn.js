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
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });
    
    if (verification.verified) {
      const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
      console.log(`Registration verified for ${username}, adding credential`);
      
      // Save the new credential
      user.credentials.push({
        credentialID,
        credentialPublicKey,
        counter,
        transports: response.response.transports || []
      });
      
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
  const allowCredentials = user?.credentials.map(cred => ({
    id: cred.credentialID,
    type: 'public-key',
    transports: cred.transports || [],
  })) || [];
  
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
    for (const [storedUsername, storedUser] of userStore.entries()) {
      const cred = storedUser.credentials.find(
        c => c.credentialID === response.id
      );
      
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
    const credential = user.credentials.find(c => c.credentialID === response.id);
    
    if (!credential) throw new Error('Credential not found');
    
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: credential.credentialID,
        credentialPublicKey: credential.credentialPublicKey,
        counter: credential.counter,
      },
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
    console.error(error);
    throw error;
  }
}

// For development and testing - get all users
export function getAllUsers() {
  return Array.from(userStore.values());
}
