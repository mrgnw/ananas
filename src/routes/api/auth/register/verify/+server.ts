import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { VerifiedRegistrationResponse, VerifyRegistrationResponseOpts } from '@simplewebauthn/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/types';

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
    const body: RegistrationResponseJSON = await request.json();

    const challengePayloadCookie = cookies.get('registrationChallengePayload');

    if (!challengePayloadCookie) {
        throw error(400, 'Challenge cookie not found. Registration might have timed out.');
    }

    // Parse challenge, userId, and userName from cookie
    let expectedChallenge: string;
    let userId: string;
    let userName: string;
    try {
        const payload = JSON.parse(challengePayloadCookie);
        expectedChallenge = payload.challenge;
        userId = payload.userId;
        userName = payload.userName;
        if (!expectedChallenge || !userId || !userName) {
            throw new Error('Invalid challenge payload');
        }
    } catch (e) {
        throw error(400, 'Invalid challenge cookie format.');
    }

    // Clean up challenge cookie immediately after retrieving
    cookies.delete('registrationChallengePayload', { path: '/' }); 

    let verification: VerifiedRegistrationResponse;
    try {
        const opts: VerifyRegistrationResponseOpts = {
            response: body,
            expectedChallenge: expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            requireUserVerification: false, // Set to true if you want to enforce user verification (PIN, Biometrics)
        };
        verification = await verifyRegistrationResponse(opts);
    } catch (err: any) {
        console.error('Registration verification failed:', err);
        return json({ success: false, error: `Verification failed: ${err.message}` }, { status: 400 });
    }

    const { verified, registrationInfo } = verification;

    if (!verified || !registrationInfo) {
        return json({ success: false, error: 'Could not verify registration.' }, { status: 400 });
    }

    // Add extra check to satisfy TypeScript before destructuring
    if (!registrationInfo) {
        // This case should logically not be reached if verified is true
        console.error('Registration info missing despite successful verification flag.');
        return json({ success: false, error: 'Internal error: Registration info missing.' }, { status: 500 });
    }

    const { 
        credentialPublicKey,
        credentialID, 
        counter, 
        credentialDeviceType, 
        credentialBackedUp 
    } = registrationInfo;

    // We retrieved the userId from the challenge cookie now.
    // We should also verify that the userHandle returned by the authenticator
    // corresponds to the userId we expect, although simplewebauthn server
    // should handle part of this consistency check.

    // TODO: Check if credentialID already exists for any user? Should be unlikely.

    try {
        // Using a transaction for atomicity
        await db.transaction(async (tx) => {
            // 1. Create the user (handle potential conflicts if username/email were involved)
            // Since we used a random UUID for ID, conflict is unlikely on ID itself.
            await tx.insert(schema.users).values({
                id: userId, // Use the ID retrieved from the cookie
                username: userName, // Use the username retrieved from the cookie
            }).onConflictDoNothing(); // Or handle conflict appropriately
            
            // 2. Create the passkey credential
            await tx.insert(schema.passkeys).values({
                id: Buffer.from(credentialID).toString('base64url'), // Use base64url credentialID as passkey ID
                userId: userId,
                publicKey: Buffer.from(credentialPublicKey), // Store as buffer
                webauthnUserId: userId, // This is the user.id used in WebAuthn ceremonies
                counter: counter,
                deviceType: credentialDeviceType,
                backedUp: credentialBackedUp,
                transports: body.response.transports?.join(',') || null, // Store transports as comma-separated string
            });
        });

        // Set session cookie upon successful registration
        const SESSION_COOKIE_NAME = 'auth_session';
        cookies.set(SESSION_COOKIE_NAME, userId, {
            path: '/',
            httpOnly: true,
            secure: !dev, // Use secure flag in production
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return json({ success: true, verified });

    } catch (dbError: any) {
        console.error('Failed to save user/passkey to DB:', dbError);
        // TODO: Check for specific errors like UNIQUE constraint violations
        throw error(500, `Database error during registration: ${dbError.message}`);
    }
};
