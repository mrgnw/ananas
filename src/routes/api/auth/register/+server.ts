import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/types';
import { Buffer } from 'buffer'; // Node.js Buffer for base64
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '$lib/server/schema';
import { eq } from 'drizzle-orm';

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

    const db = drizzle(platform.env.DB, { schema });

    const { email } = await request.json() as { email: string };

    if (!email) {
        return json({ error: 'Email is required.' }, { status: 400 });
    }

    // Check if user already exists
    try {
        const existingUser = await db.select().from(schema.users).where(eq(schema.users.email, email));
        if (existingUser.length > 0) {
            return json({ error: 'User already exists.' }, { status: 400 });
        }
    } catch (dbError: any) {
        throw error(500, `Database error checking user existence: ${dbError?.message ?? 'Unknown error'}`);
    }

    const userId = crypto.randomUUID(); // Generate a new UUID for the user

    const options: PublicKeyCredentialCreationOptionsJSON = await generateRegistrationOptions({
        rpName,
        rpID,
        userID: Buffer.from(userId, 'utf-8'),
        userName: email, // Use email as the WebAuthn username
        userDisplayName: email, // Use email for display name as well
        attestationType: 'none', // 'none' means we don't need attestation signatures
        excludeCredentials: [], // TODO: Add existing credentials for this user if re-registering a device
        authenticatorSelection: {
            // Defaults usually suffice: userVerification 'preferred', residentKey 'preferred'
        },
    });

    // Store challenge, userId (string), and email together
    const challengePayload = JSON.stringify({
        challenge: options.challenge,
        userId: userId,
        email: email
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
