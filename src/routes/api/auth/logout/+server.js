import { json } from '@sveltejs/kit';
import { initDB } from '$lib/server/db';
import { destroySession } from '$lib/server/auth';

/**
 * User logout endpoint
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ platform, cookies }) {
  try {
    // Get session ID from cookie
    const sessionId = cookies.get('session_id');
    
    if (!sessionId) {
      return json({ success: true, message: 'Already logged out' });
    }
    
    // Initialize DB connection
    const db = initDB(platform.env.DB);
    
    // Destroy the session
    await destroySession(db, sessionId);
    
    // Clear the session cookie
    cookies.delete('session_id', { path: '/' });
    
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