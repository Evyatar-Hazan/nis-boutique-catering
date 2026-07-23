PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  email TEXT COLLATE NOCASE NOT NULL UNIQUE,
  google_subject TEXT UNIQUE,
  display_name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK (email = lower(trim(email))),
  CHECK (length(trim(display_name)) > 0)
) STRICT;

CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE CHECK (length(token_hash) = 64),
  admin_id TEXT NOT NULL REFERENCES admins(id) ON UPDATE CASCADE ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
) STRICT;

CREATE TABLE IF NOT EXISTS oauth_states (
  state_hash TEXT PRIMARY KEY CHECK (length(state_hash) = 64),
  admin_id TEXT NOT NULL REFERENCES admins(id) ON UPDATE CASCADE ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
) STRICT;

CREATE TABLE IF NOT EXISTS drive_connections (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  encrypted_refresh_token TEXT NOT NULL,
  root_folder_id TEXT,
  connected_email TEXT,
  connected_by TEXT NOT NULL REFERENCES admins(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
) STRICT;

CREATE TABLE IF NOT EXISTS media_audit_log (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES admins(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('upload', 'rename', 'trash', 'restore', 'connect_drive')),
  drive_file_id TEXT,
  detail_json TEXT NOT NULL CHECK (json_valid(detail_json)),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
) STRICT;

CREATE INDEX IF NOT EXISTS admins_active_email_idx ON admins (is_active, email);
CREATE INDEX IF NOT EXISTS sessions_active_idx ON admin_sessions (token_hash, expires_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS oauth_states_expiry_idx ON oauth_states (expires_at);
CREATE INDEX IF NOT EXISTS audit_created_idx ON media_audit_log (created_at DESC);
