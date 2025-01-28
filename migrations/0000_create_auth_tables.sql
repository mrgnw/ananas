-- Drop existing tables
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS authenticators;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    current_challenge TEXT
);

-- Create authenticators table
CREATE TABLE authenticators (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    credential_public_key BLOB NOT NULL,
    counter BIGINT NOT NULL DEFAULT 0,
    transports TEXT,  -- JSON array of transports
    device_type TEXT NOT NULL,  -- 'singleDevice' or 'multiDevice'
    backed_up BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create sessions table
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
