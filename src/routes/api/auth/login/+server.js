import { json } from '@sveltejs/kit';
import { initDB } from '$lib/server/db';
import { authenticateUser } from '$lib/server/auth';

/**
 * User login endpoint
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request, platform, cookies }) {
  try {
    const { email, password } = await request.json();
    
    // Validate inputs
    if (!email || !password) {
      return json({ success: false, message: 'Email and password are required' }, { status: 400 });
    }
    
    // Initialize DB connection
    const db = initDB(platform.env.DB);
    
    // Authenticate user
    const session = await authenticateUser(db, { email, password });
    
    if (!session) {
      return json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Set session cookie
    cookies.set('session_id', session.sessionId, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 // 30 days in seconds
    });
    
    // Return user data along with success message
    return json({ 
      success: true, 
      message: 'Login successful',
      user: {
        id: session.user.id,
        email: session.user.email,
        username: session.user.username
      }
    });
  } catch (error) {
    console.error('Error in login endpoint:', error);
    return json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}