import { initDB } from '../server/db';

/**
 * Wrangler handler for database test
 * This is used by the Wrangler development server
 */
export async function handleAuthTest(env) {
  try {
    if (!env.DB) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Database binding not found in Wrangler environment'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Initialize DB connection
    const db = initDB(env.DB);
    
    // Execute a simple query
    const tables = await db.run(`SELECT name FROM sqlite_master WHERE type='table';`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Database connection successful (Wrangler handler)',
      tables: tables.results || [],
      mode: 'wrangler'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Database error in Wrangler handler:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Database connection failed in Wrangler handler',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}