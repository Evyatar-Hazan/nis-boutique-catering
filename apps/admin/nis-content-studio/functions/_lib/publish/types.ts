import type { ContentRevision } from "../content/revisions";

export type PublishOperation = "publish" | "rollback";
export type PublishJobStatus =
  | "queued"
  | "dispatched"
  | "deploying"
  | "succeeded"
  | "failed";

export interface PublishJob {
  readonly attemptCount: number;
  readonly completedAt: number | null;
  readonly createdAt: number;
  readonly errorMessage: string | null;
  readonly githubRunId: string | null;
  readonly id: string;
  readonly idempotencyKey: string;
  readonly operation: PublishOperation;
  readonly requestedBy: string;
  readonly revisionId: string;
  readonly sourceRevisionId: string | null;
  readonly status: PublishJobStatus;
  readonly updatedAt: number;
}

export interface PublishResult {
  readonly job: PublishJob;
  readonly revision: ContentRevision;
}
