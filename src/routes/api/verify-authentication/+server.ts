import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { RequestHandler } from './$types';
import { rp } from '$lib/auth/rp';

export const POST: RequestHandler = async ({ request, cookies }) => {
    const body = await request.json();
    const expectedChallenge = cookies.get('challenge');
    const userEmail = cookies.get('userEmail');

    if (!expectedChallenge) {
        return new Response(JSON.stringify({ verified: false, error: 'No challenge found' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        // In a real app, you would:
        // 1. Look up the user by email
        // 2. Get their authenticator from the database
        const authenticator = {
            // These values would come from your database
            credentialID: body.id,
            credentialPublicKey: Buffer.from('your-stored-public-key'),
            counter: 0,
        };

        const verification = await verifyAuthenticationResponse({
            response: body,
            expectedChallenge,
            expectedOrigin: rp.origin,
            expectedRPID: rp.id,
            authenticator,
            requireUserVerification: true,
        });

        if (verification.verified) {
            // Set session cookies
            cookies.set('session', 'authenticated', {
                path: '/',
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7, // 1 week
            });
            
            cookies.set('user', userEmail, {
                path: '/',
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7, // 1 week
            });

            // Clean up the challenge
            cookies.delete('challenge', { path: '/' });

            return new Response(JSON.stringify({ 
                verified: true,
                user: { email: userEmail }
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } else {
            return new Response(JSON.stringify({ verified: false, error: 'Verification failed' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    } catch (error: any) {
        console.error(error);
        return new Response(JSON.stringify({ verified: false, error: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};