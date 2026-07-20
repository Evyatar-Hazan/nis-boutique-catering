CREATE TABLE IF NOT EXISTS api_rate_limits (
  key TEXT PRIMARY KEY,
  scope TEXT NOT NULL CHECK (scope IN ('login', 'upload', 'publish')),
  request_count INTEGER NOT NULL CHECK (request_count > 0),
  window_started_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK (length(key) = 64),
  CHECK (expires_at > window_started_at)
) STRICT;

CREATE INDEX IF NOT EXISTS api_rate_limits_expiry_idx
  ON api_rate_limits (expires_at);
