import { eq, desc } from 'drizzle-orm';
import { translationHistory } from './schema/translations';
import { nanoid } from 'nanoid';

/**
 * Save a translation to the database
 * 
 * @param {Object} db - Drizzle database instance
 * @param {Object} translation - Translation object to save
 * @param {string} [userId] - Optional user ID to associate with the translation
 * @returns {Promise<Object>} The saved translation record
 */
export async function saveTranslation(db, translation, userId = null) {
  try {
    const id = nanoid();
    const now = Date.now();
    
    const translationRecord = {
      id,
      user_id: userId,
      input_text: translation.input,
      output_json: JSON.stringify(translation.output),
      source_lang: translation.sourceLang || 'auto',
      target_langs: JSON.stringify(translation.targetLang),
      created_at: translation.timestamp || now
    };
    
    await db.insert(translationHistory).values(translationRecord);
    
    return translationRecord;
  } catch (error) {
    console.error('[translation-history] Error saving translation:', error);
    throw error;
  }
}

/**
 * Get a user's translation history from the database
 * 
 * @param {Object} db - Drizzle database instance
 * @param {string} userId - User ID to get history for
 * @param {number} limit - Maximum number of translations to return
 * @returns {Promise<Array>} Array of translation history items
 */
export async function getUserTranslationHistory(db, userId, limit = 20) {
  try {
    const records = await db
      .select()
      .from(translationHistory)
      .where(eq(translationHistory.user_id, userId))
      .orderBy(desc(translationHistory.created_at))
      .limit(limit);
    
    return records.map(record => ({
      id: record.id,
      input: record.input_text,
      output: JSON.parse(record.output_json),
      sourceLang: record.source_lang,
      targetLang: JSON.parse(record.target_langs),
      timestamp: record.created_at
    }));
  } catch (error) {
    console.error('[translation-history] Error getting user translation history:', error);
    return [];
  }
}

/**
 * Merge local translations into a user's database history
 * 
 * @param {Object} db - Drizzle database instance
 * @param {string} userId - User ID to merge translations for
 * @param {Array} localTranslations - Array of local translation objects
 * @returns {Promise<boolean>} Whether the operation was successful
 */
export async function mergeLocalTranslations(db, userId, localTranslations) {
  if (!localTranslations || !Array.isArray(localTranslations) || localTranslations.length === 0) {
    return true;
  }
  
  try {
    // Create a batch of translation records to insert
    const translationRecords = localTranslations.map(translation => ({
      id: nanoid(),
      user_id: userId,
      input_text: translation.input,
      output_json: JSON.stringify(translation.output),
      source_lang: translation.sourceLang || 'auto',
      target_langs: JSON.stringify(translation.targetLang),
      created_at: translation.timestamp || Date.now()
    }));
    
    // Insert all translations in a batch
    for (const record of translationRecords) {
      await db.insert(translationHistory).values(record);
    }
    
    return true;
  } catch (error) {
    console.error('[translation-history] Error merging local translations:', error);
    return false;
  }
}

/**
 * Delete all translations for a user
 * 
 * @param {Object} db - Drizzle database instance
 * @param {string} userId - User ID to clear history for
 * @returns {Promise<boolean>} Whether the operation was successful
 */
export async function clearUserTranslationHistory(db, userId) {
  try {
    await db
      .delete(translationHistory)
      .where(eq(translationHistory.user_id, userId));
    
    return true;
  } catch (error) {
    console.error('[translation-history] Error clearing user translation history:', error);
    return false;
  }
}