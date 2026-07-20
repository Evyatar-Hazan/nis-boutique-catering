import type { ApiRoute } from "../http/types";
import { googleLoginRoute, logoutRoute, sessionRoute } from "./auth";
import { readDraftRoute, saveDraftRoute } from "./content";
import { healthRoute } from "./health";

export const apiRoutes: readonly ApiRoute<Env>[] = [
  healthRoute,
  googleLoginRoute,
  sessionRoute,
  logoutRoute,
  readDraftRoute,
  saveDraftRoute,
];
