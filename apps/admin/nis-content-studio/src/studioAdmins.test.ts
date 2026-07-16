import { describe, expect, it } from 'vitest';
import {
  isAllowedStudioAdmin,
  makeAdminId,
  parseStudioAdmins,
  serializeStudioAdmins,
} from './studioAdmins';

describe('studioAdmins', () => {
  it('creates stable ids from admin emails', () => {
    expect(makeAdminId('Owner.Name+nis@example.com')).toBe('owner-name-nis-example-com');
  });

  it('parses and serializes the admins sheet shape', () => {
    const rows = [
      ['id', 'email', 'name', 'picture', 'active', 'createdAt', 'lastLogin'],
      ['owner', 'OWNER@example.com', 'Owner', '', 'true', '2026-07-16T00:00:00.000Z', ''],
      ['editor', 'editor@example.com', 'Editor', 'https://example.com/a.jpg', 'false', '2026-07-16T00:00:00.000Z', ''],
    ];

    const admins = parseStudioAdmins(rows);

    expect(admins).toEqual([
      expect.objectContaining({ id: 'owner', email: 'owner@example.com', active: true }),
      expect.objectContaining({ id: 'editor', email: 'editor@example.com', active: false, picture: 'https://example.com/a.jpg' }),
    ]);
    expect(serializeStudioAdmins(admins)[0]).toEqual(['id', 'email', 'name', 'picture', 'active', 'createdAt', 'lastLogin']);
  });

  it('allows only active admins when a sheet allowlist exists', () => {
    const admins = parseStudioAdmins([
      ['id', 'email', 'name', 'picture', 'active', 'createdAt', 'lastLogin'],
      ['owner', 'owner@example.com', 'Owner', '', 'true', '2026-07-16T00:00:00.000Z', ''],
      ['inactive', 'inactive@example.com', 'Inactive', '', 'false', '2026-07-16T00:00:00.000Z', ''],
    ]);

    expect(isAllowedStudioAdmin('OWNER@example.com', admins)).toBe(true);
    expect(isAllowedStudioAdmin('inactive@example.com', admins)).toBe(false);
  });
});
