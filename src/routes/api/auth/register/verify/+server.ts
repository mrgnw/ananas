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

export const POST: RequestHandler = async (event) => {
    const { cookies, request, platform } = event;

    if (!platform?.env?.DB) {
        throw error(500, 'Database configuration error');
    }

    const db = drizzle(platform.env.DB, { schema });
    const body: RegistrationResponseJSON = await request.json();

    const challengePayloadCookie = cookies.get('registrationChallengePayload');

    if (!challengePayloadCookie) {
        throw error(400, 'Challenge cookie not found. Registration might have timed out.');
    }

    // Parse challenge, userId, and email from cookie
    let expectedChallenge: string;
    let userId: string;
    let email: string;
    try {
        const payload = JSON.parse(challengePayloadCookie);
        expectedChallenge = payload.challenge;
        userId = payload.userId;
        email = payload.email;
        if (!expectedChallenge || !userId || !email) {
            throw new Error('Invalid auth challenge payload');
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

    // We retrieved the userId from the challenge cookie now.
    // We should also verify that the userHandle returned by the authenticator
    // corresponds to the userId we expect, although simplewebauthn server
    // should handle part of this consistency check.

    // TODO: Check if credentialID already exists for any user? Should be unlikely.

    try {
        // Perform inserts sequentially as D1 transactions via drizzle seem problematic
        // 1. Create the user record
        await db.insert(schema.users).values({
            id: userId,
            email: email, // Use email from the challenge payload
        }).onConflictDoNothing(); // Or handle conflict appropriately

        // 2. Create the passkey credential
        if (!verification.registrationInfo) {
            throw new Error('Registration info missing from verification result.');
        }
        const { credentialPublicKey, credentialID, counter } = verification.registrationInfo as any;

        // Extract additional needed fields safely, providing non-null values
        const webauthnUserId = userId; // This should be the user ID we passed to generate options
        const deviceType = (verification.registrationInfo as any).credentialDeviceType;
        const backedUp = (verification.registrationInfo as any).credentialBackedUp;
        const backedUpInt = backedUp ? 1 : 0; // Convert boolean to integer 0 or 1

        // --- DEBUGGING: Log values and types before insert ---
        console.log('--- Inserting Passkey ---');
        console.log('id:', credentialID, typeof credentialID);
        console.log('publicKey:', credentialPublicKey, typeof credentialPublicKey, credentialPublicKey instanceof Uint8Array);
        console.log('counter:', counter, typeof counter);
        console.log('userId:', userId, typeof userId);
        console.log('webauthnUserId:', webauthnUserId, typeof webauthnUserId);
        console.log('deviceType:', deviceType, typeof deviceType);
        console.log('backedUp (int):', backedUpInt, typeof backedUpInt);
        console.log('transports:', body.response.transports?.join(','), typeof body.response.transports?.join(','));
        console.log('-------------------------');

        await db.insert(schema.passkeys).values({
            // Use schema column names
            id: Buffer.from(credentialID).toString('base64url'), // Credential ID is the primary key 'id' for the passkey
            publicKey: Buffer.from(credentialPublicKey), // Store public key directly as Buffer (assuming schema is blob)
            counter: counter,
            userId: userId,
            webauthnUserId: webauthnUserId, // Assuming this corresponds to the user ID used in webauthn flow
            deviceType: deviceType,
            backedUp: backedUpInt, // Insert the integer value
            transports: body.response.transports?.join(','), // Store transports as comma-separated string
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
