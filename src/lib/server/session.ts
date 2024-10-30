import { dev } from '$app/environment';

export type Session = {
    challenge: string;
    email?: string;
    userId?: string;
};

const sessions = new Map<string, Session>();

export function getSession(sessionId: string): Session | undefined {
    return sessions.get(sessionId);
}

export function setSession(sessionId: string, session: Session): void {
    sessions.set(sessionId, session);
}

export function clearSession(sessionId: string): void {
    sessions.delete(sessionId);
}

export function generateSessionId(): string {
    return crypto.randomUUID();
}
