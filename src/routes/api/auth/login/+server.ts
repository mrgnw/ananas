import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import type { PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/types';

// Drizzle Imports
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '$lib/server/schema';
import { eq } from 'drizzle-orm';

// --- Relying Party details - TODO: Move to environment variables & ensure consistency --- 
const rpID = process.env.NODE_ENV === 'development' ? 'localhost' : 'ananas-8ek.pages.dev'; // Example - Adjust needed!
// --- End of RP details ---

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
    if (!platform?.env?.DB) {
        throw error(500, 'Database configuration error');
    }

    const db = drizzle(platform.env.DB, { schema });
    const { email } = (await request.json()) as { email: string }; // Assert type

    if (!email || typeof email !== 'string') {
        throw error(400, 'Email is required');
    }

    // 1. Find user by email
    let user;
    try {
        const usersFound = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
        if (usersFound.length === 0) {
            // Avoid revealing if email exists or not - use generic error
            throw error(400, 'Authentication failed'); 
        }
        user = usersFound[0];
    } catch (dbError: any) {
        console.error('Database error finding user:', dbError);
        throw error(500, `Database error finding user: ${dbError?.message ?? 'Unknown error'}`);
    }

    // 2. Find user's registered passkeys (authenticators)
    let userAuthenticators;
    try {
        userAuthenticators = await db.select().from(schema.passkeys).where(eq(schema.passkeys.userId, user.id));
    } catch (dbError: any) {
        console.error('Database error finding passkeys:', dbError);
        throw error(500, `Database error finding passkeys: ${dbError?.message ?? 'Unknown error'}`);
    }

    if (userAuthenticators.length === 0) {
        // User exists but has no registered passkeys
        throw error(400, 'No passkeys registered for this user'); 
    }

    const options: PublicKeyCredentialRequestOptionsJSON = await generateAuthenticationOptions({
        rpID,
        // Require users to use a previously-registered authenticator
        allowCredentials: userAuthenticators.map(auth => ({
            id: auth.id, // Passkey ID is already base64url string in DB
            type: 'public-key',
            transports: auth.transports?.split(',') as AuthenticatorTransport[] | undefined,
        })),
        userVerification: 'preferred', // Or 'required' or 'discouraged'
    });

    // Store the challenge and the user ID it belongs to
    const challengePayload = JSON.stringify({
        challenge: options.challenge,
        userId: user.id, // Store the user ID for verification lookup
    });
    cookies.set('authChallengePayload', challengePayload, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 5, // 5 minutes
        sameSite: 'lax',
    });

    // Send options (excluding challenge) to the client
    return json(options);
};
