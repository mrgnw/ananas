import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { RequestHandler } from './$types';
import { rp } from '$lib/auth/rp';

export const POST: RequestHandler = async ({ request, cookies }) => {
    const body = await request.json();
    const expectedChallenge = cookies.get('challenge');
    const userId = cookies.get('userId');

    if (!expectedChallenge || !userId) {
        return new Response(JSON.stringify({ verified: false, error: 'No challenge found' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const verification = await verifyRegistrationResponse({
            response: body,
            expectedChallenge,
            expectedOrigin: rp.origin,
            expectedRPID: rp.id,
            requireUserVerification: true,
        });

        if (verification.verified) {
            // Here you would typically save the verification.registrationInfo
            // to your database associated with the user
            cookies.delete('challenge', { path: '/' });
            return new Response(JSON.stringify({ verified: true }), {
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