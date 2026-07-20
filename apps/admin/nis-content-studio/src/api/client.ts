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

const readErrorPayload = (payload: unknown): { readonly code: string; readonly message: string } => {
  let code = 'request_failed';
  let message = 'בקשת השרת נכשלה.';
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = payload.error;
    if (error && typeof error === 'object') {
      if ('code' in error && typeof error.code === 'string') code = error.code;
      if ('message' in error && typeof error.message === 'string') message = error.message;
    }
  }
  return { code, message };
};

const responseError = async (response: Response) => {
  const payload: unknown = await response.json().catch(() => null);
  const { code, message } = readErrorPayload(payload);
  const retryAfter = Number(response.headers.get('Retry-After'));
  return new StudioApiError({
    code,
    kind: errorKind(response.status),
    message,
    retryAfterSeconds: Number.isFinite(retryAfter) ? retryAfter : null,
    status: response.status,
  });
};

const xhrResponseError = (request: XMLHttpRequest) => {
  const payload: unknown = request.response;
  const { code, message } = readErrorPayload(payload);
  const retryAfter = Number(request.getResponseHeader('Retry-After'));
  return new StudioApiError({
    code,
    kind: errorKind(request.status),
    message,
    retryAfterSeconds: Number.isFinite(retryAfter) ? retryAfter : null,
    status: request.status,
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

export const studioApiUpload = <Schema extends z.ZodType>(input: {
  readonly body: Blob;
  readonly headers: Readonly<Record<string, string>>;
  readonly onProgress?: (percentage: number) => void;
  readonly path: string;
  readonly schema: Schema;
}): Promise<z.infer<Schema>> => new Promise((resolve, reject) => {
  const request = new XMLHttpRequest();
  request.open('POST', input.path);
  request.responseType = 'json';
  request.withCredentials = true;
  request.setRequestHeader('Accept', 'application/json');
  for (const [name, value] of Object.entries(input.headers)) request.setRequestHeader(name, value);
  request.upload.addEventListener('progress', (event) => {
    if (event.lengthComputable) input.onProgress?.(Math.round((event.loaded / event.total) * 100));
  });
  request.addEventListener('error', () => reject(new StudioApiError({
    code: 'network_error', kind: 'network', message: 'אין כרגע חיבור לשרת.', status: 0,
  })));
  request.addEventListener('load', () => {
    if (request.status < 200 || request.status >= 300) {
      reject(xhrResponseError(request));
      return;
    }
    try {
      resolve(input.schema.parse(request.response));
    } catch (error) {
      reject(error instanceof z.ZodError
        ? new StudioApiError({ code: 'invalid_response', kind: 'server', message: 'השרת החזיר מידע במבנה לא תקין.', status: 502 })
        : error);
    }
  });
  request.send(input.body);
});
