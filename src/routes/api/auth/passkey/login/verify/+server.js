import { json } from '@sveltejs/kit';
import { initDB } from '$lib/server/db';
import { completePasskeyAuthentication } from '$lib/server/passkey-auth';
import { generateSessionToken, hashToken } from '$lib/server/auth';
import { sessions } from '$lib/server/schema/users';

/**
 * Complete passkey authentication process
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request, platform, cookies }) {
  try {
    const { challengeId, credential } = await request.json();
    
    // Validate inputs
    if (!challengeId || !credential) {
      return json({ success: false, message: 'Challenge ID and credential are required' }, { status: 400 });
    }
    
    // Initialize DB connection (fallback for development)
    const db = initDB(platform?.env?.DB || process.env.DB);
    
    // Complete passkey authentication
    const user = await completePasskeyAuthentication(db, { challengeId, credential });
    
    // Create session for the authenticated user
    const sessionToken = generateSessionToken();
    const now = Date.now();
    const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days
    const sessionId = await hashToken(sessionToken);
    
    await db.insert(sessions).values({
      id: sessionId,
      user_id: user.id,
      expires_at: expiresAt,
      created_at: now
    });
    
    // Set session cookie
    cookies.set('session_token', sessionToken, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 // 30 days in seconds
    });
    
    return json({ 
      success: true, 
      message: 'Authentication successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Error completing passkey authentication:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('expired') || error.message.includes('not found')) {
      return json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }
    
    return json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}