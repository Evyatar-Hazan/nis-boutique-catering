import { z } from 'zod';

const sessionSchema = z.object({
  admin: z.object({
    displayName: z.string().min(1),
    email: z.string().email(),
  }).strict(),
  expiresAt: z.number().int().positive(),
}).strict();

export type StudioServerSession = z.infer<typeof sessionSchema>;

export class AuthApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'AuthApiError';
    this.code = code;
    this.status = status;
  }
}

const readError = async (response: Response) => {
  const payload: unknown = await response.json().catch(() => null);
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = payload.error;
    if (error && typeof error === 'object') {
      const code = 'code' in error && typeof error.code === 'string' ? error.code : 'request_failed';
      const message = 'message' in error && typeof error.message === 'string' ? error.message : 'בקשת ההתחברות נכשלה.';
      return new AuthApiError(response.status, code, message);
    }
  }
  return new AuthApiError(response.status, 'request_failed', 'בקשת ההתחברות נכשלה.');
};

const parseSession = async (response: Response) => {
  if (!response.ok) throw await readError(response);
  return sessionSchema.parse(await response.json() as unknown);
};

export const readServerSession = async (): Promise<StudioServerSession | null> => {
  const response = await fetch('/api/auth/session', {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  if (response.status === 401) return null;
  return parseSession(response);
};

export const exchangeGoogleCredential = async (credential: string) =>
  parseSession(await fetch('/api/auth/google', {
    body: JSON.stringify({ credential }),
    credentials: 'same-origin',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    method: 'POST',
  }));

export const logoutServerSession = async () => {
  const response = await fetch('/api/auth/logout', {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
    method: 'POST',
  });
  if (!response.ok) throw await readError(response);
};
