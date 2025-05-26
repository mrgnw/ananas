import { json } from '@sveltejs/kit';
import { initDB, isD1Available } from '$lib/server/db';
import { mergeLocalTranslations } from '$lib/server/translation-history';

/**
 * POST handler to merge local translations with database
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request, platform, locals }) {
  // Check for authenticated user
  if (!locals.user || !locals.user.id) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check database availability
  if (!isD1Available(platform)) {
    return json({ error: 'Database not available' }, { status: 503 });
  }

  try {
    const { translations } = await request.json();
    
    if (!translations || !Array.isArray(translations)) {
      return json({ error: 'Invalid translation data' }, { status: 400 });
    }

    const db = initDB(platform?.env?.DB || process.env.DB);
    const success = await mergeLocalTranslations(db, locals.user.id, translations);
    
    if (!success) {
      return json({ error: 'Failed to merge translations' }, { status: 500 });
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Error merging translations:', error);
    return json({ error: 'Failed to merge translations' }, { status: 500 });
  }
}