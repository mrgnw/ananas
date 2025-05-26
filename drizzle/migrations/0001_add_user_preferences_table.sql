-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  selected_languages TEXT NOT NULL, -- JSON array of language codes
  translators TEXT NOT NULL, -- JSON array of translator service IDs
  updated_at INTEGER NOT NULL
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);