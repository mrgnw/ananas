import { initDB } from '$lib/server/db';
import { getUserFromSession } from '$lib/server/auth';

/**
 * Handle authentication for all requests
 * @type {import('@sveltejs/kit').Handle}
 */
export async function handle({ event, resolve }) {
  // Get session token from cookie
  const sessionToken = event.cookies.get('session_token');
  const legacySessionId = event.cookies.get('session_id'); // For backward compatibility
  
  if (sessionToken || legacySessionId) {
    try {
      // Initialize DB connection
      const db = initDB(event.platform.env.DB);
      
      let user = null;
      
      // Try the new token-based authentication first
      if (sessionToken) {
        user = await getUserFromSession(db, sessionToken, true);
        
        if (!user && legacySessionId) {
          // If new method fails but we have a legacy ID, try that
          user = await getUserFromSession(db, legacySessionId);
        }
      } else if (legacySessionId) {
        // Only legacy ID is available
        user = await getUserFromSession(db, legacySessionId);
      }
      
      if (user) {
        // Attach user to event.locals
        event.locals.user = user;
      } else {
        // Session is invalid or expired, clear the cookies
        if (sessionToken) {
          event.cookies.delete('session_token', { path: '/' });
        }
        if (legacySessionId) {
          event.cookies.delete('session_id', { path: '/' });
        }
      }
    } catch (error) {
      console.error('[hooks] Authentication error:', error);
    }
  }
  
  // Continue with the request
  return resolve(event);
}