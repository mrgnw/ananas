import { handleAuthTest } from './lib/handlers/auth-test';

/**
 * Main entry point for Wrangler 
 * Routes requests to the appropriate handler
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    console.log(`[Wrangler] Request to: ${path}`);
    
    // Auth test endpoint
    if (path === '/api/auth/test' && request.method === 'GET') {
      return handleAuthTest(env);
    }
    
    // If no specific handler matches, return a 404
    return new Response(JSON.stringify({
      error: 'Not found',
      message: `No handler for ${path}`,
      availableRoutes: ['/api/auth/test']
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};