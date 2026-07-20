import { z } from 'zod';

export type StudioApiErrorKind = 'auth' | 'conflict' | 'network' | 'rate-limit' | 'server' | 'validation';

export class StudioApiError extends Error {
  readonly code: string;
  readonly kind: StudioApiErrorKind;
  readonly retryAfterSeconds: number | null;
  readonly status: number;

  constructor(input: {
    readonly code: string;
    readonly kind: StudioApiErrorKind;
    readonly message: string;
    readonly retryAfterSeconds?: number | null;
    readonly status: number;
  }) {
    super(input.message);
    this.name = 'StudioApiError';
    this.code = input.code;
    this.kind = input.kind;
    this.retryAfterSeconds = input.retryAfterSeconds ?? null;
    this.status = input.status;
  }
}

const errorKind = (status: number): StudioApiErrorKind => {
  if (status === 401 || status === 403) return 'auth';
  if (status === 409) return 'conflict';
  if (status === 429) return 'rate-limit';
  if (status >= 500) return 'server';
  return 'validation';
};

const responseError = async (response: Response) => {
  const payload: unknown = await response.json().catch(() => null);
  let code = 'request_failed';
  let message = 'בקשת השרת נכשלה.';
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = payload.error;
    if (error && typeof error === 'object') {
      if ('code' in error && typeof error.code === 'string') code = error.code;
      if ('message' in error && typeof error.message === 'string') message = error.message;
    }
  }
  const retryAfter = Number(response.headers.get('Retry-After'));
  return new StudioApiError({
    code,
    kind: errorKind(response.status),
    message,
    retryAfterSeconds: Number.isFinite(retryAfter) ? retryAfter : null,
    status: response.status,
  });
};

const retryableStatus = new Set([408, 425, 429, 500, 502, 503, 504]);
const abortableDelay = (milliseconds: number, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
  const timeout = window.setTimeout(resolve, milliseconds);
  signal?.addEventListener('abort', () => {
    window.clearTimeout(timeout);
    reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
  }, { once: true });
});

export const studioApiRequest = async <Schema extends z.ZodType>(input: {
  readonly body?: BodyInit;
  readonly headers?: HeadersInit;
  readonly method?: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';
  readonly path: string;
  readonly retryDelayMs?: number;
  readonly schema: Schema;
  readonly signal?: AbortSignal;
}): Promise<z.infer<Schema>> => {
  const method = input.method ?? 'GET';
  const maxRetries = method === 'GET' ? 2 : 0;
  let attempt = 0;

  while (true) {
    try {
      const response = await fetch(input.path, {
        body: input.body,
        credentials: 'same-origin',
        headers: { Accept: 'application/json', ...input.headers },
        method,
        signal: input.signal,
      });
      if (response.ok) {
        try {
          return input.schema.parse(await response.json() as unknown);
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw new StudioApiError({
              code: 'invalid_response', kind: 'server', message: 'השרת החזיר מידע במבנה לא תקין.', status: 502,
            });
          }
          throw error;
        }
      }
      if (attempt >= maxRetries || !retryableStatus.has(response.status)) throw await responseError(response);
    } catch (error) {
      if (input.signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) throw error;
      if (error instanceof StudioApiError) throw error;
      if (attempt >= maxRetries) {
        throw new StudioApiError({
          code: 'network_error', kind: 'network', message: 'אין כרגע חיבור לשרת.', status: 0,
        });
      }
    }
    attempt += 1;
    await abortableDelay((input.retryDelayMs ?? 150) * attempt, input.signal);
  }
};
