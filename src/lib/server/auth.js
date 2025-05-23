import { eq } from 'drizzle-orm';
import { users, sessions } from './schema/users';

// Generate UUID using the Web Crypto API instead of Node's crypto
function randomUUID() {
  // Use standard Web Crypto API to generate UUID
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback implementation if crypto.randomUUID is not available
  const getRandomHex = (c) => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0];
    return (c === 'x' ? r & 0x3 | 0x8 : r & 0xf).toString(16);
  };
  
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, getRandomHex);
}

/**
 * Generate a secure random session token
 * @returns {string} A base64url encoded random token
 */
export function generateSessionToken() {
  // Generate 20 random bytes for the token
  const randomBytes = crypto.getRandomValues(new Uint8Array(20));
  
  // Encode to base64url for cookie storage
  return btoa(String.fromCharCode.apply(null, [...randomBytes]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Hash a session token for secure storage
 * @param {string} token - The session token to hash
 * @returns {Promise<string>} - A hex-encoded hash of the token
 */
export async function hashToken(token) {
  // Create a hash of the token for database storage
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hash = await crypto.subtle.digest('SHA-256', data);
  
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash a password with a random salt using SHA-256
 * @param {string} password - The password to hash
 * @returns {Promise<string>} - A string in format "salt:hash"
 */
async function hashPassword(password) {
  // Generate a unique salt for each user (16 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Combine password with salt and hash
  const encoder = new TextEncoder();
  const data = encoder.encode(password + saltHex);
  const hash = await crypto.subtle.digest('SHA-256', data);
  
  // Store both salt and hash
  const hashHex = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Return salt:hash format
  return `${saltHex}:${hashHex}`;
}

/**
 * Verify a password against a stored hash
 * @param {string} password - The password to verify
 * @param {string} storedHash - The stored hash in format "salt:hash"
 * @returns {Promise<boolean>} - Whether the password is correct
 */
async function verifyPassword(password, storedHash) {
  // Split into salt and hash
  const [saltHex, hashHex] = storedHash.split(':');
  
  // Hash the password with the same salt
  const encoder = new TextEncoder();
  const data = encoder.encode(password + saltHex);
  const hash = await crypto.subtle.digest('SHA-256', data);
  
  // Compare hashes
  const computedHashHex = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return hashHex === computedHashHex;
}

/**
 * Create a new user
 * 
 * @param {Object} db - Drizzle database instance
 * @param {string} email - User email
 * @param {string} password - Plain text password (will be hashed)
 * @param {string} username - Optional username
 * @returns {Promise<Object>} - Created user object (without password)
 */
export async function createUser(db, { email, password = null, username = null }) {
  try {
    console.log('[auth] Starting createUser with email:', email);
    
    const id = randomUUID();
    console.log('[auth] Generated UUID:', id);
    
    const now = Date.now();
    console.log('[auth] Timestamp:', now);
    
    let password_hash = null;
    if (password) {
      console.log('[auth] Hashing password with salt...');
      // Using the new salted password hashing
      password_hash = await hashPassword(password);
      console.log('[auth] Password hashed successfully');
    } else {
      console.log('[auth] Creating user without password (passkey-only)');
    }
    
    const newUser = {
      id,
      email,
      password_hash,
      username,
      created_at: now,
      updated_at: now
    };
    
    console.log('[auth] Prepared user object, inserting into database...');
    
    try {
      // Using db.insert with schema instead of raw SQL
      await db.insert(users).values({
        id,
        email,
        password_hash,
        username,
        created_at: now,
        updated_at: now
      });
      
      console.log('[auth] Database insert successful');
    } catch (insertError) {
      console.error('[auth] Database insert error:', insertError);
      throw insertError;
    }
    
    // Return user without password hash
    const { password_hash: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  } catch (error) {
    console.error('[auth] Error in createUser:', error);
    throw error;
  }
}

/**
 * Authenticate a user and create a session
 * 
 * @param {Object} db - Drizzle database instance
 * @param {string} email - User email
 * @param {string} password - Plain text password
 * @returns {Promise<Object|null>} - Session object if authenticated, null otherwise
 */
export async function authenticateUser(db, { email, password }) {
  // Find user by email
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (!user) {
    return null; // User not found
  }
  
  // Check if user has a password (might be passkey-only user)
  if (!user.password_hash) {
    return null; // User has no password, must use passkey authentication
  }
  
  // Verify password using the new verification method
  // Check if password is using old format (no salt) or new format (salt:hash)
  let isValidPassword;
  if (user.password_hash.includes(':')) {
    // New salted format
    isValidPassword = await verifyPassword(password, user.password_hash);
  } else {
    // Old format - for backward compatibility
    const password_hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
      .then(hash => Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(''));
    isValidPassword = password_hash === user.password_hash;
    
    // Upgrade to new format if password is correct
    if (isValidPassword) {
      console.log('[auth] Upgrading password hash to salted format');
      const newPasswordHash = await hashPassword(password);
      await db.update(users)
        .set({ password_hash: newPasswordHash })
        .where(eq(users.id, user.id));
    }
  }
  
  if (!isValidPassword) {
    return null; // Incorrect password
  }
  
  // Generate a new session token
  const sessionToken = generateSessionToken();
  const now = Date.now();
  
  // Session expires in 30 days
  const expiresAt = now + 30 * 24 * 60 * 60 * 1000;
  
  // Hash the token for storage
  const sessionId = await hashToken(sessionToken);
  
  const session = {
    id: sessionId,
    user_id: user.id,
    expires_at: expiresAt,
    created_at: now
  };
  
  await db.insert(sessions).values(session);
  
  // Return both the token (for cookie) and session info
  return {
    sessionToken,   // For setting in cookie
    sessionId,      // Hashed token stored in DB
    userId: user.id,
    expiresAt,
    user: {
      id: user.id,
      email: user.email,
      username: user.username
    }
  };
}

/**
 * Verify session and get user
 * 
 * @param {Object} db - Drizzle database instance
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object|null>} - User object if session is valid, null otherwise
 */
/**
 * Verify a session token and get the associated session
 * @param {Object} db - Drizzle database instance
 * @param {string} token - Session token from cookie
 * @returns {Promise<Object|null>} - Session object if token is valid, null otherwise
 */
export async function verifySessionToken(db, token) {
  if (!token) return null;
  
  try {
    // Hash the token to get the session ID
    const sessionId = await hashToken(token);
    
    // Find session using the hashed token
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);
    
    if (!session) {
      return null; // Session not found
    }
    
    // Check if session is expired
    if (session.expires_at < Date.now()) {
      // Remove expired session
      await db.delete(sessions).where(eq(sessions.id, sessionId));
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('[auth] Error verifying session token:', error);
    return null;
  }
}

/**
 * Get user from session ID
 * @param {Object} db - Drizzle database instance
 * @param {string} sessionId - Session ID or token
 * @param {boolean} isToken - Whether sessionId is a token that needs to be hashed
 * @returns {Promise<Object|null>} - User object if session is valid, null otherwise
 */
export async function getUserFromSession(db, sessionId, isToken = false) {
  if (!sessionId) return null;
  
  try {
    let session;
    
    if (isToken) {
      // If it's a token, verify it first
      session = await verifySessionToken(db, sessionId);
    } else {
      // Find session using the session ID directly
      [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1);
      
      if (!session) {
        return null; // Session not found
      }
      
      // Check if session is expired
      if (session.expires_at < Date.now()) {
        // Remove expired session
        await db.delete(sessions).where(eq(sessions.id, sessionId));
        return null;
      }
    }
    
    if (!session) {
      return null;
    }
    
    // Check if session should be refreshed (within 15 days of expiration)
    const now = Date.now();
    const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;
    
    if (session.expires_at - now < fifteenDaysMs) {
      // Extend session by 30 days
      const newExpiresAt = now + 30 * 24 * 60 * 60 * 1000;
      await db
        .update(sessions)
        .set({ expires_at: newExpiresAt })
        .where(eq(sessions.id, session.id));
      
      console.log('[auth] Session extended for user:', session.user_id);
    }
    
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
      .where(eq(users.id, session.user_id))
      .limit(1);
    
    return user;
  } catch (error) {
    console.error('[auth] Error in getUserFromSession:', error);
    return null;
  }
}

/**
 * Destroy a session (logout)
 * 
 * @param {Object} db - Drizzle database instance
 * @param {string} sessionId - Session ID
 * @returns {Promise<boolean>} - Whether the session was destroyed
 */
/**
 * Destroy a session by ID or token
 * 
 * @param {Object} db - Drizzle database instance
 * @param {string} sessionIdOrToken - Session ID or token
 * @param {boolean} isToken - Whether the first parameter is a token that needs to be hashed
 * @returns {Promise<boolean>} - Whether the session was destroyed
 */
export async function destroySession(db, sessionIdOrToken, isToken = false) {
  if (!sessionIdOrToken) return false;
  
  try {
    let sessionId = sessionIdOrToken;
    
    // If it's a token, hash it first to get the session ID
    if (isToken) {
      sessionId = await hashToken(sessionIdOrToken);
    }
    
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return true;
  } catch (error) {
    console.error('[auth] Error destroying session:', error);
    return false;
  }
}