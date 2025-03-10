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
    
    // Support both direct credential or passkey_info format
    const body = await request.json();
    const credential = body.passkey_info || body;
    
    // Log more details about received credential before verification
    console.log('Received registration credential for verification:', {
      id: credential.id,
      type: credential.type,
      hasClientDataJSON: !!credential.response?.clientDataJSON,
      hasAttestationObject: !!credential.response?.attestationObject,
      responseKeys: credential.response ? Object.keys(credential.response) : []
    });
    
    // Verify registration response
    let verification;
    try {
      verification = await verifyRegResponse(username, credential);
    } catch (error) {
      console.error('Registration verification error:', error);
      if (error.name === 'InvalidStateError') {
        return json({ 
          verified: false, 
          error: 'This passkey appears to be registered already' 
        }, { status: 400 });
      } else if (error.message === 'Invalid credential public key received from authenticator') {
        return json({ 
          verified: false, 
          error: 'Registration failed: Could not obtain valid credential from your device. Please try again or use a different device.' 
        }, { status: 400 });
      }
      throw error;
    }
    
    // Clear the challenge after use
    removeSessionData(sessionId, 'challenge');
    
    if (verification.verified) {
      // Set authenticated session immediately after successful registration
      const user = verification.registrationInfo?.userHandle || username;
      
      // Create a user session
      cookies.set('user_session', user, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 // 1 day
      });
      
      return json({ 
        verified: true, 
        username 
      });
    } else {
      return json({ verified: false, error: 'Verification failed' }, { status: 400 });
    }
  } catch (error) {
    console.error(error);
    return json({ verified: false, error: error.message }, { status: 500 });
  }
}
