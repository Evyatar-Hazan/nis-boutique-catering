import { getPublicMediaReferenceIds } from "@monorepo/content-schema";

import { readPublishedRevision } from "../content/revisions";
import { ApiError } from "../http/errors";
import { jsonApiResponse } from "../http/response";
import type { ApiRoute } from "../http/types";

const requirePublishedRevision = async (database: D1Database) => {
  const revision = await readPublishedRevision(database);
  if (!revision) {
    throw new ApiError(404, "published_content_not_found", "Published content is unavailable.");
  }
  return revision;
};

export const readPublishedContentRoute: ApiRoute<Env> = {
  method: "GET",
  path: "/api/content/published",
  handler: async ({ env, request, requestId }) => {
    const revision = await requirePublishedRevision(env.DB);
    const etag = `"revision-${revision.id}-${revision.version}"`;
    if (request.headers.get("If-None-Match") === etag) {
      return new Response(null, {
        headers: { "Cache-Control": "public, max-age=0, must-revalidate", ETag: etag },
        status: 304,
      });
    }
    return jsonApiResponse(
      {
        revision: {
          content: revision.content,
          id: revision.id,
          publishedAt: revision.publishedAt,
          version: revision.version,
        },
      },
      200,
      requestId,
      { "Cache-Control": "public, max-age=0, must-revalidate", ETag: etag },
    );
  },
};

export const readPublishedMediaRoute: ApiRoute<Env> = {
  method: "GET",
  path: "/api/content/media",
  handler: async ({ env, request }) => {
    const revision = await requirePublishedRevision(env.DB);
    const mediaId = new URL(request.url).searchParams.get("id")?.trim();
    if (!mediaId || mediaId.length > 120) {
      throw new ApiError(400, "invalid_media_id", "A valid media id is required.");
    }
    const referencedIds = new Set(getPublicMediaReferenceIds(revision.content));
    const asset = revision.content.media.find(
      (candidate) => candidate.id === mediaId && referencedIds.has(candidate.id),
    );
    if (!asset || asset.archivedAt) {
      throw new ApiError(404, "published_media_not_found", "Published media is unavailable.");
    }
    const object = await env.MEDIA.get(asset.objectKey);
    if (!object || object.size !== asset.sizeBytes) {
      throw new ApiError(404, "published_media_missing", "Published media object is missing.");
    }
    const etag = `"sha256-${asset.checksum}"`;
    if (request.headers.get("If-None-Match") === etag) {
      return new Response(null, {
        headers: { "Cache-Control": "public, max-age=31536000, immutable", ETag: etag },
        status: 304,
      });
    }
    return new Response(object.body, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(object.size),
        "Content-Type": asset.mimeType,
        ETag: etag,
      },
      status: 200,
    });
  },
};
