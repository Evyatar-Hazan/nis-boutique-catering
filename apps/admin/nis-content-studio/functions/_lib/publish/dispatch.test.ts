import { describe, expect, it, vi } from "vitest";

import { ApiError } from "../http/errors";
import { dispatchPublishWorkflow } from "./dispatch";
import type { PublishJob } from "./types";

const job: PublishJob = {
  attemptCount: 1,
  completedAt: null,
  createdAt: 1_000,
  errorMessage: null,
  githubRunId: null,
  id: "10000000-0000-4000-8000-000000000001",
  idempotencyKey: "publish:test:1",
  operation: "publish",
  requestedBy: "admin-1",
  revisionId: "20000000-0000-4000-8000-000000000002",
  sourceRevisionId: null,
  status: "deploying",
  updatedAt: 1_000,
};

const config = {
  repositoryName: "nis-boutique-catering",
  repositoryOwner: "Evyatar-Hazan",
  token: "server-secret-token",
  workflowFile: "cloudflare-pages.yml",
};

describe("GitHub workflow dispatch", () => {
  it("sends the server token only in the GitHub authorization header", async () => {
    let capturedInit: RequestInit | undefined;
    let capturedUrl: RequestInfo | URL | undefined;
    const dispatchFetch = vi.fn(async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      capturedInit = init;
      capturedUrl = input;
      return new Response(null, { status: 204 });
    });

    await dispatchPublishWorkflow(config, job, dispatchFetch);

    expect(dispatchFetch).toHaveBeenCalledOnce();
    expect(String(capturedUrl)).toContain("/actions/workflows/cloudflare-pages.yml/dispatches");
    expect(new Headers(capturedInit?.headers).get("Authorization")).toBe("Bearer server-secret-token");
    expect(capturedInit?.body).not.toContain("server-secret-token");
    expect(JSON.parse(String(capturedInit?.body))).toEqual({
      inputs: { source: `studio:publish:${job.id}` },
      ref: "main",
    });
  });

  it("fails closed without a configured server token", async () => {
    await expect(
      dispatchPublishWorkflow({ ...config, token: "" }, job),
    ).rejects.toMatchObject({
      code: "publish_dispatch_unconfigured",
      status: 503,
    } satisfies Partial<ApiError>);
  });

  it("normalizes GitHub failures without returning the response body", async () => {
    const dispatchFetch = vi.fn(async () =>
      new Response("sensitive upstream details", { status: 403 }));

    await expect(
      dispatchPublishWorkflow(config, job, dispatchFetch),
    ).rejects.toMatchObject({
      code: "publish_dispatch_failed",
      message: "GitHub workflow dispatch failed with status 403.",
      status: 502,
    } satisfies Partial<ApiError>);
  });
});
