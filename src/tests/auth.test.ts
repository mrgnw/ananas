import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateRegistrationOptions, generateAuthenticationOptions } from '@simplewebauthn/server';

// Mock D1 database
const mockDB = {
    prepare: vi.fn().mockReturnThis(),
    bind: vi.fn().mockReturnThis(),
    first: vi.fn(),
    run: vi.fn(),
    all: vi.fn()
};

// Mock Cloudflare env
const env = {
    DB: mockDB
};

// Import worker (we'll need to export the handler)
import handler from '../worker';

describe('Authentication Flow', () => {
    let env: any;

    beforeEach(() => {
        // Mock D1 database
        env = {
            DB: {
                prepare: (query: string) => ({
                    bind: (...params: any[]) => ({
                        first: async () => null,
                        run: async () => {},
                        all: async () => ({ results: [] })
                    })
                })
            }
        };
        vi.clearAllMocks();
    });

    describe('Registration Response Format', () => {
        it('should return userID in base64url format', async () => {
            const testEmail = 'test@example.com';
            const response = await handler.fetch(new Request('https://example.com/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: testEmail })
            }), env);

            expect(response.status).toBe(200);
            const data = await response.json();
            
            // Verify user object structure
            expect(data.user).toBeDefined();
            expect(data.user.id).toBeDefined();
            expect(data.user.name).toBe(testEmail);
            expect(data.user.displayName).toBe(testEmail);

            // Verify userID format (base64url)
            expect(typeof data.user.id).toBe('string');
            expect(data.user.id.length).toBeGreaterThan(16); // Should be longer than 16 bytes when base64 encoded
            expect(data.user.id).toMatch(/^[A-Za-z0-9_-]+$/); // base64url chars only
            expect(data.user.id).not.toContain('='); // no padding in base64url
            expect(data.user.id).not.toContain('/'); // no forward slashes in base64url
            expect(data.user.id).not.toContain('+'); // no plus signs in base64url
        });

        it('should return consistent userID format across requests', async () => {
            const responses = await Promise.all([
                handler.fetch(new Request('https://example.com/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: 'test1@example.com' })
                }), env),
                handler.fetch(new Request('https://example.com/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: 'test2@example.com' })
                }), env)
            ]);

            const data = await Promise.all(responses.map(r => r.json()));
            
            // Both responses should have valid base64url userIDs
            data.forEach(d => {
                expect(d.user.id).toMatch(/^[A-Za-z0-9_-]+$/);
                expect(d.user.id).not.toContain('=');
                expect(d.user.id).not.toContain('/');
                expect(d.user.id).not.toContain('+');
            });

            // UserIDs should be different
            expect(data[0].user.id).not.toBe(data[1].user.id);
        });

        it('should include all required WebAuthn fields', async () => {
            const response = await handler.fetch(new Request('https://example.com/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'test@example.com' })
            }), env);

            const data = await response.json();
            
            // Check required WebAuthn registration fields
            expect(data).toHaveProperty('challenge');
            expect(data.challenge).toMatch(/^[A-Za-z0-9_-]+$/); // base64url format
            
            expect(data).toHaveProperty('rp');
            expect(data.rp).toHaveProperty('name');
            expect(data.rp).toHaveProperty('id');
            
            expect(data).toHaveProperty('user');
            expect(data.user).toHaveProperty('id');
            expect(data.user).toHaveProperty('name');
            expect(data.user).toHaveProperty('displayName');
            
            expect(data).toHaveProperty('pubKeyCredParams');
            expect(Array.isArray(data.pubKeyCredParams)).toBe(true);
            expect(data.pubKeyCredParams.length).toBeGreaterThan(0);
            
            expect(data).toHaveProperty('timeout');
            expect(typeof data.timeout).toBe('number');
            
            expect(data).toHaveProperty('attestation');
            expect(data).toHaveProperty('authenticatorSelection');
        });
    });

    describe('Base64URL Conversion', () => {
        it('should properly encode and decode base64url', async () => {
            const testEmail = 'test@example.com';
            const response = await handler.fetch(new Request('https://example.com/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: testEmail })
            }), env);

            const data = await response.json();
            expect(response.status).toBe(200);
            expect(data.user.id).toBeDefined();
            expect(typeof data.user.id).toBe('string');
            expect(/^[A-Za-z0-9_-]+$/.test(data.user.id)).toBe(true); // valid base64url string
            expect(data.user.name).toBe(testEmail);
            expect(data.user.displayName).toBe(testEmail);
        });
    });

    describe('Registration', () => {
        it('should convert userID to Uint8Array during registration', async () => {
            // Mock request
            const request = new Request('https://example.com/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: 'test@example.com'
                })
            });

            // Mock DB responses
            mockDB.first.mockResolvedValueOnce(null); // User doesn't exist

            // Make request
            const response = await handler.fetch(request, env);
            const data = await response.json();

            // Verify response
            expect(response.status).toBe(200);
            expect(data.user).toBeDefined();
            expect(data.user.id).toBeDefined();
            expect(typeof data.user.id).toBe('string');
            expect(data.user.id.length).toBeGreaterThan(16); // base64url string will be longer than 16 bytes
            expect(/^[A-Za-z0-9_-]+$/.test(data.user.id)).toBe(true); // valid base64url string
        });

        it('should reject registration with existing username', async () => {
            // Mock existing user
            env.DB = {
                prepare: (query: string) => ({
                    bind: (...params: any[]) => ({
                        first: async () => ({ id: "existing-id", username: "existing@example.com" }),
                        run: async () => {},
                        all: async () => ({ results: [] })
                    })
                })
            };

            const response = await handler.fetch(new Request('https://example.com/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'existing@example.com' })
            }), env);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Username already exists');
        });
    });

    describe('Authentication', () => {
        it('should handle missing authenticator', async () => {
            // Mock user without authenticator
            env.DB = {
                prepare: (query: string) => ({
                    bind: (...params: any[]) => ({
                        first: async () => query.includes('users') ? 
                            { id: "test-id", username: "test@example.com" } : 
                            null,
                        run: async () => {},
                        all: async () => ({ results: [] })
                    })
                })
            };

            const response = await handler.fetch(new Request('https://example.com/auth/authenticate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'test@example.com' })
            }), env);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('No authenticators registered');
        });

        it('should handle non-existent user', async () => {
            // Mock request
            const request = new Request('https://example.com/auth/authenticate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: 'nonexistent@example.com'
                })
            });

            // Mock DB responses
            mockDB.first.mockResolvedValueOnce(null);

            // Make request
            const response = await handler.fetch(request, env);

            // Verify response
            expect(response.status).toBe(404);
            const data = await response.json();
            expect(data.error).toBe('User not found');
        });
    });
});
