import type { ApiRoute } from "../http/types";
import { googleLoginRoute, logoutRoute, sessionRoute } from "./auth";
import { healthRoute } from "./health";

export const apiRoutes: readonly ApiRoute<Env>[] = [
  healthRoute,
  googleLoginRoute,
  sessionRoute,
  logoutRoute,
];
