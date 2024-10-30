// Create a new file to handle auth-related server functionality
import { dev } from '$app/environment';

// In-memory store for development
// In production, use Redis or a database
const challengeStore = new Map<string, {
    challenge: string;
    email: string;
    timestamp: number;
}>();

const CHALLENGE_TIMEOUT_MS = 300000; // 5 minutes

export function storeChallenge(sessionId: string, challenge: string, email: string) {
    challengeStore.set(sessionId, {
        challenge,
        email,
        timestamp: Date.now()
    });
}

export function getChallenge(sessionId: string) {
    const data = challengeStore.get(sessionId);
    if (!data) return null;
    
    // Check if challenge has expired
    if (Date.now() - data.timestamp > CHALLENGE_TIMEOUT_MS) {
        challengeStore.delete(sessionId);
        return null;
    }
    
    return data;
}

export function clearChallenge(sessionId: string) {
    challengeStore.delete(sessionId);
}

export function generateSessionId(): string {
    return crypto.randomUUID();
}