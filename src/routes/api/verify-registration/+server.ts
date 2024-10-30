import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RequestHandler } from './$types';
import { rp } from '$lib/auth/rp';
import { getChallenge, clearChallenge } from '$lib/server/auth';
import { dev } from '$app/environment';

export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        const sessionId = cookies.get('sessionId');
        if (!sessionId) {
            return new Response(JSON.stringify({ 
                verified: false, 
                error: 'No session found' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const challengeData = getChallenge(sessionId);
        if (!challengeData) {
            return new Response(JSON.stringify({ 
                verified: false, 
                error: 'Challenge not found or expired' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const body = await request.json();

        const verification = await verifyRegistrationResponse({
            response: body,
            expectedChallenge: challengeData.challenge,
            expectedOrigin: rp.origin,
            expectedRPID: rp.id,
            requireUserVerification: true,
        });

        if (verification.verified) {
            // Clear the challenge after successful verification
            clearChallenge(sessionId);
            cookies.delete('sessionId', { path: '/' });

            // Set authenticated session
            cookies.set('session', 'authenticated', {
                path: '/',
                httpOnly: true,
                secure: !dev,
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7 // 1 week
            });

            return new Response(JSON.stringify({ verified: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ 
            verified: false, 
            error: 'Verification failed' 
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Verification error:', error);
        return new Response(JSON.stringify({ 
            verified: false, 
            error: error.message 
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};