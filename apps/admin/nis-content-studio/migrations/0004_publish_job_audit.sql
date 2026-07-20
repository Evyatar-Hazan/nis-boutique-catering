ALTER TABLE publish_jobs
ADD COLUMN operation TEXT NOT NULL DEFAULT 'publish'
CHECK (operation IN ('publish', 'rollback'));

ALTER TABLE publish_jobs
ADD COLUMN source_revision_id TEXT
REFERENCES content_revisions(id) ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS publish_jobs_source_revision_idx
  ON publish_jobs (source_revision_id, created_at DESC);
