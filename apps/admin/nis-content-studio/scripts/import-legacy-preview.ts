import { publicSiteDocumentSchema } from '@monorepo/content-schema';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { z } from 'zod';

const revisionFileSchema = z.object({
  checksum: z.string().regex(/^[a-f0-9]{64}$/u),
  content: publicSiteDocumentSchema,
  id: z.string().uuid(),
  schemaVersion: z.literal(2),
  sourceBackup: z.string().min(1),
  status: z.literal('draft'),
  version: z.number().int().positive(),
}).strict();
const r2ManifestSchema = z.array(z.object({
  checksum: z.string().regex(/^[a-f0-9]{64}$/u),
  mediaId: z.string().min(1),
  objectKey: z.string().min(1),
  sizeBytes: z.number().int().positive(),
}).strict());
const driveManifestSchema = z.object({
  files: z.array(z.object({
    id: z.string().min(1),
    mimeType: z.string().min(1),
    name: z.string().min(1),
    sha256: z.string().regex(/^[a-f0-9]{64}$/u),
    size: z.string().regex(/^\d+$/u),
    storedPath: z.string().min(1),
  }).passthrough()),
}).passthrough();

const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const deterministicUuid = (value: string) => {
  const digest = hash(value);
  return `${digest.slice(0, 8)}-${digest.slice(8, 12)}-5${digest.slice(13, 16)}-a${digest.slice(17, 20)}-${digest.slice(20, 32)}`;
};
const parseJson = (value: string): unknown => JSON.parse(value) as unknown;
const sqlText = (value: string) => `'${value.replaceAll("'", "''")}'`;

type ImportTarget = 'preview' | 'production';

const targetConfiguration = {
  preview: {
    bucket: 'nis-media-preview',
    databaseArguments: ['nis-content-preview', '--remote'],
    label: 'Preview',
    reportName: 'preview-parity-report.json',
  },
  production: {
    bucket: 'nis-media-production',
    databaseArguments: ['nis-content-production', '--remote', '--env', 'production'],
    label: 'Production',
    reportName: 'production-parity-report.json',
  },
} as const satisfies Record<ImportTarget, {
  readonly bucket: string;
  readonly databaseArguments: readonly string[];
  readonly label: string;
  readonly reportName: string;
}>;

export const buildPreviewImportPlan = async (repoRoot: string) => {
  const migrationRoot = join(repoRoot, 'migration/legacy-google/20260720T080523Z');
  const backupRoot = join(repoRoot, 'backups/legacy-google/20260720T080523Z');
  const revision = revisionFileSchema.parse(parseJson(await readFile(join(migrationRoot, 'revision.json'), 'utf8')));
  const r2Manifest = r2ManifestSchema.parse(parseJson(await readFile(join(migrationRoot, 'r2-manifest.json'), 'utf8')));
  const driveManifest = driveManifestSchema.parse(parseJson(await readFile(join(backupRoot, 'drive-manifest.json'), 'utf8')));
  const driveByChecksum = new Map(driveManifest.files.map((file) => [file.sha256, file]));
  const mediaById = new Map(revision.content.media.map((asset) => [asset.id, asset]));

  const objects = r2Manifest.map((entry) => {
    const asset = mediaById.get(entry.mediaId);
    const source = driveByChecksum.get(entry.checksum);
    if (!asset || !source) throw new Error(`Missing migration source for media ${entry.mediaId}.`);
    if (asset.objectKey !== entry.objectKey || asset.checksum !== entry.checksum || asset.sizeBytes !== entry.sizeBytes) {
      throw new Error(`Migration metadata drift for media ${entry.mediaId}.`);
    }
    return {
      ...entry,
      altText: asset.alt,
      height: asset.height,
      mimeType: asset.mimeType,
      originalFileName: source.name,
      sourcePath: join(backupRoot, source.storedPath),
      width: asset.width,
    };
  });
  if (objects.length !== revision.content.media.length) {
    throw new Error('R2 manifest does not cover the complete media registry.');
  }

  return {
    backupTimestamp: revision.sourceBackup,
    draftId: revision.id,
    objects,
    publishedId: deterministicUuid(`published:${revision.id}`),
    revision,
    timestampSeconds: Math.floor(Date.parse(revision.content.updatedAt) / 1000),
  };
};

