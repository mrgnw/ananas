import { generateRegistrationOptions } from '@simplewebauthn/server';
import type { RequestHandler } from './$types';
import { uuidv7 } from '$lib/utils/uuid';
import { rp } from '$lib/auth/rp';

export const POST: RequestHandler = async ({ request, cookies }) => {
    const userId = uuidv7();

    try {
        const options = await generateRegistrationOptions({
            rpName: rp.name,
            rpID: rp.id,
            userID: userId,
            userName: userId,
            userDisplayName: userId,
            authenticatorSelection: {
                residentKey: 'required',
                requireResidentKey: true,
                userVerification: 'required',
            },
            attestationType: 'none',
        });

        cookies.set('challenge', options.challenge, { path: '/' });
        cookies.set('userId', userId, { path: '/' });

        return new Response(JSON.stringify(options), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Failed to generate registration options' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};