import { randomUUID } from 'crypto';

// Simple session management
// This is for demo purposes - in production use a proper session management library
const sessions = new Map();

// Generate a session ID to track challenges
export function createSession() {
  const sessionId = randomUUID();
  sessions.set(sessionId, {
    created: Date.now(),
    data: {}
  });
  return sessionId;
}

// Store data in session
export function setSessionData(sessionId, key, value) {
  const session = sessions.get(sessionId);
  if (!session) return false;
  
  session.data[key] = value;
  return true;
}

// Get data from session
export function getSessionData(sessionId, key) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  
  return session.data[key];
}

// Remove data from session
export function removeSessionData(sessionId, key) {
  const session = sessions.get(sessionId);
  if (!session) return false;
  
  if (key in session.data) {
    delete session.data[key];
    return true;
  }
  return false;
}

// Clean up expired sessions (older than 5 minutes)
export function cleanupSessions() {
  const now = Date.now();
  const expirationTime = 5 * 60 * 1000; // 5 minutes
  
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.created > expirationTime) {
      sessions.delete(sessionId);
    }
  }
}

// Start a periodic cleanup
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupSessions, 60 * 1000); // Run every minute
}
