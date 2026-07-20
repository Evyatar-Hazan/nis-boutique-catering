import type { ZodType } from "zod";

import { ApiError } from "./errors";

export const parseJsonBody = async <Output>(
  request: Request,
  schema: ZodType<Output>,
): Promise<Output> => {
  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new ApiError(
      415,
      "unsupported_media_type",
      "Content-Type must be application/json.",
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    throw new ApiError(400, "invalid_json", "Request body is not valid JSON.");
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new ApiError(
      400,
      "invalid_request",
      "Request body failed validation.",
      result.error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path.join("."),
      })),
    );
  }

  return result.data;
};
