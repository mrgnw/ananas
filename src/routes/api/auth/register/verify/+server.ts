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
        // --- Broader Try-Catch Start ---
        const opts: VerifyRegistrationResponseOpts = {
            response: body,
            expectedChallenge: expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            requireUserVerification: false, // Set to true if you want to enforce user verification (PIN, Biometrics)
        };
        verification = await verifyRegistrationResponse(opts);

        // --- DEBUGGING: Log the entire verification object --- 
        console.log('--- Full Verification Object ---');
        console.dir(verification, { depth: null }); // Use console.dir for better object inspection
        console.log('------------------------------------');

        // Extract necessary info from verification result
        const { registrationInfo } = verification;
        if (!registrationInfo) {
            // Should theoretically have registrationInfo if verification succeeded
            throw new Error('Missing registration info after verification');
        }
        // Access properties based on actual structure from console.dir output
        // @ts-ignore - Bypassing type errors if definition mismatches runtime structure
        const credential = registrationInfo.credential as { id: string; publicKey: Uint8Array; counter: number };
        const credentialID = credential.id;
        const credentialPublicKey = credential.publicKey;
        const counter = credential.counter;
        
        // These seem to be direct properties based on logs
        const deviceType = registrationInfo.credentialDeviceType;
        const backedUp = registrationInfo.credentialBackedUp;

        // Prepare data for passkey table
        const webauthnUserId = userId; // This should be the user ID we passed to generate options
        const transportsString = body.response.transports?.join(',');

        try {
            // Explicitly convert publicKey to Buffer for Drizzle/TypeScript
            const publicKeyBuffer = Buffer.from(credentialPublicKey);

            // --- DEBUGGING: Log values and types immediately before insert attempt ---
            console.log('--- Attempting to Insert Passkey ---');
            console.log('id (string):', credentialID, typeof credentialID); // Should be base64url string
            console.log('publicKey (Buffer):', publicKeyBuffer, typeof publicKeyBuffer, publicKeyBuffer instanceof Buffer); // Log the buffer
            console.log('counter:', counter, typeof counter);
            console.log('userId:', userId, typeof userId);
            console.log('webauthnUserId:', webauthnUserId, typeof webauthnUserId);
            console.log('deviceType:', deviceType, typeof deviceType);
            console.log('backedUp (boolean):', backedUp, typeof backedUp);
            console.log('transports:', transportsString, typeof transportsString);
            console.log('------------------------------------');

            // Perform inserts sequentially as D1 transactions via drizzle seem problematic
            // 1. Create the user record
            await db.insert(schema.users).values({
                id: userId,
                email: email, // Use email from the challenge payload
            }).onConflictDoNothing(); // Or handle conflict appropriately

            // 2. Create the passkey credential
            await db.insert(schema.passkeys).values({
                // Use schema column names
                id: credentialID, // Now using correct variable derived from registrationInfo.credential.id
                // publicKey: publicKeyBuffer, // Temporarily commented out
                counter: counter, // Now using correct variable derived from registrationInfo.credential.counter
                userId: userId,
                webauthnUserId: webauthnUserId, // Assuming this corresponds to the user ID used in webauthn flow
                deviceType: deviceType,
                // backedUp: backedUp, // Temporarily commented out
                // transports: transportsString // Temporarily commented out
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

            return json({ success: true, verified: verification.verified });

        } catch (dbInsertError: any) {
            // Handle potential database errors during passkey insertion
            console.error('Failed to save passkey to DB:', dbInsertError);
            // IMPORTANT: Consider rolling back user creation if passkey fails?
            // For now, just report the error.
            throw error(500, `Database error during passkey registration: ${dbInsertError.message}`);
        }
        // --- Broader Try-Catch End ---
    } catch (err: any) {
        // Catch errors from verification or data preparation stages
        console.error('Error during registration verification or data prep:', err);
        return json({ success: false, error: `Verification failed: ${err.message}` }, { status: 400 });
    }
};
