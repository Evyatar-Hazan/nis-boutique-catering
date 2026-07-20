import { ApiError, toApiError } from "./errors";
import { apiErrorResponse, withApiHeaders } from "./response";
import type { ApiGuard, ApiRoute } from "./types";
import {
  writeOperationalEvent,
  type OperationalEventWriter,
} from "../observability/logging";

const createRequestId = (): string => crypto.randomUUID();

export const dispatchApiRequest = async <Environment>(
  request: Request,
  env: Environment,
  routes: readonly ApiRoute<Environment>[],
  guard?: ApiGuard<Environment>,
  observability: {
    readonly now?: () => number;
    readonly write?: OperationalEventWriter;
  } = {},
): Promise<Response> => {
  const requestId = createRequestId();
  const pathname = new URL(request.url).pathname;
  const now = observability.now ?? (() => performance.now());
  const write = observability.write ?? writeOperationalEvent;
  const startedAt = now();
  let errorCode: string | undefined;
  let responseStatus = 500;

  try {
    const pathRoutes = routes.filter((route) => route.path === pathname);

    if (pathRoutes.length === 0) {
      throw new ApiError(404, "not_found", "API route was not found.");
    }

    const route = pathRoutes.find((candidate) => candidate.method === request.method);
    if (!route) {
      const allowedMethods = [...new Set(pathRoutes.map(({ method }) => method))]
        .sort()
        .join(", ");

      throw new ApiError(405, "method_not_allowed", "Method is not allowed.", [
        { message: allowedMethods, path: "method" },
      ]);
    }

    const guardContext = { env, request, requestId };
    const principal = guard ? await guard(guardContext, route) : null;
    const response = await route.handler({
      ...guardContext,
      principal,
    });
    responseStatus = response.status;
    return withApiHeaders(response, requestId);
  } catch (error: unknown) {
    const apiError = toApiError(error);
    errorCode = apiError.code;
    responseStatus = apiError.status;
    const methodHeaders =
      apiError.status === 405 && apiError.details?.[0]
        ? { Allow: apiError.details[0].message }
        : undefined;
    const headers = new Headers(apiError.headers);
    if (methodHeaders) {
      headers.set("Allow", methodHeaders.Allow);
    }

    return apiErrorResponse(apiError, requestId, headers);
  } finally {
    write({
      durationMs: Math.max(0, Math.round(now() - startedAt)),
      ...(errorCode ? { errorCode } : {}),
      event: "api_request",
      method: request.method,
      path: pathname,
      requestId,
      status: responseStatus,
    });
  }
};
