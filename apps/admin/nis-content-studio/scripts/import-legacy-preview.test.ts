import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { buildPreviewImportPlan } from './import-legacy-preview';

const repoRoot = resolve(import.meta.dirname, '../../../..');

describe('legacy Preview import plan', () => {
  it('builds a deterministic complete D1/R2 plan', async () => {
    const first = await buildPreviewImportPlan(repoRoot);
    const second = await buildPreviewImportPlan(repoRoot);

    expect(second).toEqual(first);
    expect(first.objects).toHaveLength(16);
    expect(new Set(first.objects.map(({ mediaId }) => mediaId)).size).toBe(16);
    expect(new Set(first.objects.map(({ objectKey }) => objectKey)).size).toBe(16);
    expect(first.draftId).toBe('b5bd90fb-ded3-583c-ab50-8bfa17f2bd26');
    expect(first.publishedId).not.toBe(first.draftId);
    expect(first.objects.every(({ sourcePath }) => sourcePath.includes('/backups/legacy-google/20260720T080523Z/drive-files/'))).toBe(true);
  });
});
