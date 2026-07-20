import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { assertImportConfirmation, buildPreviewImportPlan } from './import-legacy-preview';

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

  it('keeps the Production writer behind an explicit confirmation gate', () => {
    expect(() => assertImportConfirmation('production', undefined)).toThrow(
      'Production import requires NIS_PRODUCTION_CUTOVER_CONFIRM=IMPORT_LEGACY_TO_PRODUCTION.',
    );
    expect(() => assertImportConfirmation('production', 'wrong-value')).toThrow();
    expect(() => assertImportConfirmation('production', 'IMPORT_LEGACY_TO_PRODUCTION')).not.toThrow();
    expect(() => assertImportConfirmation('preview', undefined)).not.toThrow();
  });
});
