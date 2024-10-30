import { generateAuthenticationOptions } from '@simplewebauthn/server';
import type { RequestHandler } from './$types';
import { rp } from '$lib/auth/rp';

export const POST: RequestHandler = async ({ request, cookies }) => {
    const { email } = await request.json();

    try {
        const options = await generateAuthenticationOptions({
            rpID: rp.id,
            userVerification: 'required',
            // If you have stored authenticators, you can pass them here:
            // allowCredentials: userAuthenticators.map(authenticator => ({
            //     id: authenticator.credentialID,
            //     type: 'public-key',
            // })),
        });

        // Save the challenge for verification
        cookies.set('challenge', options.challenge, { path: '/' });

        return new Response(JSON.stringify(options), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Failed to generate authentication options' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};