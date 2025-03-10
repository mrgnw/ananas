import { json } from '@sveltejs/kit';
import { verifyAuthResponse } from '$lib/server/webauthn';
import { getSessionData, removeSessionData } from '$lib/server/auth';

export async function POST({ request, cookies }) {
  try {
    const sessionId = cookies.get('auth_session');
    if (!sessionId) {
      return json({ error: 'No session found' }, { status: 400 });
    }
    
    // Support both direct credential or passkey_info format
    const body = await request.json();
    const credential = body.passkey_info || body;
    const username = body.username || getSessionData(sessionId, 'username');
    
    console.log('Login verification request:', {
      username: username || 'passkey flow (no username)',
      credentialId: credential.id
    });
    
    // Verify authentication response
    try {
      const result = await verifyAuthResponse(credential, username);
      
      // Clear the challenge after use
      removeSessionData(sessionId, 'challenge');
      
      if (result.verification.verified && result.user) {
        // Set authenticated session
        cookies.set('user_session', result.user.id, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax', // Changed to lax for better compatibility
          maxAge: 60 * 60 * 24 // 1 day
        });
        
        return json({ 
          verified: true, 
          username: result.user.username
        });
      } else {
        return json({ 
          verified: false, 
          error: result.user ? 'Verification failed' : 'User not found' 
        }, { status: 400 });
      }
    } catch (error) {
      console.error('Login verification error:', error);
      return json({ 
        verified: false, 
        error: error.message || 'Authentication failed'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Login verification error:', error);
    return json({ verified: false, error: error.message }, { status: 500 });
  }
}
