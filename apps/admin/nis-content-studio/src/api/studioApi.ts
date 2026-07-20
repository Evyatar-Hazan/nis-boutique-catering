import { publicSiteDocumentSchema } from '@monorepo/content-schema';
import { z } from 'zod';

import { StudioApiError, studioApiRequest, studioApiUpload } from './client';

const sessionSchema = z.object({
  admin: z.object({ displayName: z.string().min(1), email: z.string().email(), id: z.string().min(1) }).strict(),
  expiresAt: z.number().int().positive(),
}).strict();
const revisionSchema = z.object({
  content: publicSiteDocumentSchema,
  createdAt: z.number().int(),
  createdBy: z.string().min(1),
  id: z.string().uuid(),
  publishedAt: z.number().int().nullable(),
  schemaVersion: z.literal(2),
  status: z.enum(['archived', 'draft', 'published']),
  updatedAt: z.number().int(),
  updatedBy: z.string().min(1),
  version: z.number().int().positive(),
}).strict();
const draftResponseSchema = z.object({ revision: revisionSchema.nullable() }).strict();
const mediaAssetSchema = z.object({
  altText: z.string(), createdAt: z.number().int(), createdBy: z.string().min(1),
  deletedAt: z.number().int().nullable(), height: z.number().int().positive().nullable(),
  id: z.string().min(1), mimeType: z.string().min(1), objectKey: z.string().min(1),
  originalFileName: z.string().min(1), sha256Hex: z.string().regex(/^[a-f0-9]{64}$/u),
  sizeBytes: z.number().int().positive(), updatedAt: z.number().int(), width: z.number().int().positive().nullable(),
  references: z.array(z.string().min(1)).default([]),
}).strict();
const mediaResponseSchema = z.object({ media: z.array(mediaAssetSchema) }).strict();
const mediaItemResponseSchema = z.object({ media: mediaAssetSchema }).strict();
const adminSchema = z.object({
  activeSessionCount: z.number().int().nonnegative(),
  createdAt: z.number().int(),
  displayName: z.string().min(1),
  email: z.string().email(),
  googleSubject: z.string().min(1).nullable(),
  id: z.string().min(1),
  isActive: z.boolean(),
  updatedAt: z.number().int(),
}).strict();
const adminsResponseSchema = z.object({ admins: z.array(adminSchema) }).strict();
const adminItemResponseSchema = z.object({ admin: adminSchema }).strict();
const publishJobSchema = z.object({
  attemptCount: z.number().int().nonnegative(),
  completedAt: z.number().int().nullable(),
  createdAt: z.number().int(),
  errorMessage: z.string().nullable(),
  githubRunId: z.string().nullable(),
  id: z.string().uuid(),
  idempotencyKey: z.string().min(8),
  operation: z.enum(['publish', 'rollback']),
  requestedBy: z.string().min(1),
  revisionId: z.string().uuid(),
  sourceRevisionId: z.string().uuid().nullable(),
  status: z.enum(['queued', 'dispatched', 'deploying', 'succeeded', 'failed']),
  updatedAt: z.number().int(),
}).strict();
const publishResultSchema = z.object({ job: publishJobSchema, revision: revisionSchema }).strict();
const publishHistorySchema = z.object({ jobs: z.array(publishJobSchema), revisions: z.array(revisionSchema) }).strict();

export type ContentRevisionDto = z.infer<typeof revisionSchema>;
export type MediaAssetDto = z.infer<typeof mediaAssetSchema>;
export type AdminDto = z.infer<typeof adminSchema>;
export type PublishHistoryDto = z.infer<typeof publishHistorySchema>;
export type PublishJobDto = z.infer<typeof publishJobSchema>;
export type StudioServerSession = z.infer<typeof sessionSchema>;

const jsonBody = (body: unknown) => ({
  body: JSON.stringify(body),
  headers: { 'Content-Type': 'application/json' },
});
const idempotentJsonBody = (body: unknown, idempotencyKey: string) => ({
  ...jsonBody(body),
  headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
});

const sha256Hex = async (file: File): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const imageDimensions = async (file: File): Promise<{ readonly height: number; readonly width: number } | null> => {
  if (!file.type.startsWith('image/')) return null;
  const bitmap = await createImageBitmap(file);
  const dimensions = { height: bitmap.height, width: bitmap.width };
  bitmap.close();
  return dimensions;
};

