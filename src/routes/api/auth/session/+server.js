import { json } from '@sveltejs/kit';
import { getAllUsers } from '$lib/server/webauthn';

// Check if user is logged in
export async function GET({ cookies }) {
  const sessionId = cookies.get('user_session');
  if (!sessionId) {
    return json({ authenticated: false });
  }
  
  // In production, you'd query your database with the session ID
  // For this demo, we'll just check if the ID exists in any user
  const users = getAllUsers();
  const user = users.find(u => u.id === sessionId);
  
  if (user) {
    return json({
      authenticated: true,
      username: user.username
    });
  }
  
  return json({ authenticated: false });
}

// Logout endpoint
export async function DELETE({ cookies }) {
  cookies.delete('user_session', { path: '/' });
  return json({ success: true });
}
