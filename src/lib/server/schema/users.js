import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";

/**
 * Users table schema
 * - id: Unique identifier
 * - email: User's email (unique)
 * - password_hash: Hashed password (optional for passkey-only users)
 * - username: Optional username
 * - created_at: Timestamp of account creation
 * - updated_at: Timestamp of last update
 */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash"), // Made optional for passkey-only users
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

/**
 * Passkeys table schema for WebAuthn credentials
 * - id: Credential ID from WebAuthn
 * - user_id: Foreign key to users table
 * - credential_public_key: The public key (stored as blob)
 * - credential_counter: Usage counter for replay protection
 * - credential_device_type: Single or multi-device
 * - credential_backed_up: Whether credential is backed up
 * - transports: Supported transports (JSON array)
 * - created_at: Timestamp of credential creation
 * - last_used_at: Timestamp of last use
 * - nickname: User-friendly name for the passkey
 */
export const passkeys = sqliteTable("passkeys", {
  id: text("id").primaryKey(), // credentialID from WebAuthn
  user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  credential_public_key: blob("credential_public_key").notNull(),
  credential_counter: integer("credential_counter").notNull().default(0),
  credential_device_type: text("credential_device_type").notNull(), // 'singleDevice' or 'multiDevice'
  credential_backed_up: integer("credential_backed_up", { mode: "boolean" }).notNull().default(false),
  transports: text("transports"), // JSON array of supported transports
  created_at: integer("created_at").notNull(),
  last_used_at: integer("last_used_at"),
  nickname: text("nickname"),
});

/**
 * Authentication challenges table for WebAuthn flows
 * - id: Challenge UUID
 * - user_id: User ID (NULL for registration)
 * - email: Email address (for registration challenges)
 * - challenge: The actual challenge string
 * - challenge_type: 'registration' or 'authentication'
 * - expires_at: Challenge expiration timestamp
 * - created_at: Challenge creation timestamp
 */
export const authChallenges = sqliteTable("auth_challenges", {
  id: text("id").primaryKey(),
  user_id: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  email: text("email"),
  challenge: text("challenge").notNull(),
  challenge_type: text("challenge_type").notNull(), // 'registration' or 'authentication'
  expires_at: integer("expires_at").notNull(),
  created_at: integer("created_at").notNull(),
});