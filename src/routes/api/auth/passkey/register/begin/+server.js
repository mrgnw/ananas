import { json } from '@sveltejs/kit';
import { initDB } from '$lib/server/db';
import { beginPasskeyRegistration } from '$lib/server/passkey-auth';

export async function POST({ request, platform }) {
  try {
    const { email, username } = await request.json();
    
    if (!email) {
      return json({ success: false, message: 'Email is required' }, { status: 400 });
    }
    
    // Determine RP_ID with proper fallback chain
    const projectDomain = 'ananas-8ek.pages.dev';
    const rpId = platform?.env?.WEBAUTHN_RP_ID || 
                 process.env.WEBAUTHN_RP_ID || 
                 (platform?.env?.CF_PAGES_BRANCH && platform.env.CF_PAGES_BRANCH !== 'main' ? `${platform.env.CF_PAGES_BRANCH}.${projectDomain}` : projectDomain) ||
                 'localhost';
    
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