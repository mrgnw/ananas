import { generateRegistrationOptions } from '@simplewebauthn/server';
import type { RequestHandler } from './$types';
import { rp } from '$lib/auth/rp';
import { generateSessionId, storeChallenge } from '$lib/server/auth';
import { dev } from '$app/environment';

export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        const { email } = await request.json();
        
        if (!email || !email.includes('@')) {
            return new Response(JSON.stringify({ error: 'Invalid email address' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Generate userId as Uint8Array
        const userId = new TextEncoder().encode(crypto.randomUUID());
        
        const options = await generateRegistrationOptions({
            rpName: rp.name,
            rpID: rp.id,
            userID: userId,
            userName: email,
            userDisplayName: email,
            authenticatorSelection: {
                residentKey: 'required',
                requireResidentKey: true,
                userVerification: 'required',
            },
            attestationType: 'none',
        });

        // Store challenge with session
        const sessionId = generateSessionId();
        storeChallenge(sessionId, options.challenge, email);

        // Set session cookie
        cookies.set('sessionId', sessionId, {
            path: '/',
            httpOnly: true,
            secure: !dev,
            sameSite: 'strict',
            maxAge: 300 // 5 minutes
        });

        return new Response(JSON.stringify(options), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Registration error:', error);
        return new Response(JSON.stringify({ 
            error: error instanceof Error ? error.message : 'Failed to generate registration options' 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};