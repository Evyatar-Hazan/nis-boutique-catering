import { readRevisionById } from "../content/revisions";
import { ApiError } from "../http/errors";
import { dispatchPublishWorkflow, type DispatchFetch } from "./dispatch";
import {
  markDispatchAttempt,
  publishDraftAtomically,
  readPublishJobById,
  readPublishJobByIdempotencyKey,
  recordDispatchResult,
  rollbackRevisionAtomically,
  validatePublishMedia,
} from "./repository";
import type { PublishJob, PublishResult } from "./types";

export interface PublishEnvironment {
  readonly DB: D1Database;
  readonly GITHUB_DISPATCH_TOKEN: string;
  readonly GITHUB_REPOSITORY_NAME: string;
  readonly GITHUB_REPOSITORY_OWNER: string;
  readonly GITHUB_WORKFLOW_FILE: string;
  readonly MEDIA: R2Bucket;
}

const dispatchJob = async (
  environment: PublishEnvironment,
  job: PublishJob,
  dispatchFetch?: DispatchFetch,
): Promise<PublishJob> => {
  const attempting = await markDispatchAttempt(environment.DB, job.id);
  try {
    await dispatchPublishWorkflow(
      {
        repositoryName: environment.GITHUB_REPOSITORY_NAME,
        repositoryOwner: environment.GITHUB_REPOSITORY_OWNER,
        token: environment.GITHUB_DISPATCH_TOKEN,
        workflowFile: environment.GITHUB_WORKFLOW_FILE,
      },
      attempting,
      dispatchFetch,
    );
    return recordDispatchResult(environment.DB, {
      jobId: job.id,
      succeeded: true,
    });
  } catch (error: unknown) {
    const message = error instanceof ApiError ? error.code : "publish_dispatch_failed";
    return recordDispatchResult(environment.DB, {
      errorMessage: message,
      jobId: job.id,
      succeeded: false,
    });
  }
};

export const publishDraft = async (
  environment: PublishEnvironment,
  input: {
    readonly adminId: string;
    readonly draftId: string;
    readonly expectedVersion: number;
    readonly idempotencyKey: string;
  },
  dispatchFetch?: DispatchFetch,
): Promise<PublishResult> => {
  const existingJob = await readPublishJobByIdempotencyKey(
    environment.DB,
    input.idempotencyKey,
  );
  if (existingJob) {
    const existingRevision = await readRevisionById(environment.DB, existingJob.revisionId);
    if (!existingRevision) {
      throw new ApiError(500, "publish_integrity_error", "Publish job revision is missing.");
    }
    return { job: existingJob, revision: existingRevision };
  }

  const draft = await readRevisionById(environment.DB, input.draftId);
  if (!draft || draft.status !== "draft") {
    throw new ApiError(404, "draft_not_found", "Draft revision was not found.");
  }
  if (draft.version !== input.expectedVersion) {
    throw new ApiError(409, "revision_conflict", "Draft changed before publish.");
  }
  await validatePublishMedia(environment.DB, environment.MEDIA, draft.content);
  const published = await publishDraftAtomically(environment.DB, {
    adminId: input.adminId,
    draft,
    idempotencyKey: input.idempotencyKey,
  });
  if (published.job.status !== "queued" || published.job.attemptCount !== 0) {
    return published;
  }
  return {
    job: await dispatchJob(environment, published.job, dispatchFetch),
    revision: published.revision,
  };
};

export const rollbackPublishedRevision = async (
  environment: PublishEnvironment,
  input: {
    readonly adminId: string;
    readonly idempotencyKey: string;
    readonly sourceRevisionId: string;
  },
  dispatchFetch?: DispatchFetch,
): Promise<PublishResult> => {
  const source = await readRevisionById(environment.DB, input.sourceRevisionId);
  if (!source || source.status !== "archived") {
    throw new ApiError(404, "rollback_revision_not_found", "Archived revision was not found.");
  }
  await validatePublishMedia(environment.DB, environment.MEDIA, source.content);
  const rollback = await rollbackRevisionAtomically(environment.DB, {
    adminId: input.adminId,
    idempotencyKey: input.idempotencyKey,
    source,
  });
  if (rollback.job.status !== "queued" || rollback.job.attemptCount !== 0) {
    return rollback;
  }
  return {
    job: await dispatchJob(environment, rollback.job, dispatchFetch),
    revision: rollback.revision,
  };
};

export const retryPublishDispatch = async (
  environment: PublishEnvironment,
  jobId: string,
  dispatchFetch?: DispatchFetch,
): Promise<PublishJob> => {
  const job = await readPublishJobById(environment.DB, jobId);
  if (!job) {
    throw new ApiError(404, "publish_job_not_found", "Publish job was not found.");
  }
  if (job.status !== "failed" && job.status !== "queued") {
    throw new ApiError(409, "publish_not_retryable", "Publish job is not retryable.");
  }
  return dispatchJob(environment, job, dispatchFetch);
};
