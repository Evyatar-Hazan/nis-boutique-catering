import { publicSiteDocumentSchema } from "@monorepo/content-schema";

import { ApiError } from "../http/errors";

interface MediaRow {
  readonly alt_text: string;
  readonly created_at: number;
  readonly created_by: string;
  readonly deleted_at: number | null;
  readonly height: number | null;
  readonly id: string;
  readonly mime_type: string;
  readonly object_key: string;
  readonly original_file_name: string;
  readonly sha256_hex: string;
  readonly size_bytes: number;
  readonly updated_at: number;
  readonly width: number | null;
}

export interface MediaAsset {
  readonly altText: string;
  readonly createdAt: number;
  readonly createdBy: string;
  readonly deletedAt: number | null;
  readonly height: number | null;
  readonly id: string;
  readonly mimeType: string;
  readonly objectKey: string;
  readonly originalFileName: string;
  readonly sha256Hex: string;
  readonly sizeBytes: number;
  readonly updatedAt: number;
  readonly width: number | null;
}

const mediaColumns = `id, object_key, original_file_name, mime_type, size_bytes,
  width, height, sha256_hex, alt_text, created_by, deleted_at, created_at, updated_at`;

const presentMedia = (row: MediaRow): MediaAsset => ({
  altText: row.alt_text,
  createdAt: row.created_at,
  createdBy: row.created_by,
  deletedAt: row.deleted_at,
  height: row.height,
  id: row.id,
  mimeType: row.mime_type,
  objectKey: row.object_key,
  originalFileName: row.original_file_name,
  sha256Hex: row.sha256_hex,
  sizeBytes: row.size_bytes,
  updatedAt: row.updated_at,
  width: row.width,
});

export const listMediaAssets = async (
  database: D1Database,
): Promise<readonly MediaAsset[]> => {
  const result = await database
    .prepare(
      `SELECT ${mediaColumns}
       FROM media_assets
       ORDER BY deleted_at IS NOT NULL, created_at DESC`,
    )
    .all<MediaRow>();
  return result.results.map(presentMedia);
};

export const scanMediaOrphans = async (
  database: D1Database,
  bucket: R2Bucket,
): Promise<{
  readonly missingObjects: readonly string[];
  readonly orphanObjects: readonly string[];
}> => {
  const databaseKeys = new Set(
    (await listMediaAssets(database)).map((asset) => asset.objectKey),
  );
  const bucketKeys = new Set<string>();
  let cursor: string | undefined;

  do {
    const page = await bucket.list({ cursor });
    for (const object of page.objects) {
      bucketKeys.add(object.key);
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);

  return {
    missingObjects: [...databaseKeys].filter((key) => !bucketKeys.has(key)).sort(),
    orphanObjects: [...bucketKeys].filter((key) => !databaseKeys.has(key)).sort(),
  };
};

export const findMediaByHash = async (
  database: D1Database,
  sha256Hex: string,
): Promise<MediaAsset | null> => {
  const row = await database
    .prepare(`SELECT ${mediaColumns} FROM media_assets WHERE sha256_hex = ?1`)
    .bind(sha256Hex)
    .first<MediaRow>();
  return row ? presentMedia(row) : null;
};

export const insertMediaAsset = async (
  database: D1Database,
  input: {
    readonly altText: string;
    readonly createdBy: string;
    readonly height: number | null;
    readonly id: string;
    readonly mimeType: string;
    readonly objectKey: string;
    readonly originalFileName: string;
    readonly sha256Hex: string;
    readonly sizeBytes: number;
    readonly width: number | null;
  },
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<MediaAsset> => {
  const row = await database
    .prepare(
      `INSERT INTO media_assets
       (id, object_key, original_file_name, mime_type, size_bytes, width, height,
        sha256_hex, alt_text, created_by, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?11)
       RETURNING ${mediaColumns}`,
    )
    .bind(
      input.id,
      input.objectKey,
      input.originalFileName,
      input.mimeType,
      input.sizeBytes,
      input.width,
      input.height,
      input.sha256Hex,
      input.altText,
      input.createdBy,
      nowSeconds,
    )
    .first<MediaRow>();
  if (!row) {
    throw new ApiError(500, "media_write_failed", "Could not save media metadata.");
  }
  return presentMedia(row);
};

const readActiveReferenceLabels = async (
  database: D1Database,
  mediaId: string,
): Promise<readonly string[]> => {
  const revisions = await database
    .prepare(
      `SELECT id, status, content_json
       FROM content_revisions
       WHERE status IN ('draft', 'published')`,
    )
    .all<{ readonly content_json: string; readonly id: string; readonly status: string }>();
  const references: string[] = [];

  for (const revision of revisions.results) {
    let content: unknown;
    try {
      content = JSON.parse(revision.content_json) as unknown;
    } catch {
      throw new ApiError(500, "content_integrity_error", "Stored content is not valid JSON.");
    }
    const parsed = publicSiteDocumentSchema.safeParse(content);
    if (!parsed.success) {
      throw new ApiError(500, "content_integrity_error", "Stored content failed schema validation.");
    }

    const document = parsed.data;
    const referencedIds = new Set([
      document.sections.hero.mediaId,
      document.sections.trust.mediaId,
      ...document.sections.services.items.map((item) => item.mediaId),
      ...document.sections.gallery.items.map((item) => item.mediaId),
      ...(document.sections.gallery.videoMediaId
        ? [document.sections.gallery.videoMediaId]
        : []),
      ...document.media
        .filter((asset) => asset.kind === "video")
        .map((asset) => asset.posterMediaId),
    ]);
    if (referencedIds.has(mediaId)) {
      references.push(`${revision.status}:${revision.id}`);
    }
  }

  return references;
};

export const updateMediaAsset = async (
  database: D1Database,
  input: {
    readonly altText?: string;
    readonly archive?: boolean;
    readonly id: string;
  },
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<MediaAsset> => {
  if (input.archive === true) {
    const references = await readActiveReferenceLabels(database, input.id);
    if (references.length > 0) {
      throw new ApiError(
        409,
        "media_in_use",
        "Media is referenced by active content.",
        references.map((reference) => ({ message: reference, path: "references" })),
      );
    }
  }

  const archiveMode = input.archive === true
    ? "archive"
    : input.archive === false
      ? "restore"
      : "preserve";
  const row = await database
    .prepare(
      `UPDATE media_assets
       SET alt_text = COALESCE(?1, alt_text),
           deleted_at = CASE ?2
             WHEN 'archive' THEN COALESCE(deleted_at, ?3)
             WHEN 'restore' THEN NULL
             ELSE deleted_at
           END,
           updated_at = ?3
       WHERE id = ?4
       RETURNING ${mediaColumns}`,
    )
    .bind(input.altText ?? null, archiveMode, nowSeconds, input.id)
    .first<MediaRow>();
  if (!row) {
    throw new ApiError(404, "media_not_found", "Media asset was not found.");
  }
  return presentMedia(row);
};
