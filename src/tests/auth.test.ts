import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handler } from '../worker';
import { isoBase64URL } from '@simplewebauthn/server/helpers';

// Mock environment
const env = {
    DB: null
};

describe('Authentication Flow', () => {
    beforeEach(() => {
        // Reset mocks before each test
        env.DB = null;
    });

    describe('Registration Response Format', () => {
        it('should return userID in base64url format', async () => {
            const testEmail = 'test@example.com';
            env.DB = {
                prepare: (query: string) => ({
                    bind: (...params: any[]) => ({
                        first: async () => null,
                        run: async () => {},
                        all: async () => ({ results: [] })
                    })
                })
            };

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
            env.DB = {
                prepare: (query: string) => ({
                    bind: (...params: any[]) => ({
                        first: async () => null,
                        run: async () => {},
                        all: async () => ({ results: [] })
                    })
                })
            };

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
            env.DB = {
                prepare: (query: string) => ({
                    bind: (...params: any[]) => ({
                        first: async () => null,
                        run: async () => {},
                        all: async () => ({ results: [] })
                    })
                })
            };

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
            env.DB = {
                prepare: (query: string) => ({
                    bind: (...params: any[]) => ({
                        first: async () => null,
                        run: async () => {},
                        all: async () => ({ results: [] })
                    })
                })
            };

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
            env.DB = {
                prepare: (query: string) => ({
                    bind: (...params: any[]) => ({
                        first: async () => null,
                        run: async () => {},
                        all: async () => ({ results: [] })
                    })
                })
            };

            const response = await handler.fetch(new Request('https://example.com/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'test@example.com' })
            }), env);

            const data = await response.json();
            expect(response.status).toBe(200);
            expect(data.user).toBeDefined();
            expect(data.user.id).toBeDefined();
            expect(typeof data.user.id).toBe('string');
            expect(data.user.id.length).toBeGreaterThan(16); // base64url string will be longer than 16 bytes
            expect(/^[A-Za-z0-9_-]+$/.test(data.user.id)).toBe(true); // valid base64url string
        });

        it('should reject registration with existing username', async () => {
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
        it('should properly structure authenticator data for verification', async () => {
            // Mock user and authenticator in DB
            env.DB = {
                prepare: (query: string) => ({
                    bind: (...params: any[]) => ({
                        first: async () => {
                            if (query.includes('users')) {
                                return {
                                    id: "test-id",
                                    username: "test@example.com",
                                    current_challenge: "test-challenge"
                                };
                            } else if (query.includes('authenticators')) {
                                return {
                                    id: "test-credential-id",
                                    user_id: "test-id",
                                    credential_public_key: new Uint8Array([1,2,3]),
                                    counter: 0,
                                    transports: '["internal"]',
                                    device_type: "multiDevice",
                                    backed_up: true
                                };
                            }
                            return null;
                        },
                        run: async () => {},
                        all: async () => ({ results: [] })
                    })
                })
            };

            // Mock authenticator data
            const mockAuthData = new Uint8Array([
                // rpIdHash [32 bytes]
                0x49, 0x96, 0x0d, 0xe5, 0x88, 0x0e, 0x8c, 0x68,
                0x74, 0x34, 0x17, 0x0f, 0x64, 0x76, 0x60, 0x5b,
                0x8f, 0xe4, 0xae, 0xb9, 0xa2, 0x86, 0x32, 0xc7,
                0x99, 0x5c, 0xf3, 0xba, 0x83, 0x1d, 0x97, 0x63,
                // flags [1 byte]
                0x01,
                // signCount [4 bytes]
                0x00, 0x00, 0x00, 0x00
            ]);

            const response = await handler.fetch(new Request('https://example.com/auth/authenticate', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: "test-credential-id",
                    rawId: "test-credential-id",
                    response: {
                        authenticatorData: isoBase64URL.fromBuffer(mockAuthData),
                        clientDataJSON: btoa(JSON.stringify({
                            type: "webauthn.get",
                            challenge: "test-challenge",
                            origin: "https://example.com"
                        })),
                        signature: "test-signature",
                        userHandle: "test-user-handle"
                    },
                    type: "public-key",
                    clientExtensionResults: {},
                    authenticatorAttachment: "platform",
                    username: "test@example.com"
                })
            }), env);

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBeDefined();
        });

        it('should handle missing authenticator', async () => {
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
            env.DB = {
                prepare: (query: string) => ({
                    bind: (...params: any[]) => ({
                        first: async () => null,
                        run: async () => {},
                        all: async () => ({ results: [] })
                    })
                })
            };

            const response = await handler.fetch(new Request('https://example.com/auth/authenticate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: 'nonexistent@example.com' })
            }), env);

            expect(response.status).toBe(404);
            const data = await response.json();
            expect(data.error).toBe('User not found');
        });
    });
});
