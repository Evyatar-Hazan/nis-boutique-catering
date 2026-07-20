import { dispatchApiRequest } from "../_lib/http/router";
import { apiRoutes } from "../_lib/routes";
import { enforceAdminApiPolicy } from "../_lib/security/policy";

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  dispatchApiRequest(request, env, apiRoutes, enforceAdminApiPolicy);
