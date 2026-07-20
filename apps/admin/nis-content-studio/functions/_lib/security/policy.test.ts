import { beforeEach, describe, expect, it } from "vitest";

import { ApiError } from "../http/errors";
import type { ApiRoute } from "../http/types";
import { apiSecurityPolicies, enforceAdminApiPolicy } from "./policy";

class SecurityDatabase {
  requestCount = 0;

  prepare(query: string): D1PreparedStatement {
    const state = { database: this };
    return {
      bind() {
        return {
          async first<Result>() {
            if (query.includes("INSERT INTO api_rate_limits")) {
              state.database.requestCount += 1;
              return {
                expires_at: 2_000,
                request_count: state.database.requestCount,
              } as Result;
            }

            if (query.includes("FROM admin_sessions")) {
              return null;
            }

            throw new Error(`Unexpected query: ${query}`);
          },
        } as D1PreparedStatement;
      },
    } as D1PreparedStatement;
  }
}

const asD1Database = (database: SecurityDatabase): D1Database =>
  database as unknown as D1Database;

const testRoute = (security: ApiRoute<Env>["security"]): ApiRoute<Env> => ({
  handler: async () => new Response(null),
  method: "POST",
  path: "/api/test",
  security,
});

const context = (request: Request, database: SecurityDatabase) => ({
  env: { DB: asD1Database(database) } as Env,
  request,
  requestId: "request-1",
});

describe("enforceAdminApiPolicy", () => {
  let database: SecurityDatabase;

  beforeEach(() => {
    database = new SecurityDatabase();
  });

  it("returns 401 when an authenticated route has no valid session", async () => {
    const request = new Request("https://studio.example/api/test");

    await expect(
      enforceAdminApiPolicy(
        context(request, database),
        testRoute(apiSecurityPolicies.adminRead),
      ),
    ).rejects.toMatchObject({
      code: "authentication_required",
      status: 401,
    } satisfies Partial<ApiError>);
  });

  it("returns 403 for a cross-origin mutation", async () => {
    const request = new Request("https://studio.example/api/test", {
      headers: {
        "Content-Type": "application/json",
        Origin: "https://attacker.example",
      },
      method: "POST",
      body: "{}",
    });

    await expect(
      enforceAdminApiPolicy(
        context(request, database),
        testRoute(apiSecurityPolicies.login),
      ),
    ).rejects.toMatchObject({ code: "invalid_origin", status: 403 } satisfies Partial<ApiError>);
  });

  it("returns 413 before reading an oversized body", async () => {
    const request = new Request("https://studio.example/api/test", {
      headers: {
        "Content-Length": String(20 * 1024),
        "Content-Type": "application/json",
        Origin: "https://studio.example",
      },
      method: "POST",
    });

    await expect(
      enforceAdminApiPolicy(
        context(request, database),
        testRoute(apiSecurityPolicies.login),
      ),
    ).rejects.toMatchObject({
      code: "payload_too_large",
      status: 413,
    } satisfies Partial<ApiError>);
  });

  it("returns 415 for an unsupported content type", async () => {
    const request = new Request("https://studio.example/api/test", {
      headers: {
        "Content-Type": "text/plain",
        Origin: "https://studio.example",
      },
      method: "POST",
      body: "credential",
    });

    await expect(
      enforceAdminApiPolicy(
        context(request, database),
        testRoute(apiSecurityPolicies.login),
      ),
    ).rejects.toMatchObject({
      code: "unsupported_media_type",
      status: 415,
    } satisfies Partial<ApiError>);
  });

  it("requires Content-Length before accepting a streaming upload", async () => {
    const request = new Request("https://studio.example/api/test", {
      headers: {
        "Content-Type": "image/webp",
        Origin: "https://studio.example",
      },
      method: "POST",
      body: "image-bytes",
    });

    await expect(
      enforceAdminApiPolicy(
        context(request, database),
        testRoute(apiSecurityPolicies.upload),
      ),
    ).rejects.toMatchObject({
      code: "length_required",
      status: 411,
    } satisfies Partial<ApiError>);
  });

  it("returns 429 with Retry-After when the login window is exhausted", async () => {
    const request = new Request("https://studio.example/api/test", {
      headers: {
        "Content-Type": "application/json",
        Origin: "https://studio.example",
      },
      method: "POST",
      body: "{}",
    });
    const route = testRoute(apiSecurityPolicies.login);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await expect(
        enforceAdminApiPolicy(context(request, database), route),
      ).resolves.toBeNull();
    }

    const rejection = await enforceAdminApiPolicy(
      context(request, database),
      route,
    ).catch((error: unknown) => error);
    expect(rejection).toMatchObject({
      code: "rate_limit_exceeded",
      status: 429,
    } satisfies Partial<ApiError>);
    expect(new Headers((rejection as ApiError).headers).get("Retry-After")).toBeTruthy();
  });

  it("defines bounded upload and publish controls for their future routes", () => {
    expect(apiSecurityPolicies.upload).toMatchObject({
      authenticated: true,
      maxBodyBytes: 12 * 1024 * 1024,
      sameOrigin: true,
    });
    expect(apiSecurityPolicies.publish).toMatchObject({
      authenticated: true,
      maxBodyBytes: 32 * 1024,
      sameOrigin: true,
    });
  });
});
