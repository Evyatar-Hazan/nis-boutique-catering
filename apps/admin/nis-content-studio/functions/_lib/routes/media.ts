import { z } from "zod";

import { ApiError } from "../http/errors";
import { requireApiPrincipal } from "../http/principal";
import { jsonApiResponse, withApiHeaders } from "../http/response";
import type { ApiRoute } from "../http/types";
import { parseJsonBody } from "../http/validation";
import {
  findMediaById,
  listMediaLibraryAssets,
  scanMediaOrphans,
  updateMediaAsset,
} from "../media/repository";
import { uploadMediaAsset } from "../media/upload";
import { apiSecurityPolicies } from "../security/policy";

const updateMediaSchema = z.object({
  altText: z.string().trim().min(1).max(500).optional(),
  archived: z.boolean().optional(),
  id: z.string().trim().min(1).max(120),
}).strict().refine(
  ({ altText, archived }) => altText !== undefined || archived !== undefined,
  { message: "At least one media change is required." },
);

const archiveMediaSchema = z.object({ id: z.string().trim().min(1).max(120) }).strict();

export const listMediaRoute: ApiRoute<Env> = {
  method: "GET",
  path: "/api/media",
  security: apiSecurityPolicies.adminRead,
  handler: async ({ env, requestId }) =>
    jsonApiResponse({ media: await listMediaLibraryAssets(env.DB) }, 200, requestId),
};

export const readMediaFileRoute: ApiRoute<Env> = {
  method: "GET",
  path: "/api/media/file",
  security: apiSecurityPolicies.adminRead,
  handler: async ({ env, request, requestId }) => {
    const id = new URL(request.url).searchParams.get("id")?.trim();
    const asset = id ? await findMediaById(env.DB, id) : null;
    if (!asset) {
      throw new ApiError(404, "media_not_found", "Media asset was not found.");
    }
    const object = await env.MEDIA.get(asset.objectKey);
    if (!object || object.size !== asset.sizeBytes) {
      throw new ApiError(404, "media_object_missing", "Media object is unavailable.");
    }
    return withApiHeaders(new Response(object.body, {
      headers: {
        "Cache-Control": "private, max-age=300",
        "Content-Length": String(object.size),
        "Content-Type": asset.mimeType,
        ETag: `"sha256-${asset.sha256Hex}"`,
      },
    }), requestId);
  },
};

export const uploadMediaRoute: ApiRoute<Env> = {
  method: "POST",
  path: "/api/media",
  security: apiSecurityPolicies.upload,
  handler: async ({ env, principal, request, requestId }) => {
    const media = await uploadMediaAsset(
      request,
      env,
      requireApiPrincipal(principal),
    );
    return jsonApiResponse({ media }, 201, requestId);
  },
};

export const scanMediaOrphansRoute: ApiRoute<Env> = {
  method: "GET",
  path: "/api/media/orphans",
  security: apiSecurityPolicies.adminRead,
  handler: async ({ env, requestId }) =>
    jsonApiResponse(await scanMediaOrphans(env.DB, env.MEDIA), 200, requestId),
};

export const updateMediaRoute: ApiRoute<Env> = {
  method: "PATCH",
  path: "/api/media",
  security: apiSecurityPolicies.adminMutation,
  handler: async ({ env, request, requestId }) => {
    const input = await parseJsonBody(request, updateMediaSchema);
    const media = await updateMediaAsset(env.DB, {
      altText: input.altText,
      archive: input.archived,
      id: input.id,
    });
    return jsonApiResponse({ media }, 200, requestId);
  },
};

export const archiveMediaRoute: ApiRoute<Env> = {
  method: "DELETE",
  path: "/api/media",
  security: apiSecurityPolicies.adminMutation,
  handler: async ({ env, request, requestId }) => {
    const { id } = await parseJsonBody(request, archiveMediaSchema);
    const media = await updateMediaAsset(env.DB, { archive: true, id });
    return jsonApiResponse({ media }, 200, requestId);
  },
};
