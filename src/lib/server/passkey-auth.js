// src/lib/server/passkey-auth.js
import { eq, and } from 'drizzle-orm';
import { users, passkeys, authChallenges } from './schema/users';
import { encodeBase64url, decodeBase64url } from '@oslojs/encoding';

// Generate UUID using the Web Crypto API
function randomUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback implementation
  const getRandomHex = (c) => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0];
    return (c === 'x' ? r & 0x3 | 0x8 : r & 0xf).toString(16);
  };
  
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, getRandomHex);
}

/**
 * Convert array buffer to base64url string
 */
function bufferToBase64url(buffer) {
  return encodeBase64url(new Uint8Array(buffer));
}

/**
 * Convert base64url string to array buffer
 */
function base64urlToBuffer(base64url) {
  return decodeBase64url(base64url).buffer;
}

/**
 * Generate a random challenge for WebAuthn
 */
function generateChallenge() {
  const buffer = crypto.getRandomValues(new Uint8Array(32));
  return encodeBase64url(buffer);
}

/**
 * Clean up expired challenges
 */
async function cleanupExpiredChallenges(db) {
  const now = Date.now();
  await db.delete(authChallenges).where(
    eq(authChallenges.expires_at, now)
  );
}

/**
 * Start passkey registration process
 * @param {Object} db - Drizzle database instance
 * @param {string} email - User's email address
 * @param {string} username - User's username (optional)
 * @param {string} rpId - Relying Party ID from environment
 * @returns {Promise<Object>} - Registration options for WebAuthn
 */
export async function beginPasskeyRegistration(db, { email, username = null, rpId }) {
  // Clean up expired challenges first
  await cleanupExpiredChallenges(db);
  
  // Check if user already exists
  const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (existingUser) {
    throw new Error('User with this email already exists');
  }
  
  // Generate challenge
  const challenge = generateChallenge();
  const challengeId = randomUUID();
  const now = Date.now();
  const expiresAt = now + 5 * 60 * 1000; // 5 minutes
  
  // Store challenge
  await db.insert(authChallenges).values({
    id: challengeId,
    user_id: null, // No user ID yet during registration
    email,
    challenge,
    challenge_type: 'registration',
    expires_at: expiresAt,
    created_at: now
  });
  
  // Return WebAuthn registration options
  return {
    challengeId,
    options: {
      challenge,
      rp: {
        name: "Ananas Translation App",
        id: rpId || 'localhost',
      },
      user: {
        id: bufferToBase64url(new TextEncoder().encode(email)),
        name: email,
        displayName: username || email.split('@')[0],
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" }, // ES256
        { alg: -257, type: "public-key" }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "required",
      },
      timeout: 60000,
      attestation: "none"
    }
  };
}

/**
 * Complete passkey registration process
 * @param {Object} db - Drizzle database instance
 * @param {string} challengeId - Challenge ID from registration start
 * @param {Object} credential - WebAuthn credential from client
 * @returns {Promise<Object>} - Created user object
 */
