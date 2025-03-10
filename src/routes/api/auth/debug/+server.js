import { json } from '@sveltejs/kit';
import { getAllUsers, clearAllData } from '$lib/server/webauthn';
import { dev } from '$app/environment';

// Debug endpoint to see stored user data
export async function GET() {
  if (!dev) {
    return new Response('Debug endpoints not available in production', { status: 403 });
  }
  
  const users = getAllUsers().map(user => {
    return {
      id: user.id,
      username: user.username,
      credentialCount: user.credentials.length,
      credentials: user.credentials.map(cred => ({
        id: Buffer.from(cred.credentialID).toString('base64url'),
        counter: cred.counter,
        transports: cred.transports
      }))
    };
  });
  
  return json(users);
}

// Debug endpoint to reset all data
export async function DELETE() {
  if (!dev) {
    return new Response('Debug endpoints not available in production', { status: 403 });
  }
  
  clearAllData();
  return json({ message: 'All user and challenge data cleared' });
}
