import { json } from '@sveltejs/kit';
import { initDB } from '$lib/server/db';
import { destroySession } from '$lib/server/auth';

/**
 * User logout endpoint
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ platform, cookies }) {
  try {
    // Get session token and legacy session ID from cookies
    const sessionToken = cookies.get('session_token');
    const legacySessionId = cookies.get('session_id');
    
    if (!sessionToken && !legacySessionId) {
      return json({ success: true, message: 'Already logged out' });
    }
    
    // Initialize DB connection
    const db = initDB(platform.env.DB);
    
    // Destroy the sessions
    if (sessionToken) {
      await destroySession(db, sessionToken, true);
      cookies.delete('session_token', { path: '/' });
    }
    
    if (legacySessionId) {
      await destroySession(db, legacySessionId);
      cookies.delete('session_id', { path: '/' });
    }
    
    return json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Error in logout endpoint:', error);
    return json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}