import { beforeEach, describe, expect, it } from "vitest";

import { ApiError } from "../http/errors";
import {
  adminSessionCookieName,
  createAdminSession,
  createSessionCookie,
  hashSessionToken,
  requireAdminSession,
  revokeAdminSession,
} from "./session";

interface TestAdmin {
  readonly display_name: string;
  readonly email: string;
  google_subject: string | null;
  readonly id: string;
  is_active: number;
}

interface TestSession {
  readonly admin_id: string;
  readonly expires_at: number;
  readonly id: string;
  revoked_at: number | null;
  readonly token_hash: string;
}

class TestDatabase {
  readonly admin: TestAdmin = {
    display_name: "Owner",
    email: "owner@example.com",
    google_subject: null,
    id: "admin-1",
    is_active: 1,
  };

  readonly sessions: TestSession[] = [];

  prepare = (query: string): D1PreparedStatement => {
    const state = { admin: this.admin, sessions: this.sessions };
    return {
      bind(...values: unknown[]) {
        return {
          async first<Result>() {
            if (query.includes("FROM admins")) {
              const [email] = values;
              return (
                state.admin.email === email && state.admin.is_active === 1
                  ? state.admin
                  : null
              ) as Result | null;
            }

            if (query.includes("FROM admin_sessions")) {
              const [tokenHash, nowSeconds] = values as [string, number];
              const session = state.sessions.find(
                (candidate) =>
                  candidate.token_hash === tokenHash &&
                  candidate.revoked_at === null &&
                  candidate.expires_at > nowSeconds,
              );
              if (!session || state.admin.is_active !== 1) {
                return null;
              }

              return {
                admin_id: session.admin_id,
                display_name: state.admin.display_name,
                email: state.admin.email,
                expires_at: session.expires_at,
                id: session.id,
              } as Result;
            }

            return null;
          },
          async run() {
            if (query.includes("UPDATE admins")) {
              const [subject] = values as [string];
              if (state.admin.google_subject !== null || state.admin.is_active !== 1) {
                return { meta: { changes: 0 }, success: true };
              }
              state.admin.google_subject = subject;
              return { meta: { changes: 1 }, success: true };
            }

            if (query.includes("INSERT INTO admin_sessions")) {
              const [id, tokenHash, adminId, expiresAt] = values as [
                string,
                string,
                string,
                number,
              ];
              state.sessions.push({
                admin_id: adminId,
                expires_at: expiresAt,
                id,
                revoked_at: null,
                token_hash: tokenHash,
              });
              return { meta: { changes: 1 }, success: true };
            }

            if (query.includes("UPDATE admin_sessions")) {
              const [revokedAt, tokenHash] = values as [number, string];
              const session = state.sessions.find(
                (candidate) => candidate.token_hash === tokenHash,
              );
              if (session && session.revoked_at === null) {
                session.revoked_at = revokedAt;
              }
              return { meta: { changes: session ? 1 : 0 }, success: true };
            }

            throw new Error(`Unexpected query: ${query}`);
          },
        } as D1PreparedStatement;
      },
    } as D1PreparedStatement;
  };
}

const requestWithCookie = (cookie: string): Request =>
  new Request("https://studio.example/api/auth/session", {
    headers: { Cookie: cookie.split(";", 1)[0] ?? "" },
  });

const asD1Database = (database: TestDatabase): D1Database =>
  database as unknown as D1Database;

describe("admin sessions", () => {
  let database: TestDatabase;

  beforeEach(() => {
    database = new TestDatabase();
  });

  it("creates only a hashed server session and a hardened cookie", async () => {
    const result = await createAdminSession(
      asD1Database(database),
      { email: database.admin.email, subject: "subject-1" },
      1_000,
    );

    expect(result.cookie).toContain(`${adminSessionCookieName}=`);
    expect(result.cookie).toContain("HttpOnly");
    expect(result.cookie).toContain("Secure");
    expect(result.cookie).toContain("SameSite=Strict");
    expect(result.cookie).toContain("Path=/");
    expect(database.sessions[0]?.token_hash).toHaveLength(64);
    expect(result.cookie).not.toContain(database.sessions[0]?.token_hash ?? "missing");
    expect(database.admin.google_subject).toBe("subject-1");
  });

  it("rejects an inactive admin before creating a session", async () => {
    database.admin.is_active = 0;

    await expect(
      createAdminSession(
        asD1Database(database),
        { email: database.admin.email, subject: "subject-1" },
        1_000,
      ),
    ).rejects.toMatchObject({
      code: "admin_access_denied",
      status: 403,
    } satisfies Partial<ApiError>);
  });

  it("rejects expired, revoked, reused and disabled sessions", async () => {
    const { cookie } = await createAdminSession(
      asD1Database(database),
      { email: database.admin.email, subject: "subject-1" },
      1_000,
    );
    const request = requestWithCookie(cookie);

    await expect(requireAdminSession(request, asD1Database(database), 1_001))
      .resolves.toMatchObject({ email: database.admin.email });

    database.admin.is_active = 0;
    await expect(requireAdminSession(request, asD1Database(database), 1_001))
      .rejects.toMatchObject({
        code: "invalid_session",
        status: 401,
      } satisfies Partial<ApiError>);
    database.admin.is_active = 1;

    await revokeAdminSession(request, asD1Database(database), 1_002);
    await expect(requireAdminSession(request, asD1Database(database), 1_003))
      .rejects.toMatchObject({
        code: "invalid_session",
        status: 401,
      } satisfies Partial<ApiError>);

    const expiredCookie = createSessionCookie("expired-token");
    database.sessions.push({
      admin_id: database.admin.id,
      expires_at: 999,
      id: "expired-session",
      revoked_at: null,
      token_hash: await hashSessionToken("expired-token"),
    });
    await expect(
      requireAdminSession(
        requestWithCookie(expiredCookie),
        asD1Database(database),
        1_000,
      ),
    ).rejects.toMatchObject({
      code: "invalid_session",
      status: 401,
    } satisfies Partial<ApiError>);
  });
});
