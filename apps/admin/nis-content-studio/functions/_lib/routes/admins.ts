import { z } from "zod";

import { createAdmin, listAdmins, updateAdmin } from "../admin/repository";
import { requireApiPrincipal } from "../http/principal";
import { jsonApiResponse } from "../http/response";
import type { ApiRoute } from "../http/types";
import { parseJsonBody } from "../http/validation";
import { apiSecurityPolicies } from "../security/policy";

const adminIdSchema = z.string().trim().min(1).max(120);
const createAdminSchema = z.object({
  displayName: z.string().trim().min(1).max(180),
  email: z.string().trim().email().max(320),
}).strict();
const updateAdminSchema = z.object({
  displayName: z.string().trim().min(1).max(180).optional(),
  id: adminIdSchema,
  isActive: z.boolean().optional(),
}).strict().refine(({ displayName, isActive }) => displayName !== undefined || isActive !== undefined, {
  message: "At least one admin change is required.",
});

export const listAdminsRoute: ApiRoute<Env> = {
  method: "GET",
  path: "/api/admins",
  security: apiSecurityPolicies.adminRead,
  handler: async ({ env, requestId }) => jsonApiResponse({ admins: await listAdmins(env.DB) }, 200, requestId),
};

export const createAdminRoute: ApiRoute<Env> = {
  method: "POST",
  path: "/api/admins",
  security: apiSecurityPolicies.adminMutation,
  handler: async ({ env, request, requestId }) => {
    const input = await parseJsonBody(request, createAdminSchema);
    return jsonApiResponse({ admin: await createAdmin(env.DB, input) }, 201, requestId);
  },
};

export const updateAdminRoute: ApiRoute<Env> = {
  method: "PATCH",
  path: "/api/admins",
  security: apiSecurityPolicies.adminMutation,
  handler: async ({ env, principal, request, requestId }) => {
    const input = await parseJsonBody(request, updateAdminSchema);
    return jsonApiResponse({ admin: await updateAdmin(env.DB, requireApiPrincipal(principal).adminId, input) }, 200, requestId);
  },
};
