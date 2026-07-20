PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  email TEXT COLLATE NOCASE NOT NULL UNIQUE,
  google_subject TEXT UNIQUE,
  display_name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK (length(trim(id)) > 0),
  CHECK (email = lower(trim(email))),
  CHECK (length(trim(display_name)) > 0)
) STRICT;

CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  admin_id TEXT NOT NULL REFERENCES admins(id) ON UPDATE CASCADE ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK (length(token_hash) = 64),
  CHECK (expires_at > created_at),
  CHECK (revoked_at IS NULL OR revoked_at >= created_at)
) STRICT;

CREATE TABLE IF NOT EXISTS content_revisions (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  schema_version INTEGER NOT NULL CHECK (schema_version > 0),
  content_json TEXT NOT NULL CHECK (json_valid(content_json)),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by TEXT NOT NULL REFERENCES admins(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  published_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK (status != 'published' OR published_at IS NOT NULL)
) STRICT;

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  object_key TEXT NOT NULL UNIQUE,
  original_file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  width INTEGER,
  height INTEGER,
  sha256_hex TEXT NOT NULL UNIQUE,
  alt_text TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL REFERENCES admins(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  deleted_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK (length(trim(object_key)) > 0),
  CHECK (length(trim(original_file_name)) > 0),
  CHECK (mime_type LIKE 'image/%' OR mime_type LIKE 'video/%'),
  CHECK (length(sha256_hex) = 64),
  CHECK (
    (width IS NULL AND height IS NULL)
    OR (width > 0 AND height > 0)
  ),
  CHECK (deleted_at IS NULL OR deleted_at >= created_at)
) STRICT;

CREATE TABLE IF NOT EXISTS publish_jobs (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  revision_id TEXT NOT NULL REFERENCES content_revisions(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  requested_by TEXT NOT NULL REFERENCES admins(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (
    status IN ('queued', 'dispatched', 'deploying', 'succeeded', 'failed')
  ),
  github_run_id TEXT,
  error_message TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  completed_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK (completed_at IS NULL OR completed_at >= created_at),
  CHECK (status != 'succeeded' OR completed_at IS NOT NULL)
) STRICT;

CREATE INDEX IF NOT EXISTS admins_active_email_idx
  ON admins (is_active, email);

CREATE INDEX IF NOT EXISTS admin_sessions_admin_expiry_idx
  ON admin_sessions (admin_id, expires_at);

CREATE INDEX IF NOT EXISTS admin_sessions_active_expiry_idx
  ON admin_sessions (expires_at)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS content_revisions_status_created_idx
  ON content_revisions (status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS content_revisions_single_published_idx
  ON content_revisions (status)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS media_assets_active_created_idx
  ON media_assets (created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS media_assets_deleted_idx
  ON media_assets (deleted_at)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS publish_jobs_status_created_idx
  ON publish_jobs (status, created_at DESC);

CREATE INDEX IF NOT EXISTS publish_jobs_revision_idx
  ON publish_jobs (revision_id, created_at DESC);
