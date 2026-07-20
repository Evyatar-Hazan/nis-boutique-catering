import type { PublicSiteDocument } from "@monorepo/content-schema";

import { readRevisionById, type ContentRevision } from "../content/revisions";
import { ApiError } from "../http/errors";
import type { PublishJob, PublishOperation, PublishResult } from "./types";

interface PublishJobRow {
  readonly attempt_count: number;
  readonly completed_at: number | null;
  readonly created_at: number;
  readonly error_message: string | null;
  readonly github_run_id: string | null;
  readonly id: string;
  readonly idempotency_key: string;
  readonly operation: PublishOperation;
  readonly requested_by: string;
  readonly revision_id: string;
  readonly source_revision_id: string | null;
  readonly status: PublishJob["status"];
  readonly updated_at: number;
}

const jobColumns = `id, idempotency_key, revision_id, source_revision_id,
  requested_by, operation, status, github_run_id, error_message, attempt_count,
  completed_at, created_at, updated_at`;

const presentJob = (row: PublishJobRow): PublishJob => ({
  attemptCount: row.attempt_count,
  completedAt: row.completed_at,
  createdAt: row.created_at,
  errorMessage: row.error_message,
  githubRunId: row.github_run_id,
  id: row.id,
  idempotencyKey: row.idempotency_key,
  operation: row.operation,
  requestedBy: row.requested_by,
  revisionId: row.revision_id,
  sourceRevisionId: row.source_revision_id,
  status: row.status,
  updatedAt: row.updated_at,
});

export const readPublishJobById = async (
  database: D1Database,
  jobId: string,
): Promise<PublishJob | null> => {
  const row = await database
    .prepare(`SELECT ${jobColumns} FROM publish_jobs WHERE id = ?1`)
    .bind(jobId)
    .first<PublishJobRow>();
  return row ? presentJob(row) : null;
};

export const readPublishJobByIdempotencyKey = async (
  database: D1Database,
  idempotencyKey: string,
): Promise<PublishJob | null> => {
  const row = await database
    .prepare(`SELECT ${jobColumns} FROM publish_jobs WHERE idempotency_key = ?1`)
    .bind(idempotencyKey)
    .first<PublishJobRow>();
  return row ? presentJob(row) : null;
};

export const listPublishJobs = async (
  database: D1Database,
): Promise<readonly PublishJob[]> => {
  const result = await database
    .prepare(`SELECT ${jobColumns} FROM publish_jobs ORDER BY created_at DESC, id DESC`)
    .all<PublishJobRow>();
  return result.results.map(presentJob);
};

interface MediaValidationRow {
  readonly deleted_at: number | null;
  readonly id: string;
  readonly mime_type: string;
  readonly object_key: string;
  readonly sha256_hex: string;
  readonly size_bytes: number;
}

export const validatePublishMedia = async (
  database: D1Database,
  bucket: R2Bucket,
  content: PublicSiteDocument,
): Promise<void> => {
  const mediaIds = content.media.map((asset) => asset.id);
  const placeholders = mediaIds.map((_, index) => `?${index + 1}`).join(", ");
  const result = await database
    .prepare(
      `SELECT id, object_key, mime_type, size_bytes, sha256_hex, deleted_at
       FROM media_assets
       WHERE id IN (${placeholders})`,
    )
    .bind(...mediaIds)
    .all<MediaValidationRow>();
  const rowsById = new Map(result.results.map((row) => [row.id, row]));

  for (const asset of content.media) {
    const row = rowsById.get(asset.id);
    if (
      !row
      || row.deleted_at !== null
      || row.object_key !== asset.objectKey
      || row.mime_type !== asset.mimeType
      || row.size_bytes !== asset.sizeBytes
      || row.sha256_hex !== asset.checksum
    ) {
      throw new ApiError(
        409,
        "publish_media_invalid",
        "Published media metadata is missing or inconsistent.",
        [{ message: asset.id, path: "media" }],
      );
    }
    const object = await bucket.head(row.object_key);
    if (!object || object.size !== row.size_bytes) {
      throw new ApiError(
        409,
        "publish_media_missing",
        "A published media object is missing from storage.",
        [{ message: asset.id, path: "media" }],
      );
    }
  }
};

const jobInsertSql = `INSERT INTO publish_jobs
  (id, idempotency_key, revision_id, source_revision_id, requested_by,
   operation, status, created_at, updated_at)
  VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'queued', ?7, ?7)`;

