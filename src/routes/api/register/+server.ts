import { generateRegistrationOptions } from '@simplewebauthn/server';
import type { RequestHandler } from './$types';
import { uuidv7 } from '$lib/utils/uuid';
import { rp } from '$lib/auth/rp';

export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        const { email } = await request.json();
        
        if (!email || !email.includes('@')) {
            return new Response(JSON.stringify({ error: 'Invalid email address' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const userId = uuidv7();
        
        const options = await generateRegistrationOptions({
            rpName: rp.name,
            rpID: rp.id,
            userID: Buffer.from(userId),
            userName: email,
            userDisplayName: email,
            authenticatorSelection: {
                residentKey: 'required',
                requireResidentKey: true,
                userVerification: 'required',
            },
            attestationType: 'none',
        });

        // Store challenge and user info in cookies
        cookies.set('challenge', options.challenge, { 
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'strict'
        });
        
        cookies.set('userId', userId, { 
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'strict'
        });
        
        cookies.set('userEmail', email, { 
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'strict'
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