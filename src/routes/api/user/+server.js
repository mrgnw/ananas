import { json } from '@sveltejs/kit';
import { getAllUsers } from '$lib/server/webauthn';

export async function GET({ cookies }) {
  const sessionId = cookies.get('user_session');
  if (!sessionId) {
    return json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  // Find the user with the matching session ID
  const users = getAllUsers();
  const user = users.find(u => u.id === sessionId);
  
  if (!user) {
    return json({ error: 'User not found' }, { status: 404 });
  }
  
  // Return user data with sanitized credential information
  return json({
    username: user.username,
    id: user.id,
    credentials: user.credentials.map(cred => ({
      id: cred.credentialID,
      transports: cred.transports,
      // Don't expose the public key or other sensitive data
      registeredAt: new Date().toISOString() // In a real app, you'd store and return the actual registration date
    }))
  });
}
