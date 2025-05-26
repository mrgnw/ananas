import { json } from '@sveltejs/kit';
import { initDB } from '$lib/server/db';
import { beginPasskeyAuthentication } from '$lib/server/passkey-auth';

export async function POST({ request, platform }) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return json({ success: false, message: 'Email is required' }, { status: 400 });
    }
    
    const rpId = platform?.env?.WEBAUTHN_RP_ID || process.env.WEBAUTHN_RP_ID || 'localhost';
    
    const db = initDB(platform?.env?.DB || process.env.DB);
    
    const authenticationData = await beginPasskeyAuthentication(db, { email, rpId });
    
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