export interface ApiErrorDetail {
  readonly message: string;
  readonly path: string;
}

export class ApiError extends Error {
  readonly code: string;
  readonly details: readonly ApiErrorDetail[] | undefined;
  readonly headers: HeadersInit | undefined;
  readonly status: number;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: readonly ApiErrorDetail[],
    headers?: HeadersInit,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.headers = headers;
  }
}

export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  return new ApiError(500, "internal_error", "An unexpected error occurred.");
};
