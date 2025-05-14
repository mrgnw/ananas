import { initDB } from '$lib/server/db';
import { getUserFromSession } from '$lib/server/auth';

/**
 * Handle authentication for all requests
 * @type {import('@sveltejs/kit').Handle}
 */
export async function handle({ event, resolve }) {
  // Get session ID from cookie
  const sessionId = event.cookies.get('session_id');
  
  if (sessionId) {
    // Initialize DB connection
    const db = initDB(event.platform.env.DB);
    
    // Get user from session
    const user = await getUserFromSession(db, sessionId);
    
    if (user) {
      // Attach user to event.locals
      event.locals.user = user;
    } else {
      // Session is invalid or expired, clear the cookie
      event.cookies.delete('session_id', { path: '/' });
    }
  }
  
  // Continue with the request
  return resolve(event);
}