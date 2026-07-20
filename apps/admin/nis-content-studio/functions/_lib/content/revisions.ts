import {
  publicSiteDocumentSchema,
  publicSiteSchemaVersion,
  type PublicSiteDocument,
} from "@monorepo/content-schema";

import { ApiError } from "../http/errors";

interface RevisionRow {
  readonly content_json: string;
  readonly created_at: number;
  readonly created_by: string;
  readonly id: string;
  readonly published_at: number | null;
  readonly schema_version: number;
  readonly status: "draft" | "published" | "archived";
  readonly updated_at: number;
  readonly updated_by: string | null;
  readonly version: number;
}

export interface ContentRevision {
  readonly content: PublicSiteDocument;
  readonly createdAt: number;
  readonly createdBy: string;
  readonly id: string;
  readonly publishedAt: number | null;
  readonly schemaVersion: typeof publicSiteSchemaVersion;
  readonly status: RevisionRow["status"];
  readonly updatedAt: number;
  readonly updatedBy: string;
  readonly version: number;
}

const parseRevision = (row: RevisionRow): ContentRevision => {
  if (row.schema_version !== publicSiteSchemaVersion) {
    throw new ApiError(
      500,
      "content_integrity_error",
      "Stored content schema version is unsupported.",
    );
  }

  let storedContent: unknown;
  try {
    storedContent = JSON.parse(row.content_json) as unknown;
  } catch {
    throw new ApiError(
      500,
      "content_integrity_error",
      "Stored content is not valid JSON.",
    );
  }

  const parsed = publicSiteDocumentSchema.safeParse(storedContent);
  if (!parsed.success) {
    throw new ApiError(
      500,
      "content_integrity_error",
      "Stored content failed schema validation.",
    );
  }

  return {
    content: parsed.data,
    createdAt: row.created_at,
    createdBy: row.created_by,
    id: row.id,
    publishedAt: row.published_at ?? null,
    schemaVersion: publicSiteSchemaVersion,
    status: row.status,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by ?? row.created_by,
    version: row.version,
  };
};

export const readDraftRevision = async (
  database: D1Database,
): Promise<ContentRevision | null> => {
  const row = await database
    .prepare(
      `SELECT id, status, schema_version, content_json, version, published_at,
              created_by, updated_by, created_at, updated_at
       FROM content_revisions
       WHERE status = 'draft'`,
    )
    .first<RevisionRow>();

  return row ? parseRevision(row) : null;
};

export const saveDraftRevision = async (
  database: D1Database,
  input: {
    readonly adminId: string;
    readonly content: unknown;
    readonly expectedVersion: number | null;
  },
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<ContentRevision> => {
  const content = publicSiteDocumentSchema.parse(input.content);
  const contentJson = JSON.stringify(content);

  let row: RevisionRow | null;
  if (input.expectedVersion === null) {
    row = await database
      .prepare(
        `INSERT INTO content_revisions
         (id, status, schema_version, content_json, version, created_by,
          updated_by, created_at, updated_at)
         SELECT ?1, 'draft', ?2, ?3, 1, ?4, ?4, ?5, ?5
         WHERE NOT EXISTS (
           SELECT 1 FROM content_revisions WHERE status = 'draft'
         )
         RETURNING id, status, schema_version, content_json, version, published_at,
                   created_by, updated_by, created_at, updated_at`,
      )
      .bind(
        crypto.randomUUID(),
        publicSiteSchemaVersion,
        contentJson,
        input.adminId,
        nowSeconds,
      )
      .first<RevisionRow>();
  } else {
    row = await database
      .prepare(
        `UPDATE content_revisions
         SET content_json = ?1,
             schema_version = ?2,
             version = version + 1,
             updated_by = ?3,
             updated_at = ?4
         WHERE status = 'draft' AND version = ?5
         RETURNING id, status, schema_version, content_json, version, published_at,
                   created_by, updated_by, created_at, updated_at`,
      )
      .bind(
        contentJson,
        publicSiteSchemaVersion,
        input.adminId,
        nowSeconds,
        input.expectedVersion,
      )
      .first<RevisionRow>();
  }

  if (!row) {
    throw new ApiError(
      409,
      "revision_conflict",
      "Draft was changed by another request.",
    );
  }

  return parseRevision(row);
};

export const readRevisionById = async (
  database: D1Database,
  revisionId: string,
): Promise<ContentRevision | null> => {
  const row = await database
    .prepare(
      `SELECT id, status, schema_version, content_json, version, published_at,
              created_by, updated_by, created_at, updated_at
       FROM content_revisions
       WHERE id = ?1`,
    )
    .bind(revisionId)
    .first<RevisionRow>();
  return row ? parseRevision(row) : null;
};

export const listContentRevisions = async (
  database: D1Database,
): Promise<readonly ContentRevision[]> => {
  const result = await database
    .prepare(
      `SELECT id, status, schema_version, content_json, version, published_at,
              created_by, updated_by, created_at, updated_at
       FROM content_revisions
       ORDER BY created_at DESC, id DESC`,
    )
    .all<RevisionRow>();
  return result.results.map(parseRevision);
};
