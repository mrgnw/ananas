import { db } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { verifyAuthenticationResponse, type VerifyAuthenticationResponseOpts } from '@simplewebauthn/server';
import type {
	AuthenticationResponseJSON,
	VerifiedAuthenticationResponse
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { setSession } from '$lib/server/session'; // Import session management
import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { dev } from '$app/environment'; // Import dev for secure cookie flag
import { drizzle } from 'drizzle-orm/d1'; // Import drizzle D1 adapter

// Infer Passkey type
type PasskeySelect = typeof schema.passkeys.$inferSelect;

// Define type for user with passkeys relation
type UserWithPasskeys = typeof schema.users.$inferSelect & {
	passkeys: PasskeySelect[];
};

// --- Relying Party details - TODO: Move to environment variables & ensure consistency ---
// Note: These MUST match the values used in the GET /api/auth/login endpoint
const rpID = process.env.RP_ID;
const origin = process.env.ORIGIN;

// Runtime check for environment variables
if (!rpID || !origin) {
	console.error('Missing RP_ID or ORIGIN environment variables');
	// Throw an error or handle appropriately. Cannot proceed without these.
	// For a real app, you might throw immediately or have a config check at startup.
	throw new Error('Server configuration error: RP_ID or ORIGIN missing.'); 
}

/**
 * Verifies the authentication response received from the client.
 */
export const POST: RequestHandler = async (event) => {
	const { cookies, request, platform } = event;

	if (!platform?.env?.DB) {
		throw error(500, 'Database configuration error');
	}
	const dbInstance = drizzle(platform.env.DB, { schema }); // Pass schema

	const body: AuthenticationResponseJSON = await request.json();

	const expectedChallenge = cookies.get('loginChallenge');
	const userEmail = cookies.get('loginEmail'); // Get email associated with this login attempt

	if (!expectedChallenge) {
		throw error(400, 'Challenge not found. Login timed out?');
	}

	if (!userEmail) {
		throw error(400, 'User email not found for login verification.');
	}

	// Clear the challenge cookie immediately after retrieving it
	cookies.delete('loginChallenge', { path: '/' });

	try {
		// 1. Find the user by email
		const user = await dbInstance.query.users.findFirst({
			where: eq(schema.users.email, userEmail),
			with: { // Type assertion needed here as TS struggles with relation type inference after query
				passkeys: true // Include passkeys to find the one being used
			}
		}) as UserWithPasskeys | undefined; // Explicitly type the result

		if (!user) {
			throw error(404, `User with email ${userEmail} not found.`);
		}

		// 2. Find the specific passkey that was used for authentication
		const credentialID_b64url = body.id;
		const authenticator = user.passkeys.find((pk: PasskeySelect) => pk.id === credentialID_b64url);

		if (!authenticator) {
			throw error(400, `Could not find authenticator with ID ${credentialID_b64url} for user ${userEmail}`);
		}

		// 3. Verify the authentication response
		let verification: VerifiedAuthenticationResponse;
		try {
			const verificationOptions: VerifyAuthenticationResponseOpts = {
				response: body,
				expectedChallenge: expectedChallenge,
				expectedOrigin: origin,
				expectedRPID: rpID,
				authenticator: {
					credentialID: isoBase64URL.toBuffer(authenticator.id), // Use correct helper
					credentialPublicKey: authenticator.publicKey, // Assuming stored as Buffer/Blob
					counter: authenticator.counter,
					// Include transports if your schema stores them and they're needed for verification
					// transports: authenticator.transports?.split(','),
				},
				requireUserVerification: true // Usually recommended
			};
			// Cast to any to bypass persistent TS error; structure seems correct for the library
			verification = await verifyAuthenticationResponse(verificationOptions as any);
		} catch (verificationError: any) {
			console.error('Authentication verification failed:', verificationError);
			throw error(400, `Authentication failed: ${verificationError.message}`);
		}

		const { verified, authenticationInfo } = verification;

		if (!verified || !authenticationInfo) {
			throw error(400, 'Authentication verification failed.');
		}

		// 4. Update the authenticator counter in the database
		try {
			await dbInstance
				.update(schema.passkeys)
				.set({ counter: authenticationInfo.newCounter })
				.where(eq(schema.passkeys.id, authenticator.id));
		} catch (dbError) {
			console.error('Failed to update authenticator counter:', dbError);
			// Decide if this is critical. If the user is verified but counter update fails,
			// they might be locked out next time. Maybe log and proceed, or throw error.
			throw error(500, 'Failed to update authenticator details.');
		}

		// 5. Login successful: Set session state
		await setSession(cookies, user.id);

		// Clear the temporary login email cookie
		cookies.delete('loginEmail', { path: '/' });

		return json({ ok: true, email: user.email }); // Send success response

	} catch (err: any) {
		console.error('Error verifying login:', err);
		const errorMessage = err.message || 'Failed to verify login.';
		const statusCode = err.status || 500;
		// Ensure sensitive challenge/email cookies are cleared on error too
		cookies.delete('loginChallenge', { path: '/' });
		cookies.delete('loginEmail', { path: '/' });
		throw error(statusCode, errorMessage);
	}
};
