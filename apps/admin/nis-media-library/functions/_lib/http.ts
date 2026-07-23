export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface Principal {
  readonly adminId: string;
  readonly displayName: string;
  readonly email: string;
  readonly sessionId: string;
}

export const json = (
  value: unknown,
  status = 200,
  headers?: HeadersInit,
): Response => new Response(JSON.stringify(value), {
  status,
  headers: {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    ...headers,
  },
});

export const apiHeaders = (response: Response, requestId: string): Response => {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Request-Id', requestId);
  return new Response(response.body, { headers, status: response.status });
};

export const errorResponse = (error: unknown, requestId: string): Response => {
  const apiError = error instanceof ApiError
    ? error
    : new ApiError(500, 'internal_error', 'אירעה שגיאה פנימית.');
  return apiHeaders(json({
    error: {
      code: apiError.code,
      ...(apiError.details === undefined ? {} : { details: apiError.details }),
      message: apiError.message,
    },
  }, apiError.status), requestId);
};

export const requireJson = async <T>(
  request: Request,
  parse: (value: unknown) => T,
): Promise<T> => {
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
    throw new ApiError(415, 'unsupported_media_type', 'נדרש גוף JSON.');
  }
  try {
    return parse(await request.json() as unknown);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, 'invalid_request', 'המידע שנשלח אינו תקין.');
  }
};

export const enforceSameOrigin = (request: Request): void => {
  if (request.headers.get('Origin') !== new URL(request.url).origin) {
    throw new ApiError(403, 'invalid_origin', 'מקור הבקשה אינו מורשה.');
  }
};
