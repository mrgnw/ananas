import { json } from '@sveltejs/kit';
import { initDB } from '$lib/server/db';
import { beginPasskeyRegistration } from '$lib/server/passkey-auth';

export async function POST({ request, platform }) {
  try {
    const { email, username } = await request.json();
    
    if (!email) {
      return json({ success: false, message: 'Email is required' }, { status: 400 });
    }
    
    // Dynamically determine RP_ID based on Cloudflare deployment
    let rpId;
    if (platform?.env?.CF_PAGES_URL) {
      // Extract domain from Cloudflare Pages URL
      const url = new URL(platform.env.CF_PAGES_URL);
      rpId = url.hostname; // e.g., 'clean-sonnet4.ananas-8ek.pages.dev'
    } else {
      // Fallback to environment variable or localhost for local dev
      rpId = platform?.env?.WEBAUTHN_RP_ID || process.env.WEBAUTHN_RP_ID || 'localhost';
    }
    
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