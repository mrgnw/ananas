import { json } from '@sveltejs/kit';
import { getUser } from '$lib/server/webauthn';
import { dev } from '$app/environment';

// Only available in development mode
export async function POST({ request }) {
  if (!dev) {
    return new Response('This endpoint is only available in development', { status: 403 });
  }

  try {
    const { username } = await request.json();
    if (!username) {
      return json({ error: 'Username is required' }, { status: 400 });
    }

    const user = getUser(username);
    if (!user) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    // Keep track of how many credentials were removed
    const credentialCount = user.credentials.length;
    
    // Remove any credentials with empty public keys or other issues
    user.credentials = user.credentials.filter(cred => 
      cred.credentialPublicKey && 
      Buffer.isBuffer(cred.credentialPublicKey) &&
      cred.credentialPublicKey.length > 0
    );

    const removedCount = credentialCount - user.credentials.length;

    return json({
      success: true,
      message: `Cleaned up user credentials. Removed ${removedCount} problematic credentials.`,
      remainingCredentials: user.credentials.length
    });
  } catch (error) {
    console.error('Error resetting credentials:', error);
    return json({ error: error.message }, { status: 500 });
  }
}
