export interface OperationalEvent {
  readonly attemptCount?: number;
  readonly durationMs?: number;
  readonly errorCode?: string;
  readonly event: "api_request" | "publish_job";
  readonly jobId?: string;
  readonly method?: string;
  readonly operation?: string;
  readonly path?: string;
  readonly requestId: string;
  readonly revisionId?: string;
  readonly status: number | string;
}

export type OperationalEventWriter = (event: OperationalEvent) => void;

export const writeOperationalEvent: OperationalEventWriter = (event) => {
  console.info(JSON.stringify({
    ...event,
    timestamp: new Date().toISOString(),
  }));
};
