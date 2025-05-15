import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { users } from "./users";

/**
 * Translation history table schema
 * - id: Unique identifier
 * - user_id: Foreign key to users table (nullable for guest translations)
 * - input_text: Original text to translate
 * - output_json: JSON string of translation results
 * - source_lang: Source language code (or 'auto')
 * - target_langs: JSON array of target language codes
 * - created_at: Timestamp of translation
 */
export const translationHistory = sqliteTable("translation_history", {
  id: text("id").primaryKey(),
  user_id: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  input_text: text("input_text").notNull(),
  output_json: text("output_json").notNull(), // Stored as JSON string
  source_lang: text("source_lang").notNull(),
  target_langs: text("target_langs").notNull(), // Stored as JSON array
  created_at: integer("created_at").notNull(),
});