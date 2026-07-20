import { z } from "zod";

import {
  createAdminSession,
  createExpiredSessionCookie,
  requireAdminSession,
  revokeAdminSession,
} from "../auth/session";
import { verifyGoogleIdToken } from "../auth/googleIdentity";
import { requireApiPrincipal } from "../http/principal";
import { jsonApiResponse } from "../http/response";
import type { ApiRoute } from "../http/types";
import { parseJsonBody } from "../http/validation";
import { apiSecurityPolicies } from "../security/policy";

const googleLoginSchema = z.object({
  credential: z.string().min(1).max(16_384),
}).strict();

const presentSession = (session: Awaited<ReturnType<typeof requireAdminSession>>) => ({
  admin: {
    displayName: session.displayName,
    email: session.email,
  },
  expiresAt: session.expiresAt,
});

export const googleLoginRoute: ApiRoute<Env> = {
  method: "POST",
  path: "/api/auth/google",
  security: apiSecurityPolicies.login,
  handler: async ({ env, request, requestId }) => {
    const { credential } = await parseJsonBody(request, googleLoginSchema);
    const identity = await verifyGoogleIdToken(
      credential,
      env.GOOGLE_CLIENT_ID,
    );
    const { cookie, session } = await createAdminSession(env.DB, identity);
    return jsonApiResponse(presentSession(session), 200, requestId, {
      "Set-Cookie": cookie,
    });
  },
};

export const sessionRoute: ApiRoute<Env> = {
  method: "GET",
  path: "/api/auth/session",
  security: apiSecurityPolicies.adminRead,
  handler: async ({ principal, requestId }) => {
    return jsonApiResponse(
      presentSession(requireApiPrincipal(principal)),
      200,
      requestId,
    );
  },
};

export const logoutRoute: ApiRoute<Env> = {
  method: "POST",
  path: "/api/auth/logout",
  security: apiSecurityPolicies.logout,
  handler: async ({ env, request, requestId }) => {
    await revokeAdminSession(request, env.DB);
    return jsonApiResponse({ status: "signed_out" }, 200, requestId, {
      "Set-Cookie": createExpiredSessionCookie(),
    });
  },
};
