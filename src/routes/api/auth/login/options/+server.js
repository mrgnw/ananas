import { json } from '@sveltejs/kit';
import { generateAuthOptions } from '$lib/server/webauthn';
import { createSession, setSessionData } from '$lib/server/auth';

export async function POST({ request, cookies }) {
  try {
    // For passkey auth, username can be null
    const body = await request.json();
    const username = body.username || null;
    
    // Generate authentication options
    const options = await generateAuthOptions(username);
    
    // Create and set session cookie to track the challenge
    const sessionId = createSession();
    setSessionData(sessionId, 'challenge', options.challenge);
    
    if (username) {
      setSessionData(sessionId, 'username', username);
    }
    
    cookies.set('auth_session', sessionId, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 300 // 5 minutes
    });
    
    return json({ options });
  } catch (error) {
    console.error(error);
    return json({ error: error.message }, { status: 500 });
  }
}
