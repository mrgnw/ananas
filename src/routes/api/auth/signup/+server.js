import { json } from '@sveltejs/kit';
import { initDB } from '$lib/server/db';
import { createUser } from '$lib/server/auth';

/**
 * User signup endpoint
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request, platform }) {
  try {
    const { email, password, username } = await request.json();
    
    // Validate inputs
    if (!email || !password) {
      return json({ success: false, message: 'Email and password are required' }, { status: 400 });
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json({ success: false, message: 'Invalid email format' }, { status: 400 });
    }
    
    // Password strength validation
    if (password.length < 8) {
      return json(
        { success: false, message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    // Initialize DB connection
    const db = initDB(platform.env.DB);
    
    try {
      // Create the user
      const user = await createUser(db, { email, password, username });
      
      return json({ 
        success: true, 
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          username: user.username
        }
      });
    } catch (dbError) {
      console.error('Database error during signup:', dbError);
      
      // Check for duplicate email
      if (dbError.message && dbError.message.includes('UNIQUE constraint failed: users.email')) {
        return json(
          { success: false, message: 'Email already in use' },
          { status: 409 }
        );
      }
      
      return json(
        { success: false, message: 'Failed to create user' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in signup endpoint:', error);
    return json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}