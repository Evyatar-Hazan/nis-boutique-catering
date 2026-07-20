import { ApiError } from "../http/errors";
import type { ApiRateLimitPolicy } from "../http/types";

interface RateLimitRow {
  readonly expires_at: number;
  readonly request_count: number;
}

const hashRateLimitKey = async (
  scope: ApiRateLimitPolicy["scope"],
  identifier: string,
): Promise<string> => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${scope}:${identifier}`),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const readClientIdentifier = (request: Request): string =>
  request.headers.get("CF-Connecting-IP") ??
  request.headers.get("X-Forwarded-For")?.split(",", 1)[0]?.trim() ??
  "unknown-client";

export const enforceRateLimit = async (
  request: Request,
  database: D1Database,
  policy: ApiRateLimitPolicy,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<void> => {
  const key = await hashRateLimitKey(policy.scope, readClientIdentifier(request));
  const expiresAt = nowSeconds + policy.windowSeconds;
  const row = await database
    .prepare(
      `INSERT INTO api_rate_limits
       (key, scope, request_count, window_started_at, expires_at, updated_at)
       VALUES (?1, ?2, 1, ?3, ?4, ?3)
       ON CONFLICT(key) DO UPDATE SET
         scope = excluded.scope,
         request_count = CASE
           WHEN api_rate_limits.expires_at <= ?3 THEN 1
           ELSE api_rate_limits.request_count + 1
         END,
         window_started_at = CASE
           WHEN api_rate_limits.expires_at <= ?3 THEN ?3
           ELSE api_rate_limits.window_started_at
         END,
         expires_at = CASE
           WHEN api_rate_limits.expires_at <= ?3 THEN ?4
           ELSE api_rate_limits.expires_at
         END,
         updated_at = ?3
       RETURNING request_count, expires_at`,
    )
    .bind(key, policy.scope, nowSeconds, expiresAt)
    .first<RateLimitRow>();

  if (!row) {
    throw new ApiError(500, "rate_limit_failed", "Could not enforce rate limit.");
  }

  if (row.request_count > policy.limit) {
    const retryAfter = Math.max(1, row.expires_at - nowSeconds);
    throw new ApiError(
      429,
      "rate_limit_exceeded",
      "Too many requests.",
      undefined,
      { "Retry-After": String(retryAfter) },
    );
  }
};
