import type { ApiRoute } from "../http/types";
import { healthRoute } from "./health";

export const apiRoutes: readonly ApiRoute<Env>[] = [healthRoute];
