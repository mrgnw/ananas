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
    beforeEach(() => {
        vi.clearAllMocks();
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
            // Mock request
            const request = new Request('https://example.com/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: 'existing@example.com'
                })
            });

            // Mock DB responses
            mockDB.first.mockResolvedValueOnce({ id: 1, username: 'existing@example.com' });

            // Make request
            const response = await handler.fetch(request, env);

            // Verify response
            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data.error).toBe('Username already exists');
        });
    });

    describe('Authentication', () => {
        it('should handle missing authenticator', async () => {
            // Mock request
            const request = new Request('https://example.com/auth/authenticate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: 'test@example.com'
                })
            });

            // Mock DB responses
            mockDB.first.mockResolvedValueOnce({ id: 1, username: 'test@example.com' });
            mockDB.all.mockResolvedValueOnce({ results: [] });

            // Make request
            const response = await handler.fetch(request, env);

            // Verify response
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
