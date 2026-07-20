import { describe, expect, it } from "vitest";
import { z } from "zod";

import { ApiError } from "./errors";
import { dispatchApiRequest } from "./router";
import type { ApiRoute } from "./types";
import { parseJsonBody } from "./validation";
import type { OperationalEvent } from "../observability/logging";

interface TestEnvironment {
  readonly label: string;
}

const environment: TestEnvironment = { label: "test" };

const okRoute: ApiRoute<TestEnvironment> = {
  method: "GET",
  path: "/api/example",
  handler: async ({ env }) => Response.json({ label: env.label }),
};

const parseErrorBody = async (response: Response) => {
  const payload: unknown = await response.json();
  return z
    .object({
      error: z.object({
        code: z.string(),
        message: z.string(),
        requestId: z.uuid(),
      }),
    })
    .parse(payload);
};

describe("dispatchApiRequest", () => {
  it("returns a typed 404 envelope with a request ID", async () => {
    const response = await dispatchApiRequest(
      new Request("https://example.com/api/missing"),
      environment,
      [okRoute],
    );

    expect(response.status).toBe(404);
    expect((await parseErrorBody(response)).error.code).toBe("not_found");
    expect(response.headers.get("X-Request-ID")).toBeTruthy();
    expect(response.headers.has("Access-Control-Allow-Origin")).toBe(false);
  });

  it("returns 405 and the allowed methods for a known path", async () => {
    const response = await dispatchApiRequest(
      new Request("https://example.com/api/example", { method: "POST" }),
      environment,
      [okRoute],
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET");
    expect((await parseErrorBody(response)).error.code).toBe(
      "method_not_allowed",
    );
  });

  it("hides unexpected errors behind a stable 500 envelope", async () => {
    const errorRoute: ApiRoute<TestEnvironment> = {
      method: "GET",
      path: "/api/error",
      handler: async () => {
        throw new Error("private implementation detail");
      },
    };

    const response = await dispatchApiRequest(
      new Request("https://example.com/api/error"),
      environment,
      [errorRoute],
    );
    const body = await parseErrorBody(response);

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("internal_error");
    expect(body.error.message).not.toContain("private implementation detail");
  });

  it("logs only allowlisted operational fields without request secrets or content", async () => {
    const events: OperationalEvent[] = [];
    const clock = [100, 112];
    const request = new Request(
      "https://example.com/api/example?token=query-secret",
      {
        headers: {
          Authorization: "Bearer header-secret",
          Cookie: "session=cookie-secret",
        },
      },
    );

    const response = await dispatchApiRequest(
      request,
      environment,
      [okRoute],
      undefined,
      {
        now: () => clock.shift() ?? 112,
        write: (event) => events.push(event),
      },
    );

    expect(response.status).toBe(200);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      durationMs: 12,
      event: "api_request",
      method: "GET",
      path: "/api/example",
      status: 200,
    });
    expect(events[0]?.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u,
    );

    const serialized = JSON.stringify(events);
    expect(serialized).not.toContain("query-secret");
    expect(serialized).not.toContain("header-secret");
    expect(serialized).not.toContain("cookie-secret");
    expect(serialized).not.toContain("token=");
  });
});

describe("parseJsonBody", () => {
  const schema = z.object({ name: z.string().min(1) });

  it("parses unknown JSON only through the supplied Zod schema", async () => {
    const request = new Request("https://example.com/api/example", {
      body: JSON.stringify({ name: "Nis" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    await expect(parseJsonBody(request, schema)).resolves.toEqual({ name: "Nis" });
  });

  it("rejects invalid bodies and unsupported content types", async () => {
    const invalidRequest = new Request("https://example.com/api/example", {
      body: JSON.stringify({ name: "" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const unsupportedRequest = new Request("https://example.com/api/example", {
      body: "name=Nis",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
    });

    await expect(parseJsonBody(invalidRequest, schema)).rejects.toMatchObject({
      code: "invalid_request",
      status: 400,
    } satisfies Partial<ApiError>);
    await expect(parseJsonBody(unsupportedRequest, schema)).rejects.toMatchObject({
      code: "unsupported_media_type",
      status: 415,
    } satisfies Partial<ApiError>);
  });

  it("rejects malformed JSON without leaking parser details", async () => {
    const malformedRequest = new Request("https://example.com/api/example", {
      body: '{"name":',
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    await expect(parseJsonBody(malformedRequest, schema)).rejects.toMatchObject({
      code: "invalid_json",
      message: "Request body is not valid JSON.",
      status: 400,
    } satisfies Partial<ApiError>);
  });
});
