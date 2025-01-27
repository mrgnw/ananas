import { generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthenticatorByCredentialId, getUserAuthenticators, getUserByUsername, updateAuthenticatorCounter, updateUserChallenge } from '$lib/server/db';

const rpID = 'localhost';
const origin = 'http://localhost:5173';

export const POST: RequestHandler = async ({ request, platform }) => {
    try {
        const body = await request.json();
        const { username } = body;

        // Get user and their authenticators
        const user = await getUserByUsername(platform.env.DB, username);
        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 400
            });
        }

        const userAuthenticators = await getUserAuthenticators(platform.env.DB, user.id);
        if (userAuthenticators.length === 0) {
            return new Response(JSON.stringify({ error: 'No authenticators registered' }), {
                status: 400
            });
        }

        const options = await generateAuthenticationOptions({
            rpID,
            userVerification: 'preferred',
            allowCredentials: userAuthenticators.map(authenticator => ({
                id: authenticator.credential_id,
                type: 'public-key',
                transports: ['internal']
            }))
        });

        // Store the challenge
        await updateUserChallenge(platform.env.DB, user.id, options.challenge);

        return json(options);
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Failed to generate authentication options' }), {
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
            return new Response(JSON.stringify({ error: 'Invalid authentication session' }), {
                status: 400
            });
        }

        // Get the authenticator
        const authenticator = await getAuthenticatorByCredentialId(platform.env.DB, body.id);
        if (!authenticator) {
            return new Response(JSON.stringify({ error: 'Authenticator not found' }), {
                status: 400
            });
        }

        const verification = await verifyAuthenticationResponse({
            response: body,
            expectedChallenge: user.current_challenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            authenticator: {
                credentialID: authenticator.credential_id,
                credentialPublicKey: authenticator.credential_public_key,
                counter: authenticator.counter
            }
        });

        if (verification.verified) {
            // Update the authenticator counter
            await updateAuthenticatorCounter(
                platform.env.DB,
                authenticator.credential_id,
                verification.authenticationInfo.newCounter
            );

            // Clear the challenge
            await updateUserChallenge(platform.env.DB, user.id, null);

            return json({ verified: true });
        }

        return json({ verified: false });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Failed to verify authentication' }), {
            status: 400
        });
    }
};
