import { json } from '@sveltejs/kit';
import { initDB } from '$lib/server/db';
import { beginPasskeyAuthentication } from '$lib/server/passkey-auth';

/**
 * Start passkey authentication process
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request, platform }) {
  try {
    const { email } = await request.json();
    
    // Validate inputs
    if (!email) {
      return json({ success: false, message: 'Email is required' }, { status: 400 });
    }
    
    // Initialize DB connection
    const db = initDB(platform.env.DB);
    
    // Start passkey authentication
    const authenticationData = await beginPasskeyAuthentication(db, { email });
    
    return json({ 
      success: true, 
      ...authenticationData
    });
  } catch (error) {
    console.error('Error starting passkey authentication:', error);
    
    if (error.message === 'User not found' || error.message === 'No passkeys found for this user') {
      return json(
        { success: false, message: 'No passkeys found for this email address' },
        { status: 404 }
      );
    }
    
    return json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}