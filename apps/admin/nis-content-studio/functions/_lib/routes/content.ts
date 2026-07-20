import { publicSiteDocumentSchema } from "@monorepo/content-schema";
import { z } from "zod";

import {
  readDraftRevision,
  saveDraftRevision,
} from "../content/revisions";
import { requireApiPrincipal } from "../http/principal";
import { jsonApiResponse } from "../http/response";
import type { ApiRoute } from "../http/types";
import { parseJsonBody } from "../http/validation";
import { apiSecurityPolicies } from "../security/policy";

const saveDraftSchema = z.object({
  content: publicSiteDocumentSchema,
  expectedVersion: z.number().int().positive().nullable(),
}).strict();

export const readDraftRoute: ApiRoute<Env> = {
  method: "GET",
  path: "/api/content/draft",
  security: apiSecurityPolicies.adminRead,
  handler: async ({ env, requestId }) => {
    const revision = await readDraftRevision(env.DB);
    return jsonApiResponse({ revision }, 200, requestId);
  },
};

export const saveDraftRoute: ApiRoute<Env> = {
  method: "PUT",
  path: "/api/content/draft",
  security: apiSecurityPolicies.adminMutation,
  handler: async ({ env, principal, request, requestId }) => {
    const input = await parseJsonBody(request, saveDraftSchema);
    const revision = await saveDraftRevision(env.DB, {
      adminId: requireApiPrincipal(principal).adminId,
      content: input.content,
      expectedVersion: input.expectedVersion,
    });
    return jsonApiResponse({ revision }, 200, requestId);
  },
};
