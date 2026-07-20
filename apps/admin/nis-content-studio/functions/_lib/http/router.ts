import { ApiError, toApiError } from "./errors";
import { apiErrorResponse, withApiHeaders } from "./response";
import type { ApiGuard, ApiRoute } from "./types";

const createRequestId = (): string => crypto.randomUUID();

export const dispatchApiRequest = async <Environment>(
  request: Request,
  env: Environment,
  routes: readonly ApiRoute<Environment>[],
  guard?: ApiGuard<Environment>,
): Promise<Response> => {
  const requestId = createRequestId();

  try {
    const pathname = new URL(request.url).pathname;
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
    return withApiHeaders(response, requestId);
  } catch (error: unknown) {
    const apiError = toApiError(error);
    const methodHeaders =
      apiError.status === 405 && apiError.details?.[0]
        ? { Allow: apiError.details[0].message }
        : undefined;
    const headers = new Headers(apiError.headers);
    if (methodHeaders) {
      headers.set("Allow", methodHeaders.Allow);
    }

    return apiErrorResponse(apiError, requestId, headers);
  }
};
