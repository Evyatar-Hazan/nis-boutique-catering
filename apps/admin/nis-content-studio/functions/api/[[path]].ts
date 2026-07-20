import { dispatchApiRequest } from "../_lib/http/router";
import { apiRoutes } from "../_lib/routes";

export const onRequest: PagesFunction<Env> = async ({ request, env }) =>
  dispatchApiRequest(request, env, apiRoutes);