export const publishDraftAtomically = async (
  database: D1Database,
  input: {
    readonly adminId: string;
    readonly draft: ContentRevision;
    readonly idempotencyKey: string;
  },
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<PublishResult> => {
  const existing = await readPublishJobByIdempotencyKey(database, input.idempotencyKey);
  if (existing) {
    const revision = await readRevisionById(database, existing.revisionId);
    if (!revision) {
      throw new ApiError(500, "publish_integrity_error", "Publish job revision is missing.");
    }
    return { job: existing, revision };
  }

  const jobId = crypto.randomUUID();
  try {
    const results = await database.batch([
      database.prepare(
        `UPDATE content_revisions
         SET status = 'archived', updated_at = ?1, updated_by = ?2
         WHERE status = 'published'`,
      ).bind(nowSeconds, input.adminId),
      database.prepare(
        `UPDATE content_revisions
         SET status = 'published', published_at = ?1, updated_at = ?1,
             updated_by = ?2
         WHERE id = ?3 AND status = 'draft' AND version = ?4
         RETURNING id`,
      ).bind(nowSeconds, input.adminId, input.draft.id, input.draft.version),
      database.prepare(
        `INSERT INTO publish_jobs
         (id, idempotency_key, revision_id, source_revision_id, requested_by,
          operation, status, created_at, updated_at)
         VALUES (
           ?1,
           ?2,
           (SELECT id FROM content_revisions WHERE id = ?3 AND status = 'published'),
           NULL,
           ?4,
           'publish',
           'queued',
           ?5,
           ?5
         )`,
      ).bind(
        jobId,
        input.idempotencyKey,
        input.draft.id,
        input.adminId,
        nowSeconds,
      ),
    ]);
    if (results[1]?.results.length !== 1) {
      throw new ApiError(409, "revision_conflict", "Draft changed before it was published.");
    }
  } catch (error: unknown) {
    const concurrent = await readPublishJobByIdempotencyKey(database, input.idempotencyKey);
    if (concurrent) {
      const revision = await readRevisionById(database, concurrent.revisionId);
      if (revision) {
        return { job: concurrent, revision };
      }
    }
    throw error;
  }

  const [job, revision] = await Promise.all([
    readPublishJobById(database, jobId),
    readRevisionById(database, input.draft.id),
  ]);
  if (!job || !revision) {
    throw new ApiError(500, "publish_integrity_error", "Published audit data is incomplete.");
  }
  return { job, revision };
};

export const rollbackRevisionAtomically = async (
  database: D1Database,
  input: {
    readonly adminId: string;
    readonly idempotencyKey: string;
    readonly source: ContentRevision;
  },
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<PublishResult> => {
  const existing = await readPublishJobByIdempotencyKey(database, input.idempotencyKey);
  if (existing) {
    const revision = await readRevisionById(database, existing.revisionId);
    if (!revision) {
      throw new ApiError(500, "publish_integrity_error", "Rollback job revision is missing.");
    }
    return { job: existing, revision };
  }

  const revisionId = crypto.randomUUID();
  const jobId = crypto.randomUUID();
  const contentJson = JSON.stringify(input.source.content);
  try {
    await database.batch([
      database.prepare(
        `UPDATE content_revisions
         SET status = 'archived', updated_at = ?1, updated_by = ?2
         WHERE status = 'published'`,
      ).bind(nowSeconds, input.adminId),
      database.prepare(
        `INSERT INTO content_revisions
         (id, status, schema_version, content_json, version, created_by,
          updated_by, published_at, created_at, updated_at)
         VALUES (?1, 'published', ?2, ?3, 1, ?4, ?4, ?5, ?5, ?5)`,
      ).bind(
        revisionId,
        input.source.schemaVersion,
        contentJson,
        input.adminId,
        nowSeconds,
      ),
      database.prepare(jobInsertSql).bind(
        jobId,
        input.idempotencyKey,
        revisionId,
        input.source.id,
        input.adminId,
        "rollback",
        nowSeconds,
      ),
    ]);
  } catch (error: unknown) {
    const concurrent = await readPublishJobByIdempotencyKey(database, input.idempotencyKey);
    if (concurrent) {
      const revision = await readRevisionById(database, concurrent.revisionId);
      if (revision) {
        return { job: concurrent, revision };
      }
    }
    throw error;
  }

  const [job, revision] = await Promise.all([
    readPublishJobById(database, jobId),
    readRevisionById(database, revisionId),
  ]);
  if (!job || !revision) {
    throw new ApiError(500, "publish_integrity_error", "Rollback audit data is incomplete.");
  }
  return { job, revision };
};

export const markDispatchAttempt = async (
  database: D1Database,
  jobId: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<PublishJob> => {
  const row = await database
    .prepare(
      `UPDATE publish_jobs
       SET status = 'deploying', attempt_count = attempt_count + 1,
           error_message = NULL, updated_at = ?1
       WHERE id = ?2 AND status IN ('queued', 'failed')
       RETURNING ${jobColumns}`,
    )
    .bind(nowSeconds, jobId)
    .first<PublishJobRow>();
  if (!row) {
    throw new ApiError(409, "publish_not_retryable", "Publish job is not retryable.");
  }
  return presentJob(row);
};

export const recordDispatchResult = async (
  database: D1Database,
  input: {
    readonly errorMessage?: string;
    readonly jobId: string;
    readonly succeeded: boolean;
  },
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<PublishJob> => {
  const row = await database
    .prepare(
      `UPDATE publish_jobs
       SET status = ?1, error_message = ?2, updated_at = ?3
       WHERE id = ?4 AND status = 'deploying'
       RETURNING ${jobColumns}`,
    )
    .bind(
      input.succeeded ? "dispatched" : "failed",
      input.errorMessage ?? null,
      nowSeconds,
      input.jobId,
    )
    .first<PublishJobRow>();
  if (!row) {
    throw new ApiError(409, "publish_state_conflict", "Publish job state changed unexpectedly.");
  }
  return presentJob(row);
};
