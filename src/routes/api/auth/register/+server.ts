import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/types';
import { Buffer } from 'buffer'; // Node.js Buffer for base64

// --- Relying Party details - TODO: Move to environment variables --- 
const rpName = 'Ananas';
// Domain name (ensure it matches your deployment)
// For local dev with platformProxy, it might be the localhost address or the proxied one.
// For production, it's your actual domain.
const rpID = process.env.NODE_ENV === 'development' ? 'localhost' : 'ananas-8ek.pages.dev'; // Example - Adjust needed!
const origin = process.env.NODE_ENV === 'development' ? `http://${rpID}:5173` : `https://${rpID}`; // Example - Adjust needed!
// --- End of RP details ---

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
    // TODO: Potentially check if user is already logged in? Or handle username input?
    // For now, we assume this is for a new user registration initiated by the client.

    // Placeholder for user details - in a real app, you might get username from request body
    // and check if it exists before generating options. Use a more robust username generation if needed.
    const userName = `user_${Date.now()}`.slice(0, 64); // Ensure username is within common limits
    const userIdString = crypto.randomUUID(); // Generate a temporary user ID as string
    // Convert the userId string to Uint8Array (required by simplewebauthn)
    const userIdBuffer = Buffer.from(userIdString, 'utf-8'); 

    const options: PublicKeyCredentialCreationOptionsJSON = await generateRegistrationOptions({
        rpName,
        rpID,
        userID: userIdBuffer,
        userName: userName,
        // Don't specifyresidentKey or requireResidentKey unless you know you need them
        attestationType: 'none', // 'none' means we don't need attestation signatures
        excludeCredentials: [], // TODO: Add existing credentials for this user if re-registering a device
        authenticatorSelection: {
            // Defaults usually suffice: userVerification 'preferred', residentKey 'preferred'
        },
    });

    // Store challenge, userId (string), and userName together
    const challengePayload = JSON.stringify({
        challenge: options.challenge,
        userId: userIdString,
        userName: userName
    });
    cookies.set('registrationChallengePayload', challengePayload, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        maxAge: 60 * 5, // 5 minutes validity
        sameSite: 'lax',
    });

    // Important: The challenge should NOT be sent back to the client in the main response body
    // after storing it securely (like in the cookie).
    // SimpleWebAuthn's generateRegistrationOptions includes it, so we return the options
    // object as is, and the client will use it, but the server relies on the cookie for verification.

    return json(options);
};
