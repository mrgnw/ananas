import { json } from '@sveltejs/kit';
import { verifyRegResponse } from '$lib/server/webauthn';
import { getSessionData, removeSessionData } from '$lib/server/auth';

export async function POST({ request, cookies }) {
  try {
    const sessionId = cookies.get('auth_session');
    if (!sessionId) {
      return json({ error: 'No session found' }, { status: 400 });
    }
    
    const username = getSessionData(sessionId, 'username');
    if (!username) {
      return json({ error: 'Session data is missing username' }, { status: 400 });
    }
    
    const credential = await request.json();
    
    // Verify registration response
    const verification = await verifyRegResponse(username, credential);
    
    // Clear the challenge after use
    removeSessionData(sessionId, 'challenge');
    
    if (verification.verified) {
      return json({ verified: true, username });
    } else {
      return json({ verified: false, error: 'Verification failed' }, { status: 400 });
    }
  } catch (error) {
    console.error(error);
    return json({ verified: false, error: error.message }, { status: 500 });
  }
}
