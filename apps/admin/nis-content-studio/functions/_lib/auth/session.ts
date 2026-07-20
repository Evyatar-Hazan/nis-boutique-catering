import { ApiError } from "../http/errors";

export const adminSessionCookieName = "__Host-nis_admin_session";
const sessionDurationSeconds = 8 * 60 * 60;

interface AdminRow {
  readonly display_name: string;
  readonly email: string;
  readonly google_subject: string | null;
  readonly id: string;
}

interface SessionRow {
  readonly admin_id: string;
  readonly display_name: string;
  readonly email: string;
  readonly expires_at: number;
  readonly id: string;
}

export interface AdminSession {
  readonly adminId: string;
  readonly displayName: string;
  readonly email: string;
  readonly expiresAt: number;
  readonly sessionId: string;
}

const bytesToHex = (bytes: Uint8Array): string =>
  [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");

const bytesToBase64Url = (bytes: Uint8Array): string => {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
};

export const hashSessionToken = async (token: string): Promise<string> => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return bytesToHex(new Uint8Array(digest));
};

const createSessionToken = (): string => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
};

export const readCookie = (request: Request, name: string): string | null => {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(";")) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex < 0) {
      continue;
    }

    const cookieName = part.slice(0, separatorIndex).trim();
    if (cookieName === name) {
      return part.slice(separatorIndex + 1).trim();
    }
  }

  return null;
};

export const createSessionCookie = (
  token: string,
  maxAgeSeconds = sessionDurationSeconds,
): string =>
  `${adminSessionCookieName}=${token}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; Secure; SameSite=Strict`;

export const createExpiredSessionCookie = (): string =>
  createSessionCookie("", 0);

export const createAdminSession = async (
  database: D1Database,
  identity: { readonly email: string; readonly subject: string },
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<{ readonly cookie: string; readonly session: AdminSession }> => {
  const admin = await database
    .prepare(
      `SELECT id, email, google_subject, display_name
       FROM admins
       WHERE email = ?1 AND is_active = 1`,
    )
    .bind(identity.email)
    .first<AdminRow>();

  if (!admin || (admin.google_subject && admin.google_subject !== identity.subject)) {
    throw new ApiError(403, "admin_access_denied", "Admin access is denied.");
  }

  if (!admin.google_subject) {
    const update = await database
      .prepare(
        `UPDATE admins
         SET google_subject = ?1, updated_at = ?2
         WHERE id = ?3 AND google_subject IS NULL AND is_active = 1`,
      )
      .bind(identity.subject, nowSeconds, admin.id)
      .run();
    if (!update.success || update.meta.changes !== 1) {
      throw new ApiError(409, "admin_identity_conflict", "Admin identity changed.");
    }
  }

  const token = createSessionToken();
  const tokenHash = await hashSessionToken(token);
  const sessionId = crypto.randomUUID();
  const expiresAt = nowSeconds + sessionDurationSeconds;
  const insertion = await database
    .prepare(
      `INSERT INTO admin_sessions
       (id, token_hash, admin_id, expires_at, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?5)`,
    )
    .bind(sessionId, tokenHash, admin.id, expiresAt, nowSeconds)
    .run();
  if (!insertion.success || insertion.meta.changes !== 1) {
    throw new ApiError(500, "session_creation_failed", "Could not create session.");
  }

  return {
    cookie: createSessionCookie(token),
    session: {
      adminId: admin.id,
      displayName: admin.display_name,
      email: admin.email,
      expiresAt,
      sessionId,
    },
  };
};

export const requireAdminSession = async (
  request: Request,
  database: D1Database,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<AdminSession> => {
  const token = readCookie(request, adminSessionCookieName);
  if (!token) {
    throw new ApiError(401, "authentication_required", "Authentication is required.");
  }

  const tokenHash = await hashSessionToken(token);
  const row = await database
    .prepare(
      `SELECT sessions.id, sessions.admin_id, sessions.expires_at,
              admins.email, admins.display_name
       FROM admin_sessions AS sessions
       INNER JOIN admins ON admins.id = sessions.admin_id
       WHERE sessions.token_hash = ?1
         AND sessions.revoked_at IS NULL
         AND sessions.expires_at > ?2
         AND admins.is_active = 1`,
    )
    .bind(tokenHash, nowSeconds)
    .first<SessionRow>();

  if (!row) {
    throw new ApiError(401, "invalid_session", "Session is invalid or expired.");
  }

  return {
    adminId: row.admin_id,
    displayName: row.display_name,
    email: row.email,
    expiresAt: row.expires_at,
    sessionId: row.id,
  };
};

export const revokeAdminSession = async (
  request: Request,
  database: D1Database,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<void> => {
  const token = readCookie(request, adminSessionCookieName);
  if (!token) {
    return;
  }

  const tokenHash = await hashSessionToken(token);
  await database
    .prepare(
      `UPDATE admin_sessions
       SET revoked_at = COALESCE(revoked_at, ?1), updated_at = ?1
       WHERE token_hash = ?2`,
    )
    .bind(nowSeconds, tokenHash)
    .run();
};
