import { describe, expect, it } from "vitest";

import { ApiError } from "../http/errors";
import { createAdmin, listAdmins, updateAdmin } from "./repository";

interface StoredAdmin {
  createdAt: number;
  displayName: string;
  email: string;
  googleSubject: string | null;
  id: string;
  isActive: boolean;
  updatedAt: number;
}

interface StoredSession {
  adminId: string;
  expiresAt: number;
  revokedAt: number | null;
}

class AdminDatabase {
  readonly admins: StoredAdmin[];
  readonly sessions: StoredSession[];

  constructor(admins: StoredAdmin[], sessions: StoredSession[] = []) {
    this.admins = admins;
    this.sessions = sessions;
  }

  prepare(query: string): D1PreparedStatement {
    const { admins, sessions } = this;
    const statement = (values: readonly unknown[]) => ({
      async all<Result>() {
        if (!query.includes("FROM admins") || !query.includes("LEFT JOIN")) throw new Error(`Unexpected all query: ${query}`);
        const [nowSeconds] = values as [number];
        const results = [...admins]
          .sort((left, right) => Number(right.isActive) - Number(left.isActive) || left.email.localeCompare(right.email))
          .map((admin) => ({
            active_session_count: sessions.filter((session) => session.adminId === admin.id && session.revokedAt === null && session.expiresAt > nowSeconds).length,
            created_at: admin.createdAt,
            display_name: admin.displayName,
            email: admin.email,
            google_subject: admin.googleSubject,
            id: admin.id,
            is_active: admin.isActive ? 1 : 0,
            updated_at: admin.updatedAt,
          }));
        return { results } as unknown as D1Result<Result>;
      },
      async first<Result>() {
        if (!query.startsWith("SELECT id FROM admins")) throw new Error(`Unexpected first query: ${query}`);
        const [email] = values as [string];
        return (admins.find((admin) => admin.email === email)
          ? { id: admins.find((admin) => admin.email === email)?.id }
          : null) as Result | null;
      },
      async run() {
        if (query.startsWith("INSERT INTO admins")) {
          const [id, email, displayName, nowSeconds] = values as [string, string, string, number];
          admins.push({ createdAt: nowSeconds, displayName, email, googleSubject: null, id, isActive: true, updatedAt: nowSeconds });
          return { meta: { changes: 1 }, success: true } as D1Result;
        }
        if (query.startsWith("UPDATE admins")) {
          const [displayName, isActive, nowSeconds, id] = values as [string, number, number, string, string];
          const admin = admins.find((candidate) => candidate.id === id);
          if (!admin) return { meta: { changes: 0 }, success: true } as D1Result;
          Object.assign(admin, { displayName, isActive: isActive === 1, updatedAt: nowSeconds });
          return { meta: { changes: 1 }, success: true } as D1Result;
        }
        if (query.startsWith("UPDATE admin_sessions")) {
          const [nowSeconds, id] = values as [number, string];
          let changes = 0;
          for (const session of sessions) {
            if (session.adminId === id && session.revokedAt === null) {
              session.revokedAt = nowSeconds;
              changes += 1;
            }
          }
          return { meta: { changes }, success: true } as D1Result;
        }
        throw new Error(`Unexpected run query: ${query}`);
      },
    } as D1PreparedStatement);
    return {
      bind: (...values: unknown[]) => statement(values),
    } as D1PreparedStatement;
  }
}

const storedAdmin = (id: string, isActive = true): StoredAdmin => ({
  createdAt: 900,
  displayName: `Admin ${id}`,
  email: `${id}@example.com`,
  googleSubject: id === "owner" ? "google-owner" : null,
  id,
  isActive,
  updatedAt: 900,
});

const asD1Database = (database: AdminDatabase): D1Database => database as unknown as D1Database;

describe("admin repository", () => {
  it("normalizes new email addresses and enforces uniqueness", async () => {
    const database = new AdminDatabase([storedAdmin("owner")]);
    const created = await createAdmin(asD1Database(database), { displayName: "  New Admin  ", email: "  NEW@Example.COM " }, 1_000);
    expect(created).toMatchObject({ displayName: "New Admin", email: "new@example.com", isActive: true });
    await expect(createAdmin(asD1Database(database), { displayName: "Duplicate", email: "new@example.com" }, 1_001)).rejects.toMatchObject({
      code: "admin_email_exists",
      status: 409,
    } satisfies Partial<ApiError>);
  });

  it("prevents self-deactivation and deactivation of the last active admin", async () => {
    const database = new AdminDatabase([storedAdmin("owner")]);
    await expect(updateAdmin(asD1Database(database), "owner", { id: "owner", isActive: false }, 1_000)).rejects.toMatchObject({
      code: "self_deactivation_forbidden",
      status: 409,
    } satisfies Partial<ApiError>);
    await expect(updateAdmin(asD1Database(database), "different-actor", { id: "owner", isActive: false }, 1_000)).rejects.toMatchObject({
      code: "last_admin_forbidden",
      status: 409,
    } satisfies Partial<ApiError>);
  });

  it("revokes every active session when another admin is deactivated", async () => {
    const sessions: StoredSession[] = [
      { adminId: "editor", expiresAt: 2_000, revokedAt: null },
      { adminId: "editor", expiresAt: 3_000, revokedAt: null },
      { adminId: "owner", expiresAt: 3_000, revokedAt: null },
    ];
    const database = new AdminDatabase([storedAdmin("owner"), storedAdmin("editor")], sessions);
    expect((await listAdmins(asD1Database(database), 1_000)).find((admin) => admin.id === "editor")?.activeSessionCount).toBe(2);
    const updated = await updateAdmin(asD1Database(database), "owner", { id: "editor", isActive: false }, 1_100);
    expect(updated).toMatchObject({ activeSessionCount: 0, isActive: false });
    expect(sessions.filter((session) => session.adminId === "editor").every((session) => session.revokedAt === 1_100)).toBe(true);
    expect(sessions.find((session) => session.adminId === "owner")?.revokedAt).toBeNull();
  });

  it("reactivates an administrator without manufacturing a session", async () => {
    const database = new AdminDatabase([storedAdmin("owner"), storedAdmin("editor", false)]);
    const updated = await updateAdmin(asD1Database(database), "owner", { id: "editor", isActive: true }, 1_200);
    expect(updated).toMatchObject({ activeSessionCount: 0, isActive: true, updatedAt: 1_200 });
  });
});