const runWrangler = (studioRoot: string, args: readonly string[], encoding: 'buffer' | 'utf8' = 'utf8') =>
  execFileSync('pnpm', ['exec', 'wrangler', ...args], {
    cwd: studioRoot,
    encoding: encoding === 'buffer' ? null : 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

const runD1Json = (studioRoot: string, target: ImportTarget, command: string) => {
  const configuration = targetConfiguration[target];
  const output = runWrangler(studioRoot, [
    'd1', 'execute', ...configuration.databaseArguments, '--json', '--command', command,
  ], 'utf8');
  return z.array(z.object({ results: z.array(z.record(z.string(), z.unknown())), success: z.boolean() }).passthrough())
    .parse(parseJson(String(output)));
};

const buildSql = (
  plan: Awaited<ReturnType<typeof buildPreviewImportPlan>>,
  adminId: string,
) => {
  const rows = plan.objects.map((object) => `INSERT INTO media_assets
    (id, object_key, original_file_name, mime_type, size_bytes, width, height,
     sha256_hex, alt_text, created_by, created_at, updated_at)
    VALUES (${sqlText(object.mediaId)}, ${sqlText(object.objectKey)}, ${sqlText(object.originalFileName)},
      ${sqlText(object.mimeType)}, ${object.sizeBytes}, ${object.width}, ${object.height},
      ${sqlText(object.checksum)}, ${sqlText(object.altText)}, ${sqlText(adminId)},
      ${plan.timestampSeconds}, ${plan.timestampSeconds})
    ON CONFLICT(id) DO UPDATE SET
      object_key=excluded.object_key, original_file_name=excluded.original_file_name,
      mime_type=excluded.mime_type, size_bytes=excluded.size_bytes, width=excluded.width,
      height=excluded.height, sha256_hex=excluded.sha256_hex, alt_text=excluded.alt_text,
      updated_at=excluded.updated_at;`);
  const contentJson = JSON.stringify(plan.revision.content);
  rows.push(`INSERT INTO content_revisions
    (id, status, schema_version, content_json, version, created_by, updated_by,
     published_at, created_at, updated_at)
    VALUES (${sqlText(plan.publishedId)}, 'published', 2, ${sqlText(contentJson)}, 1,
      ${sqlText(adminId)}, ${sqlText(adminId)}, ${plan.timestampSeconds},
      ${plan.timestampSeconds}, ${plan.timestampSeconds})
    ON CONFLICT(id) DO UPDATE SET content_json=excluded.content_json,
      schema_version=excluded.schema_version, updated_by=excluded.updated_by,
      published_at=excluded.published_at, updated_at=excluded.updated_at;`);
  rows.push(`INSERT INTO content_revisions
    (id, status, schema_version, content_json, version, created_by, updated_by,
     created_at, updated_at)
    VALUES (${sqlText(plan.draftId)}, 'draft', 2, ${sqlText(contentJson)}, 1,
      ${sqlText(adminId)}, ${sqlText(adminId)}, ${plan.timestampSeconds}, ${plan.timestampSeconds})
    ON CONFLICT(id) DO UPDATE SET content_json=excluded.content_json,
      schema_version=excluded.schema_version, updated_by=excluded.updated_by,
      updated_at=excluded.updated_at;`);
  return `PRAGMA foreign_keys = ON;\n${rows.join('\n')}\n`;
};

export const importLegacyContent = async (repoRoot: string, target: ImportTarget) => {
  const studioRoot = join(repoRoot, 'apps/admin/nis-content-studio');
  const plan = await buildPreviewImportPlan(repoRoot);
  const configuration = targetConfiguration[target];
  const activeAdmins = runD1Json(
    studioRoot,
    target,
    "SELECT id FROM admins WHERE is_active=1 ORDER BY id;",
  )[0]?.results ?? [];
  if (activeAdmins.length !== 1 || typeof activeAdmins[0]?.id !== 'string') {
    throw new Error(`${configuration.label} import requires exactly one active bootstrap admin; found ${activeAdmins.length}.`);
  }
  const adminId = activeAdmins[0].id;
  const existing = runD1Json(
    studioRoot,
    target,
    "SELECT 'revision' AS kind,id FROM content_revisions UNION ALL SELECT 'media' AS kind,id FROM media_assets ORDER BY kind,id;",
  )[0]?.results ?? [];
  const expectedIds = new Set([plan.draftId, plan.publishedId, ...plan.objects.map(({ mediaId }) => mediaId)]);
  const unexpected = existing.filter(({ id }) => typeof id !== 'string' || !expectedIds.has(id));
  if (unexpected.length > 0) {
    throw new Error(`${configuration.label} contains ${unexpected.length} rows outside this migration; refusing to overwrite.`);
  }

  for (const object of plan.objects) {
    const bytes = await readFile(object.sourcePath);
    if (bytes.length !== object.sizeBytes || hash(bytes) !== object.checksum) {
      throw new Error(`Backup file integrity failed for ${object.mediaId}.`);
    }
    runWrangler(studioRoot, [
      'r2', 'object', 'put', `${configuration.bucket}/${object.objectKey}`, '--remote',
      '--file', object.sourcePath, '--content-type', object.mimeType, '--force',
    ]);
  }

  const tempRoot = await mkdtemp(join(tmpdir(), `nis-${target}-import-`));
  try {
    const sqlPath = join(tempRoot, 'import.sql');
    await writeFile(sqlPath, buildSql(plan, adminId));
    runWrangler(studioRoot, [
      'd1', 'execute', ...configuration.databaseArguments, '--yes', '--file', sqlPath,
    ]);

    for (const object of plan.objects) {
      const downloaded = runWrangler(
        studioRoot,
        ['r2', 'object', 'get', `${configuration.bucket}/${object.objectKey}`, '--remote', '--pipe'],
        'buffer',
      );
      if (!Buffer.isBuffer(downloaded) || downloaded.length !== object.sizeBytes || hash(downloaded) !== object.checksum) {
        throw new Error(`R2 verification failed for ${object.mediaId}.`);
      }
    }
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }

  const parity = runD1Json(studioRoot, target, `SELECT
    (SELECT COUNT(*) FROM media_assets) AS media_count,
    (SELECT COUNT(*) FROM content_revisions WHERE status='draft') AS draft_count,
    (SELECT COUNT(*) FROM content_revisions WHERE status='published') AS published_count,
    (SELECT COUNT(*) FROM publish_jobs) AS publish_jobs,
    (SELECT COUNT(*) FROM admin_sessions) AS sessions;
    PRAGMA foreign_key_check;`);
  const counts = parity[0]?.results[0];
  if (counts?.media_count !== plan.objects.length || counts.draft_count !== 1 || counts.published_count !== 1
      || counts.publish_jobs !== 0 || parity[1]?.results.length !== 0) {
    throw new Error(`${configuration.label} parity verification failed.`);
  }

  return {
    adminCount: activeAdmins.length,
    backupTimestamp: plan.backupTimestamp,
    contentChecksum: plan.revision.checksum,
    draftId: plan.draftId,
    draftCount: Number(counts.draft_count),
    foreignKeyViolations: parity[1]?.results.length ?? -1,
    mediaCount: plan.objects.length,
    objectChecksumsVerified: plan.objects.length,
    publishedId: plan.publishedId,
    publishedCount: Number(counts.published_count),
    publishJobs: Number(counts.publish_jobs),
  };
};

export const importLegacyPreview = (repoRoot: string) => importLegacyContent(repoRoot, 'preview');
export const importLegacyProduction = (repoRoot: string) => importLegacyContent(repoRoot, 'production');

export const assertImportConfirmation = (target: ImportTarget, confirmation: string | undefined): void => {
  if (target === 'production' && confirmation !== 'IMPORT_LEGACY_TO_PRODUCTION') {
    throw new Error('Production import requires NIS_PRODUCTION_CUTOVER_CONFIRM=IMPORT_LEGACY_TO_PRODUCTION.');
  }
};

const targetArgument = process.argv.includes('--apply-preview')
  ? 'preview'
  : process.argv.includes('--apply-production')
    ? 'production'
    : null;

if (targetArgument) {
  assertImportConfirmation(targetArgument, process.env.NIS_PRODUCTION_CUTOVER_CONFIRM);
  const repoRoot = resolve(import.meta.dirname, '../../../..');
  const report = await importLegacyContent(repoRoot, targetArgument);
  const reportPath = resolve(
    repoRoot,
    'migration/legacy-google/20260720T080523Z',
    targetConfiguration[targetArgument].reportName,
  );
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ report: basename(reportPath), ...report }));
} else if (process.argv[1]?.endsWith('import-legacy-preview.ts')) {
  throw new Error('Import is write-enabled only with --apply-preview or --apply-production.');
}
