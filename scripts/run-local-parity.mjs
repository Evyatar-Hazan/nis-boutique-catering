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

  requireEnv(['CLOUDFLARE_CONTENT_API_ORIGIN', 'VITE_GOOGLE_CLIENT_ID']);

  run('pnpm', ['cloudflare:build:site']);
  run('pnpm', ['cloudflare:build:admin'], {
    VITE_GOOGLE_CLIENT_ID: process.env.VITE_GOOGLE_CLIENT_ID,
  });
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
