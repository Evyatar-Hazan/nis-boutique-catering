ALTER TABLE content_revisions
  ADD COLUMN updated_by TEXT REFERENCES admins(id) ON UPDATE CASCADE ON DELETE RESTRICT;

UPDATE content_revisions
SET updated_by = created_by
WHERE updated_by IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS content_revisions_single_draft_idx
  ON content_revisions (status)
  WHERE status = 'draft';

CREATE INDEX IF NOT EXISTS content_revisions_updated_by_idx
  ON content_revisions (updated_by, updated_at DESC);
