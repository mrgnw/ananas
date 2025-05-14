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

// For password hashing in a web environment, we'll use the Web Crypto API
async function hashPassword(password) {
  // Convert password string to an array buffer
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // Generate hash using SHA-256
  const hash = await crypto.subtle.digest('SHA-256', data);
  
  // Convert hash to a hex string
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
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
export async function createUser(db, { email, password, username = null }) {
  try {
    console.log('[auth] Starting createUser with email:', email);
    
    const id = randomUUID();
    console.log('[auth] Generated UUID:', id);
    
    const now = Date.now();
    console.log('[auth] Timestamp:', now);
    
    console.log('[auth] Hashing password...');
    const password_hash = await hashPassword(password);
    console.log('[auth] Password hashed successfully');
    
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
  
  // Check password
  const password_hash = await hashPassword(password);
  if (password_hash !== user.password_hash) {
    return null; // Incorrect password
  }
  
  // Create a new session
  const sessionId = randomUUID();
  const now = Date.now();
  // Session expires in 30 days
  const expiresAt = now + 30 * 24 * 60 * 60 * 1000;
  
  const session = {
    id: sessionId,
    user_id: user.id,
    expires_at: expiresAt,
    created_at: now
  };
  
  await db.insert(sessions).values(session);
  
  return {
    sessionId,
    userId: user.id,
    expiresAt
  };
}

/**
 * Verify session and get user
 * 
 * @param {Object} db - Drizzle database instance
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object|null>} - User object if session is valid, null otherwise
 */
export async function getUserFromSession(db, sessionId) {
  if (!sessionId) return null;
  
  // Find session
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
}

/**
 * Destroy a session (logout)
 * 
 * @param {Object} db - Drizzle database instance
 * @param {string} sessionId - Session ID
 * @returns {Promise<boolean>} - Whether the session was destroyed
 */
export async function destroySession(db, sessionId) {
  if (!sessionId) return false;
  
  await db.delete(sessions).where(eq(sessions.id, sessionId));
  return true;
}