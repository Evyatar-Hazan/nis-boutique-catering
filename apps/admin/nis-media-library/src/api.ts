import { z } from 'zod';

const adminSessionSchema = z.object({
  admin: z.object({
    displayName: z.string().min(1),
    email: z.string().email(),
    id: z.string().min(1),
  }).strict(),
}).strict();
const adminSchema = z.object({
  createdAt: z.number().int(),
  displayName: z.string().min(1),
  email: z.string().email(),
  googleConnected: z.boolean(),
  id: z.string().min(1),
  isActive: z.boolean(),
  updatedAt: z.number().int(),
}).strict();
const mediaSchema = z.object({
  createdAt: z.string(),
  description: z.string(),
  height: z.number().int().positive().nullable(),
  id: z.string().min(1),
  mimeType: z.string().min(1),
  modifiedAt: z.string(),
  name: z.string().min(1),
  sizeBytes: z.number().nonnegative(),
  trashed: z.boolean(),
  webViewLink: z.string().url().nullable(),
  width: z.number().int().positive().nullable(),
}).strict();
const driveSchema = z.object({
  connected: z.boolean(),
  connectedEmail: z.string().email().nullable(),
  updatedAt: z.number().int().nullable(),
}).strict();

export type Admin = z.infer<typeof adminSchema>;
export type MediaItem = z.infer<typeof mediaSchema>;
export type Session = z.infer<typeof adminSessionSchema>;
export type DriveStatus = z.infer<typeof driveSchema>;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const request = async <T extends z.ZodType>(input: {
  readonly body?: unknown;
  readonly method?: 'GET' | 'PATCH' | 'POST';
  readonly path: string;
  readonly schema: T;
}): Promise<z.infer<T>> => {
  const response = await fetch(input.path, {
    ...(input.body === undefined ? {} : {
      body: JSON.stringify(input.body),
      headers: { 'Content-Type': 'application/json' },
    }),
    credentials: 'same-origin',
    method: input.method ?? 'GET',
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = payload && typeof payload === 'object' && 'error' in payload
      ? payload.error
      : null;
    const code = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
      ? error.code
      : 'request_failed';
    const message = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
      ? error.message
      : 'הבקשה נכשלה.';
    throw new ApiError(response.status, code, message);
  }
  return input.schema.parse(payload);
};

const upload = (
  file: File,
  description: string,
  onProgress: (value: number) => void,
): Promise<MediaItem> => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/media');
  xhr.responseType = 'json';
  xhr.withCredentials = true;
  xhr.setRequestHeader('Accept', 'application/json');
  xhr.setRequestHeader('Content-Type', file.type);
  xhr.setRequestHeader('X-Description-URI', encodeURIComponent(description));
  xhr.setRequestHeader('X-File-Name-URI', encodeURIComponent(file.name));
  xhr.upload.addEventListener('progress', (event) => {
    if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
  });
  xhr.addEventListener('error', () => reject(new ApiError(0, 'network_error', 'אין חיבור לשרת.')));
  xhr.addEventListener('load', () => {
    if (xhr.status < 200 || xhr.status >= 300) {
      const payload = xhr.response as { readonly error?: { readonly code?: string; readonly message?: string } } | null;
      reject(new ApiError(
        xhr.status,
        payload?.error?.code ?? 'upload_failed',
        payload?.error?.message ?? 'העלאת התמונה נכשלה.',
      ));
      return;
    }
    try {
      resolve(z.object({ media: mediaSchema }).parse(xhr.response).media);
    } catch {
      reject(new ApiError(502, 'invalid_response', 'השרת החזיר תשובה לא תקינה.'));
    }
  });
  xhr.send(file);
});

const json = (body: unknown) => ({ body, method: 'POST' as const });

export const api = {
  createAdmin: (input: { readonly displayName: string; readonly email: string }) =>
    request({ ...json(input), path: '/api/admins', schema: z.object({ admin: adminSchema }) }),
  connectDrive: () => request({
    ...json({}),
    path: '/api/drive/connect',
    schema: z.object({ authorizationUrl: z.string().url() }),
  }),
  driveStatus: () => request({
    path: '/api/drive/status',
    schema: z.object({ drive: driveSchema }),
  }).then(({ drive }) => drive),
  login: (credential: string) => request({
    ...json({ credential }),
    path: '/api/auth/google',
    schema: adminSessionSchema,
  }),
  logout: () => request({
    ...json({}),
    path: '/api/auth/logout',
    schema: z.object({ status: z.literal('signed_out') }),
  }),
  mediaFileUrl: (id: string) => `/api/media/file?id=${encodeURIComponent(id)}`,
  listAdmins: () => request({
    path: '/api/admins',
    schema: z.object({ admins: z.array(adminSchema) }),
  }).then(({ admins }) => admins),
  listMedia: (trashed = false) => request({
    path: `/api/media${trashed ? '?trashed=true' : ''}`,
    schema: z.object({ media: z.array(mediaSchema) }),
  }).then(({ media }) => media),
  readSession: async (): Promise<Session | null> => {
    try {
      return await request({ path: '/api/auth/session', schema: adminSessionSchema });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  },
  updateAdmin: (input: { readonly id: string; readonly isActive: boolean }) =>
    request({
      body: input,
      method: 'PATCH',
      path: '/api/admins',
      schema: z.object({ admin: adminSchema }),
    }),
  updateMedia: (input: { readonly description?: string; readonly id: string; readonly trashed?: boolean }) =>
    request({
      body: input,
      method: 'PATCH',
      path: '/api/media',
      schema: z.object({ media: mediaSchema }),
    }).then(({ media }) => media),
  upload,
};
