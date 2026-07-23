import { createRemoteJWKSet, jwtVerify } from 'jose';

import { sha256 } from './crypto';
import { ApiError, type Principal } from './http';

const googleJwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const cookieName = '__Host-nis_media_session';
const sessionSeconds = 8 * 60 * 60;

const randomToken = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
};

const readCookie = (request: Request, name: string): string | null => {
  for (const part of request.headers.get('Cookie')?.split(';') ?? []) {
    const [candidate, ...value] = part.trim().split('=');
    if (candidate === name) return value.join('=');
  }
  return null;
};

export const verifyGoogleCredential = async (
  credential: string,
  audience: string,
): Promise<{ readonly email: string; readonly subject: string }> => {
  try {
    const result = await jwtVerify(credential, googleJwks, {
      algorithms: ['RS256'],
      audience,
      issuer: ['accounts.google.com', 'https://accounts.google.com'],
    });
    const email = typeof result.payload.email === 'string'
      ? result.payload.email.trim().toLowerCase()
      : '';
    if (!email || result.payload.email_verified !== true || !result.payload.sub) {
      throw new Error('claims');
    }
    return { email, subject: result.payload.sub };
  } catch {
    throw new ApiError(401, 'invalid_google_token', 'אימות Google נכשל.');
  }
};

export const createSession = async (
  database: D1Database,
  identity: { readonly email: string; readonly subject: string },
): Promise<{ readonly cookie: string; readonly principal: Principal }> => {
  const admin = await database.prepare(
    `SELECT id, email, display_name, google_subject
     FROM admins WHERE email = ?1 AND is_active = 1`,
  ).bind(identity.email).first<{
    readonly display_name: string;
    readonly email: string;
    readonly google_subject: string | null;
    readonly id: string;
  }>();
  if (!admin || (admin.google_subject && admin.google_subject !== identity.subject)) {
    throw new ApiError(403, 'access_denied', 'החשבון אינו ברשימת המורשים.');
  }
  const now = Math.floor(Date.now() / 1000);
  if (!admin.google_subject) {
    await database.prepare(
      `UPDATE admins SET google_subject = ?1, updated_at = ?2
       WHERE id = ?3 AND google_subject IS NULL`,
    ).bind(identity.subject, now, admin.id).run();
  }
  const token = randomToken();
  const sessionId = crypto.randomUUID();
  const expiresAt = now + sessionSeconds;
  await database.prepare(
    `INSERT INTO admin_sessions
     (id, token_hash, admin_id, expires_at, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?5)`,
  ).bind(sessionId, await sha256(token), admin.id, expiresAt, now).run();
  return {
    cookie: `${cookieName}=${token}; Path=/; Max-Age=${sessionSeconds}; HttpOnly; Secure; SameSite=Lax`,
    principal: {
      adminId: admin.id,
      displayName: admin.display_name,
      email: admin.email,
      sessionId,
    },
  };
};

export const requireSession = async (request: Request, database: D1Database): Promise<Principal> => {
  const token = readCookie(request, cookieName);
  if (!token) throw new ApiError(401, 'authentication_required', 'נדרשת כניסה.');
  const now = Math.floor(Date.now() / 1000);
  const row = await database.prepare(
    `SELECT s.id AS session_id, a.id AS admin_id, a.email, a.display_name
     FROM admin_sessions s
     JOIN admins a ON a.id = s.admin_id
     WHERE s.token_hash = ?1 AND s.revoked_at IS NULL AND s.expires_at > ?2
       AND a.is_active = 1`,
  ).bind(await sha256(token), now).first<{
    readonly admin_id: string;
    readonly display_name: string;
    readonly email: string;
    readonly session_id: string;
  }>();
  if (!row) throw new ApiError(401, 'authentication_required', 'החיבור פג.');
  return {
    adminId: row.admin_id,
    displayName: row.display_name,
    email: row.email,
    sessionId: row.session_id,
  };
};

export const revokeSession = async (request: Request, database: D1Database): Promise<string> => {
  const token = readCookie(request, cookieName);
  if (token) {
    await database.prepare(
      `UPDATE admin_sessions SET revoked_at = unixepoch(), updated_at = unixepoch()
       WHERE token_hash = ?1 AND revoked_at IS NULL`,
    ).bind(await sha256(token)).run();
  }
  return `${cookieName}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
};
