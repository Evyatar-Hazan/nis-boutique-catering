import { ApiError } from "../http/errors";

interface AdminRow {
  readonly active_session_count: number;
  readonly created_at: number;
  readonly display_name: string;
  readonly email: string;
  readonly google_subject: string | null;
  readonly id: string;
  readonly is_active: number;
  readonly updated_at: number;
}

export interface AdminRecord {
  readonly activeSessionCount: number;
  readonly createdAt: number;
  readonly displayName: string;
  readonly email: string;
  readonly googleSubject: string | null;
  readonly id: string;
  readonly isActive: boolean;
  readonly updatedAt: number;
}

const adminColumns = `admins.id, admins.email, admins.google_subject, admins.display_name,
  admins.is_active, admins.created_at, admins.updated_at,
  COUNT(CASE WHEN sessions.revoked_at IS NULL AND sessions.expires_at > ?1 THEN 1 END) AS active_session_count`;

const presentAdmin = (row: AdminRow): AdminRecord => ({
  activeSessionCount: row.active_session_count,
  createdAt: row.created_at,
  displayName: row.display_name,
  email: row.email,
  googleSubject: row.google_subject,
  id: row.id,
  isActive: row.is_active === 1,
  updatedAt: row.updated_at,
});

export const listAdmins = async (
  database: D1Database,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<readonly AdminRecord[]> => {
  const result = await database.prepare(
    `SELECT ${adminColumns}
     FROM admins
     LEFT JOIN admin_sessions AS sessions ON sessions.admin_id = admins.id
     GROUP BY admins.id
     ORDER BY admins.is_active DESC, lower(admins.email)`,
  ).bind(nowSeconds).all<AdminRow>();
  return result.results.map(presentAdmin);
};

export const createAdmin = async (
  database: D1Database,
  input: { readonly displayName: string; readonly email: string },
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<AdminRecord> => {
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();
  const existing = await database.prepare("SELECT id FROM admins WHERE email = ?1").bind(email).first<{ readonly id: string }>();
  if (existing) throw new ApiError(409, "admin_email_exists", "An admin with this email already exists.");
  const id = crypto.randomUUID();
  const result = await database.prepare(
    `INSERT INTO admins (id, email, display_name, is_active, created_at, updated_at)
     VALUES (?1, ?2, ?3, 1, ?4, ?4)`,
  ).bind(id, email, displayName, nowSeconds).run();
  if (!result.success || result.meta.changes !== 1) throw new ApiError(500, "admin_write_failed", "Could not create admin.");
  return (await listAdmins(database, nowSeconds)).find((admin) => admin.id === id)
    ?? { activeSessionCount: 0, createdAt: nowSeconds, displayName, email, googleSubject: null, id, isActive: true, updatedAt: nowSeconds };
};

export const updateAdmin = async (
  database: D1Database,
  actorAdminId: string,
  input: { readonly displayName?: string; readonly id: string; readonly isActive?: boolean },
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<AdminRecord> => {
  const target = (await listAdmins(database, nowSeconds)).find((admin) => admin.id === input.id);
  if (!target) throw new ApiError(404, "admin_not_found", "Admin was not found.");

  if (input.isActive === false && target.isActive) {
    if (target.id === actorAdminId) throw new ApiError(409, "self_deactivation_forbidden", "You cannot deactivate your own active admin.");
    const activeCount = (await listAdmins(database, nowSeconds)).filter((admin) => admin.isActive).length;
    if (activeCount <= 1) throw new ApiError(409, "last_admin_forbidden", "The last active admin cannot be deactivated.");
  }

  const displayName = input.displayName?.trim() ?? target.displayName;
  const activeMode = input.isActive === undefined ? target.isActive : input.isActive;
  const updated = await database.prepare(
    `UPDATE admins
     SET display_name = ?1, is_active = ?2, updated_at = ?3
     WHERE id = ?4
       AND (
         ?2 = 1
         OR is_active = 0
         OR (id <> ?5 AND (SELECT COUNT(*) FROM admins WHERE is_active = 1) > 1)
       )`,
  ).bind(displayName, activeMode ? 1 : 0, nowSeconds, input.id, actorAdminId).run();
  if (!updated.success || updated.meta.changes !== 1) {
    if (input.isActive === false) {
      throw new ApiError(
        409,
        input.id === actorAdminId ? "self_deactivation_forbidden" : "last_admin_forbidden",
        input.id === actorAdminId ? "You cannot deactivate your own active admin." : "The last active admin cannot be deactivated.",
      );
    }
    throw new ApiError(500, "admin_write_failed", "Could not update admin.");
  }
  if (input.isActive === false) {
    const revoked = await database.prepare(
      `UPDATE admin_sessions
       SET revoked_at = COALESCE(revoked_at, ?1), updated_at = ?1
       WHERE admin_id = ?2 AND revoked_at IS NULL`,
    ).bind(nowSeconds, input.id).run();
    if (!revoked.success) throw new ApiError(500, "admin_session_revoke_failed", "Admin access was disabled but session cleanup must be retried.");
  }
  const result = (await listAdmins(database, nowSeconds)).find((admin) => admin.id === input.id);
  if (!result) throw new ApiError(500, "admin_write_failed", "Updated admin could not be read.");
  return result;
};
