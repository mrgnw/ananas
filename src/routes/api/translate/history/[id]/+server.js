import { json } from '@sveltejs/kit';
import { initDB, isD1Available } from '$lib/server/db';
import { deleteTranslation } from '$lib/server/translation-history';

/**
 * DELETE handler to delete a specific translation
 * @type {import('./$types').RequestHandler}
 */
export async function DELETE({ params, platform, locals }) {
  // Check for authenticated user
  if (!locals.user || !locals.user.id) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check database availability
  if (!isD1Available(platform)) {
    return json({ error: 'Database not available' }, { status: 503 });
  }

  const { id } = params;
  
  if (!id) {
    return json({ error: 'Translation ID is required' }, { status: 400 });
  }

  try {
    const db = initDB(platform?.env?.DB || process.env.DB);
    await deleteTranslation(db, id, locals.user.id);
    
    return json({ success: true });
  } catch (error) {
    console.error('Error deleting translation:', error);
    return json({ error: 'Failed to delete translation' }, { status: 500 });
  }
}