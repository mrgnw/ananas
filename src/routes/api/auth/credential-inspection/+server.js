import { json } from '@sveltejs/kit';
import { getAllUsers } from '$lib/server/webauthn';
import { dev } from '$app/environment';

// Debug endpoint to inspect credentials - only available in development
export async function GET({ url }) {
  if (!dev) {
    return new Response('Debug endpoints not available in production', { status: 403 });
  }

  const username = url.searchParams.get('username');
  const users = getAllUsers();
  
  let result;
  if (username) {
    // Get specific user's credentials
    const user = users.find(u => u.username === username);
    if (!user) {
      return json({ error: 'User not found' }, { status: 404 });
    }
    
    result = inspectCredentials(user);
  } else {
    // Get all users' credentials
    result = users.map(user => inspectCredentials(user));
  }

  return json(result);
}

function inspectCredentials(user) {
  return {
    username: user.username,
    id: user.id,
    credentialCount: user.credentials.length,
    credentials: user.credentials.map(cred => ({
      id: Buffer.from(cred.credentialID).toString('base64url'),
      hasPublicKey: !!cred.credentialPublicKey,
      publicKeyLength: cred.credentialPublicKey?.length || 0,
      publicKeyFirstBytes: cred.credentialPublicKey ? 
        cred.credentialPublicKey.slice(0, 10).toString('hex') : 'none',
      publicKeyType: typeof cred.credentialPublicKey,
      isPublicKeyBuffer: Buffer.isBuffer(cred.credentialPublicKey),
      counter: cred.counter,
      transports: cred.transports || []
    }))
  };
}
