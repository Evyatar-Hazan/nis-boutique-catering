import { ApiError } from "../http/errors";
import type { PublishJob } from "./types";

export interface GitHubDispatchConfig {
  readonly repositoryName: string;
  readonly repositoryOwner: string;
  readonly token: string;
  readonly workflowFile: string;
}

export type DispatchFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export const dispatchPublishWorkflow = async (
  config: GitHubDispatchConfig,
  job: PublishJob,
  dispatchFetch: DispatchFetch = fetch,
): Promise<void> => {
  if (!config.token) {
    throw new ApiError(503, "publish_dispatch_unconfigured", "Publish dispatch is unavailable.");
  }

  const endpoint = `https://api.github.com/repos/${encodeURIComponent(config.repositoryOwner)}/${encodeURIComponent(config.repositoryName)}/actions/workflows/${encodeURIComponent(config.workflowFile)}/dispatches`;
  const response = await dispatchFetch(endpoint, {
    body: JSON.stringify({
      inputs: {
        source: `studio:${job.operation}:${job.id}`,
      },
      ref: "main",
    }),
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
      "User-Agent": "nis-content-studio",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    method: "POST",
  });
  if (response.status !== 204) {
    throw new ApiError(
      502,
      "publish_dispatch_failed",
      `GitHub workflow dispatch failed with status ${response.status}.`,
    );
  }
};
