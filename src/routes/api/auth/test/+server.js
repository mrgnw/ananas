import { json } from '@sveltejs/kit';
import { initDB } from '$lib/server/db';

/**
 * Test endpoint to verify database connection
 * @type {import('./$types').RequestHandler}
 */
export async function GET({ platform }) {
  try {
    // Check if DB binding exists
    if (!platform.env.DB) {
      return json({ 
        success: false, 
        message: 'Database binding not found',
        environmentKeys: Object.keys(platform.env)
      }, { status: 500 });
    }
    
    // Initialize DB connection
    const db = initDB(platform.env.DB);
    
    // Execute a simple query
    const tables = await db.run(`SELECT name FROM sqlite_master WHERE type='table';`);
    
    return json({ 
      success: true, 
      message: 'Database connection successful',
      tables: tables.results || []
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return json({ 
      success: false, 
      message: 'Database connection failed',
      error: error.message
    }, { status: 500 });
  }
}