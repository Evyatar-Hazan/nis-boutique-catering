import { requireAdminSession } from "../auth/session";
import { ApiError } from "../http/errors";
import type {
  ApiGuard,
  ApiSecurityPolicy,
} from "../http/types";
import { enforceRateLimit } from "./rateLimit";

const jsonContentTypes = ["application/json"] as const;

export const apiSecurityPolicies = {
  adminRead: {
    authenticated: true,
  },
  adminMutation: {
    allowedContentTypes: jsonContentTypes,
    authenticated: true,
    maxBodyBytes: 1024 * 1024,
    sameOrigin: true,
  },
  login: {
    allowedContentTypes: jsonContentTypes,
    maxBodyBytes: 16 * 1024,
    rateLimit: { limit: 10, scope: "login", windowSeconds: 5 * 60 },
    sameOrigin: true,
  },
  logout: {
    sameOrigin: true,
  },
  publish: {
    allowedContentTypes: jsonContentTypes,
    authenticated: true,
    maxBodyBytes: 32 * 1024,
    rateLimit: { limit: 10, scope: "publish", windowSeconds: 60 * 60 },
    sameOrigin: true,
  },
  upload: {
    allowedContentTypes: [
      "image/avif",
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/webm",
    ],
    authenticated: true,
    maxBodyBytes: 12 * 1024 * 1024,
    rateLimit: { limit: 30, scope: "upload", windowSeconds: 60 * 60 },
    requireContentLength: true,
    sameOrigin: true,
  },
} as const satisfies Record<string, ApiSecurityPolicy>;

const enforceSameOrigin = (request: Request): void => {
  const origin = request.headers.get("Origin");
  const expectedOrigin = new URL(request.url).origin;
  if (origin !== expectedOrigin) {
    throw new ApiError(403, "invalid_origin", "Request origin is not allowed.");
  }
};

const enforceContentType = (
  request: Request,
  allowedContentTypes: readonly string[],
): void => {
  const contentType = request.headers
    .get("Content-Type")
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase();
  if (!contentType || !allowedContentTypes.includes(contentType)) {
    throw new ApiError(415, "unsupported_media_type", "Content-Type is not allowed.");
  }
};

const enforceBodySize = async (
  request: Request,
  maxBodyBytes: number,
  requireContentLength: boolean,
): Promise<void> => {
  const contentLength = request.headers.get("Content-Length");
  if (contentLength && /^\d+$/u.test(contentLength)) {
    const bodyBytes = Number(contentLength);
    if (bodyBytes === 0 || bodyBytes > maxBodyBytes) {
      throw new ApiError(413, "payload_too_large", "Request body is too large.");
    }
    return;
  }

  if (requireContentLength) {
    throw new ApiError(411, "length_required", "Content-Length is required.");
  }

  const reader = request.clone().body?.getReader();
  if (!reader) {
    return;
  }

  let totalBytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) {
        return;
      }
      totalBytes += chunk.value.byteLength;
      if (totalBytes > maxBodyBytes) {
        throw new ApiError(413, "payload_too_large", "Request body is too large.");
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
};

export const enforceAdminApiPolicy: ApiGuard<Env> = async (
  context,
  route,
) => {
  const policy = route.security;
  if (!policy) {
    return null;
  }

  if (policy.sameOrigin) {
    enforceSameOrigin(context.request);
  }
  if (policy.allowedContentTypes) {
    enforceContentType(context.request, policy.allowedContentTypes);
  }
  if (policy.maxBodyBytes !== undefined) {
    await enforceBodySize(
      context.request,
      policy.maxBodyBytes,
      policy.requireContentLength ?? false,
    );
  }
  if (policy.rateLimit) {
    await enforceRateLimit(context.request, context.env.DB, policy.rateLimit);
  }
  if (policy.authenticated) {
    return requireAdminSession(context.request, context.env.DB);
  }

  return null;
};
