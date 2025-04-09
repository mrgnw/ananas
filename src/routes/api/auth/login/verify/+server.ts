import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { AuthenticationResponseJSON } from '@simplewebauthn/types';
import type { VerifiedAuthenticationResponse, VerifyAuthenticationResponseOpts } from '@simplewebauthn/server';

// Buffer for base64 handling
import { Buffer } from 'buffer';

// Drizzle Imports
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { dev } from '$app/environment'; // Import dev for secure cookie flag

// --- Relying Party details - TODO: Move to environment variables & ensure consistency --- 
const rpID = process.env.NODE_ENV === 'development' ? 'localhost' : 'ananas-8ek.pages.dev'; // Example - Adjust needed!
const origin = process.env.NODE_ENV === 'development' ? `http://${rpID}:5173` : `https://${rpID}`; // Example - Adjust needed!
// --- End of RP details ---

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
    if (!platform?.env?.DB) {
        throw error(500, 'Database configuration error');
    }

    const db = drizzle(platform.env.DB, { schema });
    const body: AuthenticationResponseJSON = await request.json();

    const challengePayloadCookie = cookies.get('authChallengePayload');
    if (!challengePayloadCookie) {
        throw error(400, 'Challenge cookie not found. Authentication might have timed out.');
    }

    // Parse challenge and userId from cookie
    let expectedChallenge: string;
    let userId: string;
    try {
        const payload = JSON.parse(challengePayloadCookie);
        expectedChallenge = payload.challenge;
        userId = payload.userId;
        if (!expectedChallenge || !userId) {
            throw new Error('Invalid auth challenge payload');
        }
    } catch (e) {
        throw error(400, 'Invalid auth challenge cookie format.');
    }

    // Clean up challenge cookie immediately
    cookies.delete('authChallengePayload', { path: '/' });

    // 1. Get the user
    const usersFound = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (usersFound.length === 0) {
        throw error(400, 'Authentication failed (user not found)');
    }
    const user = usersFound[0];

    // 2. Get the specific passkey/authenticator used for this login attempt
    const authenticatorIdBase64Url = body.id;
    const authenticator = await db.query.passkeys.findFirst({
        where: eq(schema.passkeys.id, authenticatorIdBase64Url), // DB stores base64url id
    });

    if (!authenticator) {
        throw error(400, `Could not find authenticator with ID ${authenticatorIdBase64Url} for user ${userId}`);
    }

    // 3. Verify the authentication response
    let verification: VerifiedAuthenticationResponse;
    try {
        const opts: VerifyAuthenticationResponseOpts = {
            response: body,
            expectedChallenge: expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            authenticator: {
                credentialID: Buffer.from(authenticator.id, 'base64url'), // Convert base64url string ID from DB back to buffer
                credentialPublicKey: authenticator.publicKey, // This is already a buffer/blob from DB
                counter: authenticator.counter,
                transports: authenticator.transports?.split(',') as AuthenticatorTransport[] | undefined,
            },
            requireUserVerification: false, // Adjust as needed (e.g., true)
        };
        verification = await verifyAuthenticationResponse(opts);
    } catch (err: any) {
        console.error('Authentication verification failed:', err);
        return json({ success: false, error: `Verification failed: ${err.message}` }, { status: 400 });
    }

    const { verified, authenticationInfo } = verification;

    if (!verified || !authenticationInfo) {
        return json({ success: false, error: 'Could not verify authentication.' }, { status: 400 });
    }

    // 4. Update the authenticator's counter in the database
    try {
        await db.update(schema.passkeys)
            .set({ counter: authenticationInfo.newCounter })
            .where(eq(schema.passkeys.id, authenticator.id)); // Use the original base64url ID here

        // Set session cookie upon successful login verification
        const SESSION_COOKIE_NAME = 'auth_session';
        cookies.set(SESSION_COOKIE_NAME, userId, {
            path: '/',
            httpOnly: true,
            secure: !dev, // Use secure flag in production
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days (adjust as needed)
        });

        return json({ success: true, verified });

    } catch (dbError: any) {
        console.error('Failed to update passkey counter:', dbError);
        throw error(500, `Database error during authentication: ${dbError.message}`);
    }
};
