import { sqliteTable, text, integer, json } from "drizzle-orm/sqlite-core";

/**
 * Users table schema
 * - id: Unique identifier
 * - email: User's email (unique)
 * - password_hash: Hashed password
 * - username: Optional username
 * - created_at: Timestamp of account creation
 * - updated_at: Timestamp of last update
 */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  username: text("username"),
  created_at: integer("created_at").notNull(),
  updated_at: integer("updated_at").notNull(),
});

/**
 * Sessions table schema for authentication
 * - id: Unique session ID
 * - user_id: Foreign key to users table
 * - expires_at: Timestamp when session expires
 * - created_at: Timestamp of session creation
 */
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires_at: integer("expires_at").notNull(),
  created_at: integer("created_at").notNull(),
});

/**
 * User preferences table schema
 * - user_id: Foreign key to users table
 * - selected_languages: Array of language codes
 * - translators: Array of translator service IDs
 * - updated_at: Timestamp of last update
 */
export const userPreferences = sqliteTable("user_preferences", {
  user_id: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  selected_languages: text("selected_languages").notNull(), // Stored as JSON
  translators: text("translators").notNull(), // Stored as JSON
  updated_at: integer("updated_at").notNull(),
});