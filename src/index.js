import { handleAuthTest } from './lib/handlers/auth-test';
import { initDB } from './lib/server/db';
import { createUser } from './lib/server/auth';

/**
 * Main entry point for Wrangler 
 * Routes requests to the appropriate handler
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    console.log(`[Wrangler] ${method} request to: ${path}`);
    
    // Auth test endpoint
    if (path === '/api/auth/test' && method === 'GET') {
      return handleAuthTest(env);
    }
    
    // Signup endpoint
    if (path === '/api/auth/signup' && method === 'POST') {
      try {
        // Parse request body
        const { email, password, username } = await request.json();
        
        // Validate inputs
        if (!email || !password) {
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'Email and password are required' 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'Invalid email format' 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Password strength validation
        if (password.length < 8) {
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'Password must be at least 8 characters long' 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Initialize DB connection
        const db = initDB(env.DB);
        
        try {
          // Create the user
          const user = await createUser(db, { email, password, username });
          
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'User created successfully',
            user: {
              id: user.id,
              email: user.email,
              username: user.username
            }
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (dbError) {
          console.error('Database error during signup:', dbError);
          
          // Check for duplicate email
          if (dbError.message && dbError.message.includes('UNIQUE constraint failed: users.email')) {
            return new Response(JSON.stringify({ 
              success: false, 
              message: 'Email already in use' 
            }), {
              status: 409,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'Failed to create user' 
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (error) {
        console.error('Error in signup endpoint:', error);
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Internal server error',
          error: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // If no specific handler matches, return a 404
    return new Response(JSON.stringify({
      error: 'Not found',
      message: `No handler for ${method} ${path}`,
      availableRoutes: [
        'GET /api/auth/test',
        'POST /api/auth/signup'
      ]
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};