import { publicSiteDocumentSchema } from '@monorepo/content-schema';
import { z } from 'zod';

import { StudioApiError, studioApiRequest } from './client';

const sessionSchema = z.object({
  admin: z.object({ displayName: z.string().min(1), email: z.string().email() }).strict(),
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
}).strict();
const mediaResponseSchema = z.object({ media: z.array(mediaAssetSchema) }).strict();

export type ContentRevisionDto = z.infer<typeof revisionSchema>;
export type MediaAssetDto = z.infer<typeof mediaAssetSchema>;
export type StudioServerSession = z.infer<typeof sessionSchema>;

const jsonBody = (body: unknown) => ({
  body: JSON.stringify(body),
  headers: { 'Content-Type': 'application/json' },
});

export const studioApi = {
  exchangeGoogleCredential: (credential: string, signal?: AbortSignal) => studioApiRequest({
    ...jsonBody({ credential }), method: 'POST', path: '/api/auth/google', schema: sessionSchema, signal,
  }),
  listMedia: (signal?: AbortSignal) => studioApiRequest({ path: '/api/media', schema: mediaResponseSchema, signal }),
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
  saveDraft: (input: {
    readonly content: z.infer<typeof publicSiteDocumentSchema>;
    readonly expectedVersion: number | null;
  }, signal?: AbortSignal) => studioApiRequest({
    ...jsonBody(input), method: 'PUT', path: '/api/content/draft', schema: draftResponseSchema, signal,
  }),
} as const;
