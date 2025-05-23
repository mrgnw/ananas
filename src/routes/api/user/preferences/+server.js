import { json } from '@sveltejs/kit';
import { initDB } from '$lib/server/db';
import { saveUserPreferences } from '$lib/server/user-preferences';

/**
 * API endpoint to save user preferences
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request, locals, platform }) {
  try {
    // Check if user is authenticated
    if (!locals.user) {
      return json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if DB is available
    if (!platform?.env?.DB) {
      return json({ 
        success: false, 
        message: 'Database connection not available'
      }, { status: 500 });
    }
    
    // Get data from request
    const data = await request.json();
    
    // Validate data
    if (!data || (!data.selected_languages && !data.translators)) {
      return json({ 
        success: false, 
        message: 'Invalid data. Must include selected_languages or translators.' 
      }, { status: 400 });
    }
    
    // Initialize DB connection
    const db = initDB(platform?.env?.DB || process.env.DB);
    
    // Save preferences
    const result = await saveUserPreferences(db, locals.user.id, {
      selected_languages: data.selected_languages,
      translators: data.translators
    });
    
    if (!result) {
      return json({ 
        success: false, 
        message: 'Failed to save preferences' 
      }, { status: 500 });
    }
    
    return json({ success: true, message: 'Preferences saved successfully' });
  } catch (error) {
    console.error('Error saving preferences:', error);
    return json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}

/**
 * API endpoint to get user preferences
 * @type {import('./$types').RequestHandler}
 */
export async function GET({ locals, platform }) {
  try {
    // Check if user is authenticated
    if (!locals.user) {
      return json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    // We don't need to fetch preferences here since they're already
    // included in the layout data, but we provide this endpoint for
    // directly requesting the current preferences if needed
    return json({
      success: true,
      message: 'Preferences are available through layout data'
    });
  } catch (error) {
    console.error('Error getting preferences:', error);
    return json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}