import { json } from '@sveltejs/kit';
import { initDB } from '$lib/server/db';
import { beginPasskeyRegistration } from '$lib/server/passkey-auth';
import { getRpId } from '$lib/utils/cloudflare';

export async function POST({ request, platform, url }) {
  try {
    const { email, username } = await request.json();
    
    if (!email) {
      return json({ success: false, message: 'Email is required' }, { status: 400 });
    }
    
    // Get the Relying Party ID for WebAuthn
    const rpId = getRpId(platform, url);
    
    // Log origin and RPID for debugging
    const origin = url.origin;
    const hostname = url.hostname;
    console.log('[WEBAUTHN DEBUG] Client request information:');
    console.log('- Request origin:', origin);
    console.log('- Request hostname:', hostname);
    console.log('- Using RPID:', rpId);
    console.log('- Origin matches RPID as suffix:', hostname.endsWith(rpId));
    
    const db = initDB(platform?.env?.DB || process.env.DB);
    
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