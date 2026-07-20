import type { ApiError } from "./errors";

const applySecurityHeaders = (headers: Headers, requestId: string): void => {
  if (!headers.has("Cache-Control")) {
    headers.set("Cache-Control", "no-store");
  }
  headers.set("Content-Security-Policy", "default-src 'none'");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Request-ID", requestId);
};

export const jsonApiResponse = (
  body: unknown,
  status: number,
  requestId: string,
  additionalHeaders?: HeadersInit,
): Response => {
  const headers = new Headers(additionalHeaders);
  applySecurityHeaders(headers, requestId);

  return Response.json(body, { headers, status });
};

export const apiErrorResponse = (
  error: ApiError,
  requestId: string,
  additionalHeaders?: HeadersInit,
): Response =>
  jsonApiResponse(
    {
      error: {
        code: error.code,
        ...(error.details ? { details: error.details } : {}),
        message: error.message,
        requestId,
      },
    },
    error.status,
    requestId,
    additionalHeaders,
  );

export const withApiHeaders = (
  response: Response,
  requestId: string,
): Response => {
  const headers = new Headers(response.headers);
  applySecurityHeaders(headers, requestId);

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
};
