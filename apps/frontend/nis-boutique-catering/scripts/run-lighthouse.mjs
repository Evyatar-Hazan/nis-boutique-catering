import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { appRoot } from './media-utils.mjs';

const url = process.env.LIGHTHOUSE_URL ?? 'http://localhost:4173/';
const outputPath = resolve(appRoot, 'reports/performance/lighthouse-local.json');

mkdirSync(resolve(appRoot, 'reports/performance'), { recursive: true });

const result = spawnSync(
  'npx',
  [
    'lighthouse',
    url,
    '--output=json',
    `--output-path=${outputPath}`,
    '--chrome-flags=--headless',
  ],
  { stdio: 'inherit' },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
