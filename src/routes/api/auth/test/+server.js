import { json } from '@sveltejs/kit';
import { initDB } from '$lib/server/db';
import { dev } from '$app/environment';
import { proxyToWrangler, shouldUseWranglerProxy } from '$lib/server/dev-proxy';

/**
 * Test endpoint to verify database connection
 * @type {import('./$types').RequestHandler}
 */
export async function GET({ platform, url }) {
  try {
    // Check if we should use the Wrangler proxy in development
    if (shouldUseWranglerProxy(platform)) {
      try {
        // Proxy the request to the Wrangler dev server
        const response = await proxyToWrangler('api/auth/test');
        
        if (response.ok) {
          const result = await response.json();
          return json(result);
        } else {
          return json({ 
            success: false, 
            message: 'Error from Wrangler proxy',
            status: response.status,
            statusText: response.statusText
          }, { status: response.status });
        }
      } catch (proxyError) {
        return json({ 
          success: false, 
          message: 'Failed to connect to Wrangler dev server. Make sure wrangler dev is running on port 8787.',
          error: proxyError.message
        }, { status: 502 });
      }
    }
    
    // Direct DB access (when platform.env.DB is available)
    if (!platform?.env?.DB) {
      return json({ 
        success: false, 
        message: 'Database binding not found',
        environmentKeys: platform?.env ? Object.keys(platform.env) : []
      }, { status: 500 });
    }
    
    // Initialize DB connection
    const db = initDB(platform.env.DB);
    
    // Execute a simple query
    const tables = await db.run(`SELECT name FROM sqlite_master WHERE type='table';`);
    
    return json({ 
      success: true, 
      message: 'Database connection successful',
      tables: tables.results || [],
      mode: 'direct'
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return json({ 
      success: false, 
      message: 'Database connection failed',
      error: error.message,
      stack: dev ? error.stack : undefined
    }, { status: 500 });
  }
}