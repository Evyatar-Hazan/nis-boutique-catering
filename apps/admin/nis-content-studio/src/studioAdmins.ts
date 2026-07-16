import { studioConfig } from './config';

export interface StudioAdminRecord {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly picture?: string;
  readonly active: boolean;
  readonly createdAt: string;
  readonly lastLogin?: string;
}

export const studioAdminSheetHeaders = ['id', 'email', 'name', 'picture', 'active', 'createdAt', 'lastLogin'] as const;

const fallbackAdminName = (email: string) => email.split('@')[0]?.replace(/[._-]+/g, ' ') || email;

export const normalizeAdminEmail = (email: string) => email.trim().toLowerCase();

export const makeAdminId = (email: string) =>
  normalizeAdminEmail(email)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const getConfiguredStudioAdmins = (): readonly StudioAdminRecord[] =>
  studioConfig.allowedEditors.map((email) => ({
    id: makeAdminId(email),
    email,
    name: fallbackAdminName(email),
    active: true,
    createdAt: 'configured-env',
  }));

export const isAllowedStudioAdmin = (
  email: string,
  admins: readonly StudioAdminRecord[],
) => {
  const normalizedEmail = normalizeAdminEmail(email);
  const activeAdmins = admins.filter((admin) => admin.active);

  if (activeAdmins.length > 0) {
    return activeAdmins.some((admin) => normalizeAdminEmail(admin.email) === normalizedEmail);
  }

  return studioConfig.allowedEditors.length === 0 || studioConfig.allowedEditors.includes(normalizedEmail);
};

export const parseStudioAdmins = (rows: readonly string[][]): readonly StudioAdminRecord[] => {
  const [headers = [], ...body] = rows;
  if (headers.length === 0) {
    return [];
  }

  return body
    .filter((row) => row.some(Boolean))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])))
    .map((row): StudioAdminRecord => {
      const email = normalizeAdminEmail(String(row.email ?? ''));
      return {
        id: String(row.id || makeAdminId(email)),
        email,
        name: String(row.name || fallbackAdminName(email)),
        picture: String(row.picture || '') || undefined,
        active: String(row.active ?? 'true').toLowerCase() !== 'false',
        createdAt: String(row.createdAt || new Date(0).toISOString()),
        lastLogin: String(row.lastLogin || '') || undefined,
      };
    })
    .filter((admin) => admin.email);
};

export const serializeStudioAdmins = (admins: readonly StudioAdminRecord[]) => [
  [...studioAdminSheetHeaders],
  ...admins.map((admin) => [
    admin.id,
    normalizeAdminEmail(admin.email),
    admin.name,
    admin.picture ?? '',
    admin.active,
    admin.createdAt,
    admin.lastLogin ?? '',
  ]),
];