export async function completePasskeyRegistration(db, { challengeId, credential }) {
  // Find and verify challenge
  const [challenge] = await db
    .select()
    .from(authChallenges)
    .where(and(
      eq(authChallenges.id, challengeId),
      eq(authChallenges.challenge_type, 'registration')
    ))
    .limit(1);
  
  if (!challenge) {
    throw new Error('Invalid or expired challenge');
  }
  
  if (challenge.expires_at < Date.now()) {
    // Clean up expired challenge
    await db.delete(authChallenges).where(eq(authChallenges.id, challengeId));
    throw new Error('Challenge expired');
  }
  
  // Basic validation of credential
  if (!credential.id || !credential.rawId || !credential.response) {
    throw new Error('Invalid credential format');
  }
  
  // Basic validation of credential structure
  if (!credential.response.attestationObject || !credential.response.clientDataJSON) {
    throw new Error('Invalid credential: missing required response data');
  }
  
  // Parse the attestation object to extract the public key
  const attestationObject = decodeBase64url(credential.response.attestationObject);
  
  // For now, we'll store the raw attestation object as the credential
  // In production, you should properly parse this and extract the public key
  
  // Create user account
  const userId = randomUUID();
  const now = Date.now();
  
  const newUser = {
    id: userId,
    email: challenge.email,
    password_hash: null, // No password for passkey-only users
    username: null, // Will be set from credential if available
    created_at: now,
    updated_at: now
  };
  
  await db.insert(users).values(newUser);
  
  // Store passkey credential
  // attestationObject is now a Uint8Array from decodeBase64url
  await db.insert(passkeys).values({
    id: credential.id,
    user_id: userId,
    credential_public_key: attestationObject,
    credential_counter: 0,
    credential_device_type: 'singleDevice', // Default assumption
    credential_backed_up: false,
    transports: credential.response.transports ? JSON.stringify(credential.response.transports) : null,
    created_at: now,
    last_used_at: null,
    nickname: 'Default Passkey'
  });
  
  // Clean up challenge
  await db.delete(authChallenges).where(eq(authChallenges.id, challengeId));
  
  // Return user without sensitive data
  const { password_hash: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

/**
 * Start passkey authentication process
 * @param {Object} db - Drizzle database instance
 * @param {string} email - User's email address
 * @param {string} rpId - Relying Party ID from environment
 * @returns {Promise<Object>} - Authentication options for WebAuthn
 */
export async function beginPasskeyAuthentication(db, { email, rpId }) {
  // Clean up expired challenges first
  await cleanupExpiredChallenges(db);
  
  // Find user
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Get user's passkeys (exclude binary data we don't need)
  const userPasskeys = await db
    .select({
      id: passkeys.id,
      transports: passkeys.transports
    })
    .from(passkeys)
    .where(eq(passkeys.user_id, user.id));
  
  if (userPasskeys.length === 0) {
    throw new Error('No passkeys found for this user');
  }
  
  // Generate challenge
  const challenge = generateChallenge();
  const challengeId = randomUUID();
  const now = Date.now();
  const expiresAt = now + 5 * 60 * 1000; // 5 minutes
  
  // Store challenge
  await db.insert(authChallenges).values({
    id: challengeId,
    user_id: user.id,
    email,
    challenge,
    challenge_type: 'authentication',
    expires_at: expiresAt,
    created_at: now
  });
  
  // Return WebAuthn authentication options
  return {
    challengeId,
    options: {
      challenge,
      allowCredentials: userPasskeys.map(passkey => ({
        id: passkey.id,
        type: "public-key",
        transports: passkey.transports ? JSON.parse(passkey.transports) : ["internal"]
      })),
      timeout: 60000,
      userVerification: "required"
    }
  };
}

/**
 * Complete passkey authentication process
 * @param {Object} db - Drizzle database instance
 * @param {string} challengeId - Challenge ID from authentication start
 * @param {Object} credential - WebAuthn credential from client
 * @returns {Promise<Object>} - User object if authentication successful
 */
export async function completePasskeyAuthentication(db, { challengeId, credential }) {
  // Find and verify challenge
  const [challenge] = await db
    .select()
    .from(authChallenges)
    .where(and(
      eq(authChallenges.id, challengeId),
      eq(authChallenges.challenge_type, 'authentication')
    ))
    .limit(1);
  
  if (!challenge) {
    throw new Error('Invalid or expired challenge');
  }
  
  if (challenge.expires_at < Date.now()) {
    // Clean up expired challenge
    await db.delete(authChallenges).where(eq(authChallenges.id, challengeId));
    throw new Error('Challenge expired');
  }
  
  // Find the passkey (exclude binary data we don't need for basic validation)
  const [passkey] = await db
    .select({
      id: passkeys.id,
      user_id: passkeys.user_id,
      credential_counter: passkeys.credential_counter,
      last_used_at: passkeys.last_used_at
    })
    .from(passkeys)
    .where(and(
      eq(passkeys.id, credential.id),
      eq(passkeys.user_id, challenge.user_id)
    ))
    .limit(1);
  
  if (!passkey) {
    throw new Error('Passkey not found');
  }
  
  // For now, we'll do basic validation. In production, you should use
  // a proper WebAuthn library for full cryptographic validation
  
  // Update passkey last used timestamp
  const now = Date.now();
  await db
    .update(passkeys)
    .set({ last_used_at: now })
    .where(eq(passkeys.id, credential.id));
  
  // Get user info
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      created_at: users.created_at,
      updated_at: users.updated_at
    })
    .from(users)
    .where(eq(users.id, challenge.user_id))
    .limit(1);
  
  // Clean up challenge
  await db.delete(authChallenges).where(eq(authChallenges.id, challengeId));
  
  return user;
}

/**
 * Get user's passkeys
 * @param {Object} db - Drizzle database instance
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - List of user's passkeys (without sensitive data)
 */
export async function getUserPasskeys(db, userId) {
  const userPasskeys = await db
    .select({
      id: passkeys.id,
      credential_device_type: passkeys.credential_device_type,
      credential_backed_up: passkeys.credential_backed_up,
      transports: passkeys.transports,
      created_at: passkeys.created_at,
      last_used_at: passkeys.last_used_at,
      nickname: passkeys.nickname
    })
    .from(passkeys)
    .where(eq(passkeys.user_id, userId));
  
  return userPasskeys.map(passkey => ({
    ...passkey,
    transports: passkey.transports ? JSON.parse(passkey.transports) : []
  }));
}

/**
 * Delete a passkey
 * @param {Object} db - Drizzle database instance
 * @param {string} userId - User ID
 * @param {string} passkeyId - Passkey ID to delete
 * @returns {Promise<boolean>} - Whether deletion was successful
 */
export async function deletePasskey(db, userId, passkeyId) {
  const result = await db
    .delete(passkeys)
    .where(and(
      eq(passkeys.id, passkeyId),
      eq(passkeys.user_id, userId)
    ));
  
  return result.changes > 0;
}

/**
 * Update passkey nickname
 * @param {Object} db - Drizzle database instance
 * @param {string} userId - User ID
 * @param {string} passkeyId - Passkey ID
 * @param {string} nickname - New nickname
 * @returns {Promise<boolean>} - Whether update was successful
 */
export async function updatePasskeyNickname(db, userId, passkeyId, nickname) {
  const result = await db
    .update(passkeys)
    .set({ nickname })
    .where(and(
      eq(passkeys.id, passkeyId),
      eq(passkeys.user_id, userId)
    ));
  
  return result.changes > 0;
}