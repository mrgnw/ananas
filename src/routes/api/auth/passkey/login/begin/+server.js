import { json } from '@sveltejs/kit';
import { initDB } from '$lib/server/db';
import { beginPasskeyAuthentication } from '$lib/server/passkey-auth';
import { getRpId } from '$lib/utils/cloudflare';

export async function POST({ request, platform, url }) {
  try {
    const { email } = await request.json();
    
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