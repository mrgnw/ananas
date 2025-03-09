import { json } from '@sveltejs/kit';
import { verifyAuthResponse, getUser } from '$lib/server/webauthn';
import { getSessionData, removeSessionData } from '$lib/server/auth';

export async function POST({ request, cookies }) {
  try {
    const sessionId = cookies.get('auth_session');
    if (!sessionId) {
      return json({ error: 'No session found' }, { status: 400 });
    }
    
    const username = getSessionData(sessionId, 'username');
    const credential = await request.json();
    
    // Verify authentication response
    const { verification, user } = await verifyAuthResponse(credential, username);
    
    // Clear the challenge after use
    removeSessionData(sessionId, 'challenge');
    
    if (verification.verified && user) {
      // Set authenticated session
      cookies.set('user_session', user.id, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 // 1 day
      });
      
      return json({ 
        verified: true, 
        username: user.username
      });
    } else {
      return json({ 
        verified: false, 
        error: user ? 'Verification failed' : 'User not found' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error(error);
    return json({ verified: false, error: error.message }, { status: 500 });
  }
}
