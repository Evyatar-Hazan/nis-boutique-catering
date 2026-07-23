#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { chmod, cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { contentSnapshotSchema } from '../packages/content-schema/src/index';

const sha256 = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');

const main = async () => {
  const backupRoot = resolve(process.cwd(), process.argv[2] ?? '.');
  const manifest = JSON.parse(await readFile(join(backupRoot, 'backup-manifest.json'), 'utf8'));
  const sheets = JSON.parse(await readFile(join(backupRoot, 'sheets-export.json'), 'utf8'));
  const drive = JSON.parse(await readFile(join(backupRoot, 'drive-manifest.json'), 'utf8'));
  const snapshotBytes = await readFile(join(backupRoot, 'generated-snapshot.json'));
  const snapshot: unknown = JSON.parse(snapshotBytes.toString('utf8'));

  for (const file of manifest.files) {
    const bytes = await readFile(join(backupRoot, file.path));
    if (bytes.length !== file.size || sha256(bytes) !== file.sha256) {
      throw new Error(`Backup hash mismatch: ${file.path}`);
    }
  }
  for (const sheet of sheets.sheets) {
    for (const row of sheet.rows) {
      if (!row.stableId || sha256(`${JSON.stringify(row.values)}\n`) !== row.sha256) {
        throw new Error(`Invalid row identity/hash in ${sheet.properties.title}`);
      }
    }
  }
  if (drive.files.length !== manifest.counts.driveFiles) {
    throw new Error('Drive count mismatch.');
  }
  contentSnapshotSchema.parse(snapshot);
  const sensitive = /(?:private_key|access_token|BEGIN PRIVATE KEY)/u;
  for (const name of ['backup-manifest.json', 'sheets-export.json', 'drive-manifest.json', 'generated-snapshot.json']) {
    if (sensitive.test(await readFile(join(backupRoot, name), 'utf8'))) {
      throw new Error(`Credential material found in ${name}`);
    }
  }

  const restoreRoot = await mkdtemp(join(tmpdir(), 'nis-legacy-restore-'));
  try {
    await cp(backupRoot, join(restoreRoot, basename(backupRoot)), { recursive: true });
    const restored = await readFile(join(restoreRoot, basename(backupRoot), 'generated-snapshot.json'));
    if (sha256(restored) !== sha256(snapshotBytes)) {
      throw new Error('Sandbox restore hash mismatch.');
    }
  } finally {
    await rm(restoreRoot, { force: true, recursive: true });
  }
  for (const file of [...manifest.files.map(({ path }: { readonly path: string }) => path), 'backup-manifest.json']) {
    await chmod(join(backupRoot, file), 0o444);
  }
  await chmod(join(backupRoot, 'drive-files'), 0o555);
  await chmod(backupRoot, 0o555);
  console.log(JSON.stringify({ immutableMode: '0555', restored: true, ...manifest.counts }));
};

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
