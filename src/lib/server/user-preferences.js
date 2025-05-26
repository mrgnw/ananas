import { eq } from 'drizzle-orm';
import { userPreferences } from './schema/users';

/**
 * Get user preferences from the database
 * 
 * @param {Object} db - Drizzle database instance
 * @param {string} userId - User ID to get preferences for
 * @returns {Promise<Object>} - User preferences or default preferences if none exists
 */
export async function getUserPreferences(db, userId) {
  try {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.user_id, userId))
      .limit(1);
    
    if (preferences) {
      // Parse JSON strings into arrays
      return {
        ...preferences,
        selected_languages: JSON.parse(preferences.selected_languages),
        translators: JSON.parse(preferences.translators)
      };
    }
    
    // Return default preferences if none exists
    return {
      user_id: userId,
      selected_languages: [],
      translators: ['deepl'],
      updated_at: Date.now()
    };
  } catch (error) {
    console.error('[user-preferences] Error getting user preferences:', error);
    // Return default preferences in case of error
    return {
      user_id: userId,
      selected_languages: [],
      translators: ['deepl'],
      updated_at: Date.now()
    };
  }
}

/**
 * Save user preferences to the database
 * 
 * @param {Object} db - Drizzle database instance
 * @param {string} userId - User ID to save preferences for
 * @param {Object} preferences - Preferences object with selected_languages and translators
 * @returns {Promise<boolean>} - Whether the save was successful
 */
export async function saveUserPreferences(db, userId, { selected_languages, translators }) {
  try {
    const now = Date.now();
    
    // Stringify arrays for storage
    const data = {
      user_id: userId,
      selected_languages: JSON.stringify(selected_languages || []),
      translators: JSON.stringify(translators || ['deepl']),
      updated_at: now
    };
    
    // Check if preferences exist
    const [existingPrefs] = await db
      .select({ user_id: userPreferences.user_id })
      .from(userPreferences)
      .where(eq(userPreferences.user_id, userId))
      .limit(1);
    
    if (existingPrefs) {
      // Update existing preferences
      await db
        .update(userPreferences)
        .set(data)
        .where(eq(userPreferences.user_id, userId));
    } else {
      // Insert new preferences
      await db.insert(userPreferences).values(data);
    }
    
    return true;
  } catch (error) {
    console.error('[user-preferences] Error saving user preferences:', error);
    return false;
  }
}