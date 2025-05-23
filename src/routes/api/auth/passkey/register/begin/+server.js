import { json } from '@sveltejs/kit';
import { initDB } from '$lib/server/db';
import { beginPasskeyRegistration } from '$lib/server/passkey-auth';

/**
 * Start passkey registration process
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request, platform }) {
  try {
    const { email, username } = await request.json();
    
    // Validate inputs
    if (!email) {
      return json({ success: false, message: 'Email is required' }, { status: 400 });
    }
    
    // Get RPID from environment variable (fallback to localhost for development)
    const rpId = platform?.env?.WEBAUTHN_RP_ID || process.env.WEBAUTHN_RP_ID || 'localhost';
    
    // Initialize DB connection (fallback for development)
    const db = initDB(platform?.env?.DB || process.env.DB);
    
    // Start passkey registration
    const registrationData = await beginPasskeyRegistration(db, { email, username, rpId });
    
    return json({ 
      success: true, 
      ...registrationData
    });
  } catch (error) {
    console.error('Error starting passkey registration:', error);
    
    if (error.message === 'User with this email already exists') {
      return json(
        { success: false, message: error.message },
        { status: 409 }
      );
    }
    
    return json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}