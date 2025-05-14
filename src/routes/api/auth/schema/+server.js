import { json } from '@sveltejs/kit';
import { proxyToWrangler, shouldUseWranglerProxy } from '$lib/server/dev-proxy';
import { dev } from '$app/environment';

/**
 * Schema check endpoint to verify database tables
 * @type {import('./$types').RequestHandler}
 */
export async function GET({ platform }) {
  try {
    // Check if we should use the Wrangler proxy
    if (shouldUseWranglerProxy(platform)) {
      try {
        // Proxy the request to the Wrangler dev server
        const response = await proxyToWrangler('api/auth/schema');
        
        if (response.ok) {
          const result = await response.json();
          return json(result);
        } else {
          return json({ 
            success: false, 
            message: 'Error from Wrangler proxy',
            status: response.status
          }, { status: response.status });
        }
      } catch (proxyError) {
        return json({ 
          success: false, 
          message: 'Failed to connect to Wrangler dev server',
          error: dev ? proxyError.message : 'Proxy error'
        }, { status: 502 });
      }
    }
    
    // Direct implementation omitted since it's only used via proxy
    return json({
      success: false,
      message: 'This endpoint is only available through Wrangler proxy in development'
    }, { status: 501 });
  } catch (error) {
    console.error('Error in schema endpoint:', error);
    return json({ 
      success: false, 
      message: 'Internal server error',
      error: dev ? error.message : undefined
    }, { status: 500 });
  }
}