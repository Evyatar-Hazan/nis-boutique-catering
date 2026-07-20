import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const targets = Object.freeze({
  local: {
    database: 'nis-content-preview',
    flags: ['--local'],
  },
  preview: {
    database: 'nis-content-preview',
    flags: ['--remote'],
  },
  production: {
    database: 'nis-content-production',
    flags: ['--remote', '--env', 'production'],
  },
});

const targetName = process.env.NIS_DB_TARGET ?? 'local';
const target = targets[targetName];

if (!target) {
  throw new Error('NIS_DB_TARGET must be local, preview, or production.');
}

if (
  targetName === 'production'
  && process.env.NIS_CONFIRM_PRODUCTION !== 'seed-bootstrap-admin'
) {
  throw new Error(
    'Production seed requires NIS_CONFIRM_PRODUCTION=seed-bootstrap-admin.',
  );
}

const email = process.env.NIS_BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const displayName = process.env.NIS_BOOTSTRAP_ADMIN_NAME?.trim();

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
  throw new Error('NIS_BOOTSTRAP_ADMIN_EMAIL must contain a valid email address.');
}

if (!displayName) {
  throw new Error('NIS_BOOTSTRAP_ADMIN_NAME is required.');
}

const quoteSql = (value) => `'${value.replaceAll("'", "''")}'`;
const statement = `
  INSERT INTO admins (id, email, display_name, is_active)
  VALUES (${quoteSql(randomUUID())}, ${quoteSql(email)}, ${quoteSql(displayName)}, 1)
  ON CONFLICT(email) DO UPDATE SET
    display_name = excluded.display_name,
    is_active = 1,
    updated_at = unixepoch();
`;

const result = spawnSync(
  'pnpm',
  [
    'exec',
    'wrangler',
    'd1',
    'execute',
    target.database,
    ...target.flags,
    '--command',
    statement,
  ],
  {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8',
    stdio: 'inherit',
  },
);

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  throw new Error(`Bootstrap admin seed failed for ${targetName}.`);
}

console.log(`Bootstrap admin is active in the ${targetName} database.`);