export const studioApi = {
  createAdmin: (input: { readonly displayName: string; readonly email: string }, signal?: AbortSignal) => studioApiRequest({
    ...jsonBody(input), method: 'POST', path: '/api/admins', schema: adminItemResponseSchema, signal,
  }),
  exchangeGoogleCredential: (credential: string, signal?: AbortSignal) => studioApiRequest({
    ...jsonBody({ credential }), method: 'POST', path: '/api/auth/google', schema: sessionSchema, signal,
  }),
  listMedia: (signal?: AbortSignal) => studioApiRequest({ path: '/api/media', schema: mediaResponseSchema, signal }),
  listAdmins: (signal?: AbortSignal) => studioApiRequest({ path: '/api/admins', schema: adminsResponseSchema, signal }),
  listPublishHistory: (signal?: AbortSignal) => studioApiRequest({ path: '/api/publish/history', schema: publishHistorySchema, signal }),
  mediaFileUrl: (id: string) => `/api/media/file?id=${encodeURIComponent(id)}`,
  logout: (signal?: AbortSignal) => studioApiRequest({
    method: 'POST', path: '/api/auth/logout', schema: z.object({ status: z.literal('signed_out') }).strict(), signal,
  }),
  readDraft: (signal?: AbortSignal) => studioApiRequest({ path: '/api/content/draft', schema: draftResponseSchema, signal }),
  readSession: async (signal?: AbortSignal): Promise<StudioServerSession | null> => {
    try {
      return await studioApiRequest({ path: '/api/auth/session', schema: sessionSchema, signal });
    } catch (error) {
      if (error instanceof StudioApiError && error.status === 401) return null;
      throw error;
    }
  },
  publishDraft: (input: { readonly draftId: string; readonly expectedVersion: number }, idempotencyKey: string, signal?: AbortSignal) => studioApiRequest({
    ...idempotentJsonBody(input, idempotencyKey), method: 'POST', path: '/api/publish', schema: publishResultSchema, signal,
  }),
  saveDraft: (input: {
    readonly content: z.infer<typeof publicSiteDocumentSchema>;
    readonly expectedVersion: number | null;
  }, signal?: AbortSignal) => studioApiRequest({
    ...jsonBody(input), method: 'PUT', path: '/api/content/draft', schema: draftResponseSchema, signal,
  }),
  retryPublish: (jobId: string, signal?: AbortSignal) => studioApiRequest({
    ...jsonBody({ jobId }), method: 'POST', path: '/api/publish/retry', schema: z.object({ job: publishJobSchema }).strict(), signal,
  }),
  rollbackPublish: (sourceRevisionId: string, idempotencyKey: string, signal?: AbortSignal) => studioApiRequest({
    ...idempotentJsonBody({ sourceRevisionId }, idempotencyKey), method: 'POST', path: '/api/publish/rollback', schema: publishResultSchema, signal,
  }),
  updateMedia: (input: { readonly altText?: string; readonly archived?: boolean; readonly id: string }, signal?: AbortSignal) => studioApiRequest({
    ...jsonBody(input), method: 'PATCH', path: '/api/media', schema: mediaItemResponseSchema, signal,
  }),
  updateAdmin: (input: { readonly displayName?: string; readonly id: string; readonly isActive?: boolean }, signal?: AbortSignal) => studioApiRequest({
    ...jsonBody(input), method: 'PATCH', path: '/api/admins', schema: adminItemResponseSchema, signal,
  }),
  uploadMedia: async (input: {
    readonly altText: string;
    readonly file: File;
    readonly onProgress?: (percentage: number) => void;
  }) => {
    const [checksum, dimensions] = await Promise.all([sha256Hex(input.file), imageDimensions(input.file)]);
    return studioApiUpload({
      body: input.file,
      headers: {
        'Content-Type': input.file.type,
        'X-Alt-Text-URI': encodeURIComponent(input.altText.trim()),
        'X-Content-SHA256': checksum,
        'X-File-Name-URI': encodeURIComponent(input.file.name),
        ...(dimensions ? {
          'X-Media-Height': String(dimensions.height),
          'X-Media-Width': String(dimensions.width),
        } : {}),
      },
      onProgress: input.onProgress,
      path: '/api/media',
      schema: mediaItemResponseSchema,
    });
  },
} as const;
