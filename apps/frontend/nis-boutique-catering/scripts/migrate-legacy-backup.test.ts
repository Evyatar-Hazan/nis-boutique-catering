import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { publicSiteDocumentSchema } from '@monorepo/content-schema';

import { transformLegacyBackup, writeMigrationOutput } from './migrate-legacy-backup';

const backupRoot = resolve(import.meta.dirname, '../../../../backups/legacy-google/20260720T080523Z');

describe('legacy Google migration transformer', () => {
  it('produces a valid deterministic revision and R2 mapping', async () => {
    const first = await transformLegacyBackup(backupRoot);
    const second = await transformLegacyBackup(backupRoot);

    expect(second).toEqual(first);
    expect(() => publicSiteDocumentSchema.parse(first.revision.content)).not.toThrow();
    expect(first.r2Manifest).toHaveLength(16);
    expect(first.revision.content.sections.gallery.items).toHaveLength(9);
    expect(first.revision.content.sections.services.items).toHaveLength(3);
    expect(first.archive.retiredGalleryIds).toHaveLength(6);
    expect(first.r2Manifest.every(({ checksum, objectKey }) => checksum.length === 64 && objectKey.startsWith('originals/'))).toBe(true);
  });

  it('writes byte-identical output in repeated dry runs', async () => {
    const root = await mkdtemp(join(tmpdir(), 'nis-transform-'));
    try {
      const firstRoot = join(root, 'first');
      const secondRoot = join(root, 'second');
      await writeMigrationOutput(backupRoot, firstRoot);
      await writeMigrationOutput(backupRoot, secondRoot);
      for (const name of ['archive.json', 'r2-manifest.json', 'revision.json']) {
        await expect(readFile(join(firstRoot, name), 'utf8')).resolves.toBe(await readFile(join(secondRoot, name), 'utf8'));
      }
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });

  it('blocks and documents an unknown legacy section group', async () => {
    const root = await mkdtemp(join(tmpdir(), 'nis-transform-warning-'));
    try {
      await mkdir(root, { recursive: true });
      for (const name of ['backup-manifest.json', 'drive-manifest.json']) {
        await writeFile(join(root, name), await readFile(join(backupRoot, name)));
      }
      const snapshot = JSON.parse(await readFile(join(backupRoot, 'generated-snapshot.json'), 'utf8')) as {
        sections: Array<Record<string, unknown>>;
      };
      snapshot.sections.push({ ...snapshot.sections[0], group: 'unmapped-future-group', id: 'unknown-section-fixture' });
      await writeFile(join(root, 'generated-snapshot.json'), `${JSON.stringify(snapshot)}\n`);

      await expect(transformLegacyBackup(root)).rejects.toThrow('Unknown section groups: unmapped-future-group');
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
});
