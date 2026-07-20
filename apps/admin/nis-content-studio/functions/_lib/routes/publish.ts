import { z } from "zod";

import { listContentRevisions } from "../content/revisions";
import { ApiError } from "../http/errors";
import { requireApiPrincipal } from "../http/principal";
import { jsonApiResponse } from "../http/response";
import type { ApiRoute } from "../http/types";
import { parseJsonBody } from "../http/validation";
import { listPublishJobs } from "../publish/repository";
import {
  publishDraft,
  retryPublishDispatch,
  rollbackPublishedRevision,
} from "../publish/service";
import { apiSecurityPolicies } from "../security/policy";

const publishSchema = z.object({
  draftId: z.string().uuid(),
  expectedVersion: z.number().int().positive(),
}).strict();

const retrySchema = z.object({ jobId: z.string().uuid() }).strict();
const rollbackSchema = z.object({ sourceRevisionId: z.string().uuid() }).strict();
const idempotencyKeyPattern = /^[A-Za-z0-9][A-Za-z0-9:._-]{7,127}$/u;

const requireIdempotencyKey = (request: Request): string => {
  const value = request.headers.get("Idempotency-Key")?.trim();
  if (!value || !idempotencyKeyPattern.test(value)) {
    throw new ApiError(
      400,
      "invalid_idempotency_key",
      "Idempotency-Key must contain 8 to 128 safe characters.",
    );
  }
  return value;
};

export const publishDraftRoute: ApiRoute<Env> = {
  method: "POST",
  path: "/api/publish",
  security: apiSecurityPolicies.publish,
  handler: async ({ env, principal, request, requestId }) => {
    const input = await parseJsonBody(request, publishSchema);
    const result = await publishDraft(env, {
      adminId: requireApiPrincipal(principal).adminId,
      draftId: input.draftId,
      expectedVersion: input.expectedVersion,
      idempotencyKey: requireIdempotencyKey(request),
    });
    return jsonApiResponse(result, 200, requestId);
  },
};

export const retryPublishRoute: ApiRoute<Env> = {
  method: "POST",
  path: "/api/publish/retry",
  security: apiSecurityPolicies.publish,
  handler: async ({ env, request, requestId }) => {
    const { jobId } = await parseJsonBody(request, retrySchema);
    return jsonApiResponse(
      { job: await retryPublishDispatch(env, jobId) },
      200,
      requestId,
    );
  },
};

export const rollbackPublishRoute: ApiRoute<Env> = {
  method: "POST",
  path: "/api/publish/rollback",
  security: apiSecurityPolicies.publish,
  handler: async ({ env, principal, request, requestId }) => {
    const input = await parseJsonBody(request, rollbackSchema);
    const result = await rollbackPublishedRevision(env, {
      adminId: requireApiPrincipal(principal).adminId,
      idempotencyKey: requireIdempotencyKey(request),
      sourceRevisionId: input.sourceRevisionId,
    });
    return jsonApiResponse(result, 200, requestId);
  },
};

export const publishHistoryRoute: ApiRoute<Env> = {
  method: "GET",
  path: "/api/publish/history",
  security: apiSecurityPolicies.adminRead,
  handler: async ({ env, requestId }) => {
    const [jobs, revisions] = await Promise.all([
      listPublishJobs(env.DB),
      listContentRevisions(env.DB),
    ]);
    return jsonApiResponse({ jobs, revisions }, 200, requestId);
  },
};
