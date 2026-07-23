import { spawnSync } from 'node:child_process';

const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const displayName = process.env.BOOTSTRAP_ADMIN_NAME?.trim();
const environment = process.env.MEDIA_LIBRARY_ENV === 'production' ? 'production' : 'preview';

if (!email || !displayName) {
  throw new Error('BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_NAME are required.');
}
if (environment === 'production' && process.env.CONFIRM_PRODUCTION !== 'yes') {
  throw new Error('Set CONFIRM_PRODUCTION=yes to seed production.');
}

const sql = `INSERT INTO admins (id, email, display_name)
VALUES ('${crypto.randomUUID()}', '${email.replaceAll("'", "''")}', '${displayName.replaceAll("'", "''")}')
ON CONFLICT(email) DO UPDATE SET display_name = excluded.display_name, is_active = 1, updated_at = unixepoch();`;
const args = [
  'wrangler', 'd1', 'execute',
  environment === 'production' ? 'nis-media-library-production' : 'nis-media-library-preview',
  '--remote', '--command', sql,
  ...(environment === 'production' ? ['--env', 'production'] : []),
];
const result = spawnSync('pnpm', ['exec', ...args], { stdio: 'inherit' });
process.exit(result.status ?? 1);
