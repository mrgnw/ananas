import { json } from '@sveltejs/kit';
import { generateRegOptions } from '$lib/server/webauthn';
import { createSession, setSessionData } from '$lib/server/auth';

export async function POST({ request, cookies }) {
  try {
    const { username } = await request.json();
    
    if (!username || typeof username !== 'string') {
      return json({ error: 'Invalid username' }, { status: 400 });
    }
    
    // Generate registration options
    const options = await generateRegOptions(username);
    
    // Create and set session cookie to track the challenge
    const sessionId = createSession();
    setSessionData(sessionId, 'challenge', options.challenge);
    setSessionData(sessionId, 'username', username);
    
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
