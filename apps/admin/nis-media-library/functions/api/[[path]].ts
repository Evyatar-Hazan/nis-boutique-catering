import { z } from 'zod';

import { createAdmin, listAdmins, updateAdmin } from '../_lib/admins';
import {
  createSession,
  requireSession,
  revokeSession,
  verifyGoogleCredential,
} from '../_lib/auth';
import {
  createDriveAuthorization,
  driveStatus,
  finishDriveAuthorization,
  listMedia,
  readMedia,
  updateMedia,
  uploadMedia,
} from '../_lib/drive';
import {
  ApiError,
  apiHeaders,
  enforceSameOrigin,
  errorResponse,
  json,
  type Principal,
  requireJson,
} from '../_lib/http';

type Method = 'DELETE' | 'GET' | 'PATCH' | 'POST';
interface Route {
  readonly authenticated?: boolean;
  readonly handler: (context: {
    readonly environment: Env;
    readonly principal: Principal | null;
    readonly request: Request;
  }) => Promise<Response>;
  readonly method: Method;
  readonly mutation?: boolean;
  readonly path: string;
}

const googleLoginSchema = z.object({
  credential: z.string().min(1).max(16_384),
}).strict();
const adminCreateSchema = z.object({
  displayName: z.string().trim().min(1).max(180),
  email: z.string().trim().email().max(320),
}).strict();
const adminUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(180).optional(),
  id: z.string().min(1).max(120),
  isActive: z.boolean().optional(),
}).strict();
const mediaUpdateSchema = z.object({
  description: z.string().trim().min(1).max(500).optional(),
  id: z.string().min(1).max(200),
  trashed: z.boolean().optional(),
}).strict();

const routes: readonly Route[] = [
  {
    method: 'GET',
    path: '/api/health',
    handler: async ({ environment }) => {
      await environment.DB.prepare('SELECT 1 AS ok').first();
      return json({ database: 'ready', status: 'ok' });
    },
  },
  {
    method: 'POST',
    mutation: true,
    path: '/api/auth/google',
    handler: async ({ environment, request }) => {
      const input = await requireJson(request, (value) => googleLoginSchema.parse(value));
      const session = await createSession(
        environment.DB,
        await verifyGoogleCredential(input.credential, environment.GOOGLE_CLIENT_ID),
      );
      return json({
        admin: {
          displayName: session.principal.displayName,
          email: session.principal.email,
          id: session.principal.adminId,
        },
      }, 200, { 'Set-Cookie': session.cookie });
    },
  },
  {
    authenticated: true,
    method: 'GET',
    path: '/api/auth/session',
    handler: async ({ principal }) => json({
      admin: {
        displayName: principal?.displayName,
        email: principal?.email,
        id: principal?.adminId,
      },
    }),
  },
  {
    method: 'POST',
    mutation: true,
    path: '/api/auth/logout',
    handler: async ({ environment, request }) =>
      json({ status: 'signed_out' }, 200, {
        'Set-Cookie': await revokeSession(request, environment.DB),
      }),
  },
  {
    authenticated: true,
    method: 'GET',
    path: '/api/admins',
    handler: async ({ environment }) => json({ admins: await listAdmins(environment.DB) }),
  },
  {
    authenticated: true,
    method: 'POST',
    mutation: true,
    path: '/api/admins',
    handler: async ({ environment, request }) => {
      const input = await requireJson(request, (value) => adminCreateSchema.parse(value));
      return json({ admin: await createAdmin(environment.DB, input) }, 201);
    },
  },
  {
    authenticated: true,
    method: 'PATCH',
    mutation: true,
    path: '/api/admins',
    handler: async ({ environment, principal, request }) => {
      const input = await requireJson(request, (value) => adminUpdateSchema.parse(value));
      if (!principal) throw new ApiError(401, 'authentication_required', 'נדרשת כניסה.');
      return json({ admin: await updateAdmin(environment.DB, principal, input) });
    },
  },
  {
    authenticated: true,
    method: 'GET',
    path: '/api/drive/status',
    handler: async ({ environment }) => json({ drive: await driveStatus(environment) }),
  },
  {
    authenticated: true,
    method: 'POST',
    mutation: true,
    path: '/api/drive/connect',
    handler: async ({ environment, principal, request }) => {
      if (!principal) throw new ApiError(401, 'authentication_required', 'נדרשת כניסה.');
      return json({
        authorizationUrl: await createDriveAuthorization(request, environment, principal),
      });
    },
  },
  {
    method: 'GET',
    path: '/api/drive/callback',
    handler: async ({ environment, request }) => {
      await finishDriveAuthorization(request, environment);
      return Response.redirect(`${new URL(request.url).origin}/?drive=connected`, 303);
    },
  },
  {
    authenticated: true,
    method: 'GET',
    path: '/api/media',
    handler: async ({ environment, request }) => json({
      media: await listMedia(
        environment,
        new URL(request.url).searchParams.get('trashed') === 'true',
      ),
    }),
  },
  {
    authenticated: true,
    method: 'GET',
    path: '/api/media/file',
    handler: async ({ environment, request }) => {
      const id = new URL(request.url).searchParams.get('id')?.trim();
      if (!id) throw new ApiError(400, 'media_id_required', 'חסר מזהה תמונה.');
      return readMedia(environment, id);
    },
  },
  {
    authenticated: true,
    method: 'POST',
    mutation: true,
    path: '/api/media',
    handler: async ({ environment, principal, request }) => {
      if (!principal) throw new ApiError(401, 'authentication_required', 'נדרשת כניסה.');
      return json({ media: await uploadMedia(request, environment, principal) }, 201);
    },
  },
  {
    authenticated: true,
    method: 'PATCH',
    mutation: true,
    path: '/api/media',
    handler: async ({ environment, principal, request }) => {
      if (!principal) throw new ApiError(401, 'authentication_required', 'נדרשת כניסה.');
      const input = await requireJson(request, (value) => mediaUpdateSchema.parse(value));
      return json({ media: await updateMedia(environment, principal, input) });
    },
  },
];

export const onRequest: PagesFunction<Env> = async ({ env, request }) => {
  const requestId = crypto.randomUUID();
  try {
    const pathname = new URL(request.url).pathname;
    const matchingPath = routes.filter((route) => route.path === pathname);
    if (matchingPath.length === 0) {
      throw new ApiError(404, 'not_found', 'הנתיב לא נמצא.');
    }
    const route = matchingPath.find((candidate) => candidate.method === request.method);
    if (!route) throw new ApiError(405, 'method_not_allowed', 'הפעולה אינה נתמכת.');
    if (route.mutation) enforceSameOrigin(request);
    const principal = route.authenticated ? await requireSession(request, env.DB) : null;
    return apiHeaders(await route.handler({ environment: env, principal, request }), requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
};
