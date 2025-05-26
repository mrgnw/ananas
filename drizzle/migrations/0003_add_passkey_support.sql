-- Add passkey support to authentication system
-- First, make password_hash optional for users who only use passkeys
-- Note: SQLite doesn't support ALTER COLUMN, so we need to recreate the table

-- Step 1: Create new users table with optional password_hash
CREATE TABLE IF NOT EXISTS users_new (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT, -- Made optional for passkey-only users
  username TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Step 2: Copy existing data
INSERT INTO users_new (id, email, password_hash, username, created_at, updated_at)
SELECT id, email, password_hash, username, created_at, updated_at FROM users;

-- Step 3: Drop old table and rename new one
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- Step 4: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create passkeys table for WebAuthn credentials
CREATE TABLE IF NOT EXISTS passkeys (
  id TEXT PRIMARY KEY, -- credentialID from WebAuthn
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_public_key BLOB NOT NULL, -- The public key
  credential_counter INTEGER NOT NULL DEFAULT 0, -- Usage counter
  credential_device_type TEXT NOT NULL, -- 'singleDevice' or 'multiDevice'
  credential_backed_up BOOLEAN NOT NULL DEFAULT FALSE, -- Whether credential is backed up
  transports TEXT, -- JSON array of supported transports like ['usb', 'nfc', 'ble', 'internal']
  created_at INTEGER NOT NULL,
  last_used_at INTEGER,
  nickname TEXT -- User-friendly name for the passkey
);

-- Create indexes for passkeys
CREATE INDEX IF NOT EXISTS idx_passkeys_user_id ON passkeys(user_id);
CREATE INDEX IF NOT EXISTS idx_passkeys_credential_id ON passkeys(id);

-- Create authentication challenges table for WebAuthn flows
CREATE TABLE IF NOT EXISTS auth_challenges (
  id TEXT PRIMARY KEY, -- challenge UUID
  user_id TEXT, -- NULL for registration, user ID for authentication
  email TEXT, -- For registration challenges
  challenge TEXT NOT NULL, -- The actual challenge string
  challenge_type TEXT NOT NULL, -- 'registration' or 'authentication'
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Create indexes for auth challenges
CREATE INDEX IF NOT EXISTS idx_auth_challenges_user_id ON auth_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_challenges_email ON auth_challenges(email);
CREATE INDEX IF NOT EXISTS idx_auth_challenges_expires_at ON auth_challenges(expires_at);