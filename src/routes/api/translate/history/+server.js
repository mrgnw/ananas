import { json } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import { initDB, isD1Available } from '$lib/server/db';
import { 
  saveTranslation, 
  getUserTranslationHistory, 
  clearUserTranslationHistory 
} from '$lib/server/translation-history';

/**
 * GET handler to fetch translation history
 * @type {import('./$types').RequestHandler}
 */
export async function GET({ platform, locals }) {
  // Check for authenticated user
  if (!locals.user || !locals.user.id) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check database availability
  if (!isD1Available(platform)) {
    return json({ error: 'Database not available' }, { status: 503 });
  }

  try {
    const db = initDB(platform.env.DB);
    const translations = await getUserTranslationHistory(db, locals.user.id);
    
    return json({ translations });
  } catch (error) {
    console.error('Error fetching translation history:', error);
    return json({ error: 'Failed to fetch translation history' }, { status: 500 });
  }
}

/**
 * POST handler to save a translation to history
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
    const { translation } = await request.json();
    
    if (!translation || !translation.input || !translation.output) {
      return json({ error: 'Invalid translation data' }, { status: 400 });
    }

    const db = initDB(platform.env.DB);
    const savedTranslation = await saveTranslation(db, translation, locals.user.id);
    
    return json({ success: true, translation: savedTranslation });
  } catch (error) {
    console.error('Error saving translation:', error);
    return json({ error: 'Failed to save translation' }, { status: 500 });
  }
}

/**
 * DELETE handler to clear translation history
 * @type {import('./$types').RequestHandler}
 */
export async function DELETE({ platform, locals }) {
  // Check for authenticated user
  if (!locals.user || !locals.user.id) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check database availability
  if (!isD1Available(platform)) {
    return json({ error: 'Database not available' }, { status: 503 });
  }

  try {
    const db = initDB(platform.env.DB);
    await clearUserTranslationHistory(db, locals.user.id);
    
    return json({ success: true });
  } catch (error) {
    console.error('Error clearing translation history:', error);
    return json({ error: 'Failed to clear translation history' }, { status: 500 });
  }
}