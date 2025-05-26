import { json } from '@sveltejs/kit';
import { initDB } from '$lib/server/db';
import { createUser } from '$lib/server/auth';
import { proxyToWrangler, shouldUseWranglerProxy } from '$lib/server/dev-proxy';
import { dev } from '$app/environment';

/**
 * User signup endpoint
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request, platform }) {
  try {
    // Check if we should use the Wrangler proxy
    if (shouldUseWranglerProxy(platform)) {
      try {
        // Proxy the request to the Wrangler dev server with the same body
        const clonedRequest = request.clone();
        const requestBody = await clonedRequest.json();
        
        const response = await proxyToWrangler('api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
        
        const result = await response.json();
        return json(result, { status: response.status });
      } catch (proxyError) {
        console.error('Error proxying to Wrangler:', proxyError);
        return json({ 
          success: false, 
          message: 'Failed to connect to Wrangler dev server. Make sure wrangler dev is running on port 8787.',
          error: dev ? proxyError.message : 'Proxy error'
        }, { status: 502 });
      }
    }
    
    // Direct implementation when platform.env.DB is available
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
    
    if (!platform?.env?.DB) {
      return json({ 
        success: false, 
        message: 'Database connection not available', 
        dev: dev
      }, { status: 500 });
    }
    
    // Initialize DB connection
    const db = initDB(platform?.env?.DB || process.env.DB);
    
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
        { success: false, message: 'Failed to create user', error: dev ? dbError.message : undefined },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in signup endpoint:', error);
    return json(
      { success: false, message: 'Internal server error', error: dev ? error.message : undefined },
      { status: 500 }
    );
  }
}