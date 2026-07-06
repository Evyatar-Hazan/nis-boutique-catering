import { spawnSync } from 'node:child_process';

const mode = process.argv[2] ?? 'validate';

const run = (command, args, extraEnv = {}) => {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      ...extraEnv,
    },
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const requireEnv = (keys) => {
  const missing = keys.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`Missing required environment variables for local parity: ${missing.join(', ')}`);
    process.exit(1);
  }
};

const runValidateFlow = () => {
  run('pnpm', ['doctor:runtime']);
  run('pnpm', ['install', '--frozen-lockfile']);
  run('pnpm', ['validate']);
};

const runDeployFlow = () => {
  runValidateFlow();

  requireEnv([
    'GOOGLE_SHEET_ID',
    'GOOGLE_SERVICE_ACCOUNT_JSON',
    'VITE_GOOGLE_CLIENT_ID',
    'VITE_GOOGLE_API_KEY',
    'VITE_GOOGLE_APPS_SCRIPT_PUBLISH_URL',
  ]);

  run('pnpm', ['cloudflare:build:site'], {
    CONTENT_SYNC_REQUIRE_REMOTE: 'true',
  });
  run('pnpm', ['cloudflare:build:admin']);
};

if (mode === 'validate') {
  runValidateFlow();
  process.exit(0);
}

if (mode === 'deploy') {
  runDeployFlow();
  process.exit(0);
}

console.error(`Unknown parity mode: ${mode}`);
console.error('Use one of: validate, deploy');
process.exit(1);
