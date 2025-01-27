import type { D1Database } from '@cloudflare/workers-types';

export interface User {
    id: string;
    username: string;
    created_at: number;
    current_challenge: string | null;
}

export interface Authenticator {
    id: number;
    user_id: string;
    credential_id: Uint8Array;
    credential_public_key: Uint8Array;
    counter: number;
    created_at: number;
}

// Helper functions to convert between Uint8Array and Buffer
function uint8ArrayToBuffer(arr: Uint8Array): Buffer {
    return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
}

function bufferToUint8Array(buf: Buffer): Uint8Array {
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

export async function createUser(db: D1Database, user: Omit<User, 'created_at'>): Promise<void> {
    await db.prepare(
        'INSERT INTO users (id, username, current_challenge) VALUES (?, ?, ?)'
    ).bind(user.id, user.username, user.current_challenge)
    .run();
}

export async function getUserByUsername(db: D1Database, username: string): Promise<User | null> {
    const result = await db.prepare(
        'SELECT * FROM users WHERE username = ?'
    ).bind(username)
    .first<User>();
    return result || null;
}

export async function updateUserChallenge(db: D1Database, userId: string, challenge: string | null): Promise<void> {
    await db.prepare(
        'UPDATE users SET current_challenge = ? WHERE id = ?'
    ).bind(challenge, userId)
    .run();
}

export async function createAuthenticator(
    db: D1Database,
    authenticator: Omit<Authenticator, 'id' | 'created_at'>
): Promise<void> {
    await db.prepare(
        'INSERT INTO authenticators (user_id, credential_id, credential_public_key, counter) VALUES (?, ?, ?, ?)'
    ).bind(
        authenticator.user_id,
        uint8ArrayToBuffer(authenticator.credential_id),
        uint8ArrayToBuffer(authenticator.credential_public_key),
        authenticator.counter
    ).run();
}

export async function getAuthenticatorByCredentialId(
    db: D1Database,
    credentialId: Uint8Array
): Promise<Authenticator | null> {
    const result = await db.prepare(
        'SELECT * FROM authenticators WHERE credential_id = ?'
    ).bind(uint8ArrayToBuffer(credentialId))
    .first<{
        id: number;
        user_id: string;
        credential_id: Buffer;
        credential_public_key: Buffer;
        counter: number;
        created_at: number;
    }>();

    if (!result) return null;

    return {
        ...result,
        credential_id: bufferToUint8Array(result.credential_id),
        credential_public_key: bufferToUint8Array(result.credential_public_key)
    };
}

export async function updateAuthenticatorCounter(
    db: D1Database,
    credentialId: Uint8Array,
    counter: number
): Promise<void> {
    await db.prepare(
        'UPDATE authenticators SET counter = ? WHERE credential_id = ?'
    ).bind(counter, uint8ArrayToBuffer(credentialId))
    .run();
}

export async function getUserAuthenticators(
    db: D1Database,
    userId: string
): Promise<Authenticator[]> {
    const results = await db.prepare(
        'SELECT * FROM authenticators WHERE user_id = ?'
    ).bind(userId)
    .all<{
        id: number;
        user_id: string;
        credential_id: Buffer;
        credential_public_key: Buffer;
        counter: number;
        created_at: number;
    }>();

    return results.results.map(result => ({
        ...result,
        credential_id: bufferToUint8Array(result.credential_id),
        credential_public_key: bufferToUint8Array(result.credential_public_key)
    }));
}
