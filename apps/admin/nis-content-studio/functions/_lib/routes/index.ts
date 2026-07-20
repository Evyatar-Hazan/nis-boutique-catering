import type { ApiRoute } from "../http/types";
import { googleLoginRoute, logoutRoute, sessionRoute } from "./auth";
import { readDraftRoute, saveDraftRoute } from "./content";
import { healthRoute } from "./health";
import {
  archiveMediaRoute,
  listMediaRoute,
  readMediaFileRoute,
  scanMediaOrphansRoute,
  updateMediaRoute,
  uploadMediaRoute,
} from "./media";
import {
  publishDraftRoute,
  publishHistoryRoute,
  retryPublishRoute,
  rollbackPublishRoute,
} from "./publish";
import {
  readPublishedContentRoute,
  readPublishedMediaRoute,
} from "./publicContent";

export const apiRoutes: readonly ApiRoute<Env>[] = [
  healthRoute,
  readPublishedContentRoute,
  readPublishedMediaRoute,
  googleLoginRoute,
  sessionRoute,
  logoutRoute,
  readDraftRoute,
  saveDraftRoute,
  listMediaRoute,
  readMediaFileRoute,
  scanMediaOrphansRoute,
  uploadMediaRoute,
  updateMediaRoute,
  archiveMediaRoute,
  publishDraftRoute,
  retryPublishRoute,
  rollbackPublishRoute,
  publishHistoryRoute,
];
