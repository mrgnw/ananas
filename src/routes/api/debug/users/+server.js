import { json } from '@sveltejs/kit';
import { getAllUsers } from '$lib/server/webauthn';
import { dev } from '$app/environment';

// Only available in development mode for security reasons
export async function GET() {
  if (!dev) {
    return new Response('Not available in production', { status: 403 });
  }
  
  const users = getAllUsers().map(user => {
    // Convert binary data to base64 strings for display
    const credentials = user.credentials.map(cred => {
      return {
        ...cred,
        credentialIDBase64: Buffer.from(cred.credentialID).toString('base64')
      };
    });
    
    return {
      ...user,
      credentials
    };
  });
  
  return json(users);
}
