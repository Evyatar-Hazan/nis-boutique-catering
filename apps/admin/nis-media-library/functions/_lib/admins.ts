import { ApiError, type Principal } from './http';

interface AdminRow {
  readonly created_at: number;
  readonly display_name: string;
  readonly email: string;
  readonly google_subject: string | null;
  readonly id: string;
  readonly is_active: number;
  readonly updated_at: number;
}

const present = (row: AdminRow) => ({
  createdAt: row.created_at,
  displayName: row.display_name,
  email: row.email,
  googleConnected: Boolean(row.google_subject),
  id: row.id,
  isActive: row.is_active === 1,
  updatedAt: row.updated_at,
});

export const listAdmins = async (database: D1Database) => {
  const rows = await database.prepare(
    `SELECT id, email, display_name, google_subject, is_active, created_at, updated_at
     FROM admins ORDER BY is_active DESC, display_name COLLATE NOCASE`,
  ).all<AdminRow>();
  return rows.results.map(present);
};

export const createAdmin = async (
  database: D1Database,
  input: { readonly displayName: string; readonly email: string },
) => {
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email) || !displayName || displayName.length > 180) {
    throw new ApiError(400, 'invalid_admin', 'שם או כתובת אימייל אינם תקינים.');
  }
  try {
    const row = await database.prepare(
      `INSERT INTO admins (id, email, display_name)
       VALUES (?1, ?2, ?3)
       RETURNING id, email, display_name, google_subject, is_active, created_at, updated_at`,
    ).bind(crypto.randomUUID(), email, displayName).first<AdminRow>();
    if (!row) throw new Error('missing');
    return present(row);
  } catch {
    throw new ApiError(409, 'admin_exists', 'כתובת האימייל כבר קיימת.');
  }
};

export const updateAdmin = async (
  database: D1Database,
  principal: Principal,
  input: { readonly displayName?: string; readonly id: string; readonly isActive?: boolean },
) => {
  if (input.id === principal.adminId && input.isActive === false) {
    throw new ApiError(409, 'cannot_disable_self', 'לא ניתן להשבית את החשבון המחובר.');
  }
  const row = await database.prepare(
    `UPDATE admins
     SET display_name = COALESCE(?1, display_name),
         is_active = COALESCE(?2, is_active),
         updated_at = unixepoch()
     WHERE id = ?3
     RETURNING id, email, display_name, google_subject, is_active, created_at, updated_at`,
  ).bind(
    input.displayName?.trim() || null,
    input.isActive === undefined ? null : Number(input.isActive),
    input.id,
  ).first<AdminRow>();
  if (!row) throw new ApiError(404, 'admin_not_found', 'המשתמש לא נמצא.');
  return present(row);
};
