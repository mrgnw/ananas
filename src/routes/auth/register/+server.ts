import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createAuthenticator, createUser, getUserByUsername, updateUserChallenge } from '$lib/server/db';

// These values should be stored in your .env file
const rpName = 'Ananas';
const rpID = 'localhost';
const origin = 'http://localhost:5173';

export const POST: RequestHandler = async ({ request, platform }) => {
    try {
        const body = await request.json();
        const username = body.username;
        
        // Check if user already exists
        const existingUser = await getUserByUsername(platform.env.DB, username);
        if (existingUser) {
            return new Response(JSON.stringify({ error: 'Username already exists' }), {
                status: 400
            });
        }

        const userId = crypto.randomUUID();
        
        const options = await generateRegistrationOptions({
            rpName,
            rpID,
            userID: userId,
            userName: username,
            attestationType: 'none',
            authenticatorSelection: {
                residentKey: 'required',
                userVerification: 'preferred'
            }
        });

        // Create new user with challenge
        await createUser(platform.env.DB, {
            id: userId,
            username,
            current_challenge: options.challenge
        });
        
        return json(options);
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Failed to generate registration options' }), {
            status: 400
        });
    }
};

export const PUT: RequestHandler = async ({ request, platform }) => {
    try {
        const body = await request.json();
        const { username } = body;
        
        // Get user and their challenge
        const user = await getUserByUsername(platform.env.DB, username);
        if (!user || !user.current_challenge) {
            return new Response(JSON.stringify({ error: 'Invalid registration session' }), {
                status: 400
            });
        }

        // Verify the registration response
        const verification = await verifyRegistrationResponse({
            response: body,
            expectedChallenge: user.current_challenge,
            expectedOrigin: origin,
            expectedRPID: rpID
        });

        if (verification.verified) {
            const { registrationInfo } = verification;
            
            // Save the new authenticator
            await createAuthenticator(platform.env.DB, {
                user_id: user.id,
                credential_id: registrationInfo.credentialID,
                credential_public_key: registrationInfo.credentialPublicKey,
                counter: registrationInfo.counter
            });

            // Clear the challenge
            await updateUserChallenge(platform.env.DB, user.id, null);

            return json({ verified: true });
        }

        return json({ verified: false });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Failed to verify registration' }), {
            status: 400
        });
    }
};
