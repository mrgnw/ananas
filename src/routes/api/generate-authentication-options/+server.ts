import { generateAuthenticationOptions } from '@simplewebauthn/server';
import type { RequestHandler } from './$types';
import { rp } from '$lib/auth/rp';

export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        const { email } = await request.json();

        const options = await generateAuthenticationOptions({
            rpID: rp.id,
            userVerification: 'preferred',
            timeout: 60000,
            allowCredentials: []
        });

        cookies.set('challenge', options.challenge, { 
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 60 * 15
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
        console.error(error);
        return new Response(JSON.stringify({ 
            error: error instanceof Error ? error.message : 'Failed to generate authentication options' 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};