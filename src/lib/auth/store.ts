import { uuidv7 } from '$lib/utils/uuid'; // Adjust the import path as necessary

interface UserSession {
  id: string;
  currentChallenge: string;
  userId?: string;
}

const sessions: { [key: string]: UserSession } = {};

export function createSession(userId?: string): UserSession {
  const id = uuidv7(); // Use uuidv7 instead of uuidv4
  const session: UserSession = { id, currentChallenge: '', userId };
  sessions[id] = session;
  return session;
}

export function getSession(sessionId: string): UserSession | undefined {
  return sessions[sessionId];
}

export function updateChallenge(sessionId: string, challenge: string) {
  const session = getSession(sessionId);
  if (session) {
    session.currentChallenge = challenge;
  }
}

export function clearChallenge(sessionId: string) {
  const session = getSession(sessionId);
  if (session) {
    session.currentChallenge = '';
  }
} 