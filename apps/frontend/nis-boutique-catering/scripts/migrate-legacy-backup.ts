import {
  contentSnapshotSchema,
  publicContactDefaults,
  publicHeroDefaults,
  publicProcessDefaults,
  publicServicesDefaults,
  publicSiteDocumentSchema,
  publicTrustDefaults,
  type PublicGalleryCategory,
  type PublicSiteDocument,
} from '@monorepo/content-schema';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

type DriveManifest = {
  readonly files: readonly {
    readonly id: string;
    readonly mimeType: string;
    readonly name: string;
    readonly sha256: string;
    readonly size: string;
    readonly storedPath: string;
  }[];
};

const knownSectionGroups = new Set([
  'audience', 'boutique', 'coordination', 'editorial', 'faq', 'hero', 'hero-marquee',
  'hero-badges', 'hero-media', 'hero-notes', 'hero-stats', 'manifesto', 'process', 'samples',
  'seo-topics', 'signature', 'site-copy', 'site-microcopy', 'story', 'trust',
]);
const archivedGroups = new Set([
  'audience', 'boutique', 'editorial', 'hero', 'hero-badges', 'hero-marquee', 'hero-notes',
  'hero-stats', 'manifesto', 'samples', 'seo-topics', 'signature', 'site-copy',
  'site-microcopy', 'story', 'trust',
]);

const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const deterministicUuid = (value: string) => {
  const digest = hash(value);
  return `${digest.slice(0, 8)}-${digest.slice(8, 12)}-5${digest.slice(13, 16)}-a${digest.slice(17, 20)}-${digest.slice(20, 32)}`;
};
const categoryMap: Record<string, PublicGalleryCategory> = {
  coffee: 'trays', fish: 'dishes', salads: 'dishes', tables: 'tables', trays: 'trays',
};
const timestampToIso = (timestamp: string) => timestamp.replace(
  /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/u,
  '$1-$2-$3T$4:$5:$6.000Z',
);

export const transformLegacyBackup = async (backupRoot: string) => {
  const legacy = contentSnapshotSchema.parse(JSON.parse(await readFile(join(backupRoot, 'generated-snapshot.json'), 'utf8')));
  const drive = JSON.parse(await readFile(join(backupRoot, 'drive-manifest.json'), 'utf8')) as DriveManifest;
  const backup = JSON.parse(await readFile(join(backupRoot, 'backup-manifest.json'), 'utf8')) as { backedUpAt: string };
  const driveById = new Map(drive.files.map((file) => [file.id, file]));
  const warnings: string[] = [];

  const unknownGroups = [...new Set(legacy.sections.map(({ group }) => group))]
    .filter((group) => !knownSectionGroups.has(group));
  if (unknownGroups.length) warnings.push(`Unknown section groups: ${unknownGroups.join(', ')}`);

  const galleryByMediaId = new Map(legacy.gallery.filter(({ deletedAt }) => !deletedAt).map((item) => [item.mediaId, item]));
  const serviceByMediaId = new Map(legacy.services.filter(({ deletedAt }) => !deletedAt).map((item) => [item.mediaId, item]));
  const media = legacy.media.filter(({ deletedAt }) => !deletedAt).map((asset) => {
    const source = asset.driveFileId ? driveById.get(asset.driveFileId) : undefined;
    if (!source) warnings.push(`Media ${asset.id} has no backed-up Drive source.`);
    const gallery = galleryByMediaId.get(asset.id);
    const service = serviceByMediaId.get(asset.id);
    return {
      alt: gallery?.alt ?? gallery?.title ?? service?.title ?? asset.title ?? asset.id,
      checksum: source?.sha256 ?? 'missing-checksum',
      height: asset.height,
      id: asset.id,
      kind: 'image' as const,
      mimeType: source?.mimeType as 'image/avif' | 'image/jpeg' | 'image/png' | 'image/webp',
      objectKey: `originals/${asset.id}/${source ? basename(source.storedPath) : 'missing'}`,
      sizeBytes: Number(source?.size ?? 0),
      title: asset.title ?? gallery?.title ?? service?.title ?? asset.id,
      width: asset.width,
    };
  });

  const activeServices = legacy.services.filter(({ active, deletedAt }) => active && !deletedAt).sort((a, b) => a.order - b.order);
  if (activeServices.length !== 3) warnings.push(`Expected 3 active services, found ${activeServices.length}.`);
  const activeGallery = legacy.gallery.filter(({ active, deletedAt }) => active && !deletedAt).sort((a, b) => a.order - b.order);
  if (activeGallery.length < 6) warnings.push(`Expected at least 6 gallery items, found ${activeGallery.length}.`);
  const selectedGallery = activeGallery.slice(0, 9);
  const process = legacy.sections.filter(({ active, deletedAt, group }) => group === 'process' && active && !deletedAt).sort((a, b) => a.order - b.order);
  const coordination = legacy.sections.filter(({ active, deletedAt, group }) => group === 'coordination' && active && !deletedAt).sort((a, b) => a.order - b.order).slice(0, 3);
  const faqs = legacy.sections.filter(({ active, deletedAt, group }) => group === 'faq' && active && !deletedAt).sort((a, b) => a.order - b.order).slice(0, 4);
  if (process.length !== 4) warnings.push(`Expected 4 process steps, found ${process.length}.`);
  if (faqs.length < 3) warnings.push(`Expected at least 3 FAQs, found ${faqs.length}.`);

  const heroMedia = legacy.sections.find(({ active, deletedAt, group }) => group === 'hero-media' && active && !deletedAt)?.items[0]
    ?? publicHeroDefaults.mediaId;
  const trustMedia = media.some(({ id }) => id === publicTrustDefaults.mediaId)
    ? publicTrustDefaults.mediaId
    : media.at(-1)?.id ?? '';
  const updatedAt = timestampToIso(backup.backedUpAt);
  const document: PublicSiteDocument = publicSiteDocumentSchema.parse({
    media,
    schemaVersion: 2,
    sections: {
      contact: {
        ...publicContactDefaults,
        faqs: faqs.map((item) => ({ answer: item.text ?? '', id: item.id, question: item.title ?? '' })),
      },
      gallery: {
        cta: { label: 'אהבתם? דברו איתנו', message: 'אשמח לתכנן אירוח עם Nis.' },
        description: 'מבחר קטן שמציג את סגנון ההגשה, הצבע והדיוק של Nis.',
        eyebrow: 'גלריה',
        items: selectedGallery.map((item, index) => ({
          category: categoryMap[item.category] ?? 'dishes',
          id: item.id,
          mediaId: item.mediaId,
          order: index + 1,
          title: item.title,
        })),
        title: 'כך האירוח נראה כשהוא מוכן.',
      },
      hero: { ...publicHeroDefaults, mediaId: heroMedia },
      process: {
        ...publicProcessDefaults,
        operationalNotes: coordination.map((item) => ({ id: item.id, text: item.text ?? '', title: item.title ?? '' })),
        steps: process.map((item, index) => ({ description: item.text ?? '', id: item.id, order: index + 1, title: item.title ?? '' })),
      },
      services: {
        ...publicServicesDefaults,
        items: activeServices.map((service, index) => ({
          active: true,
          bestFor: service.bestFor,
          cta: { label: service.cta, message: service.title },
          id: service.id,
          mediaId: service.mediaId,
          order: index + 1,
          summary: service.description,
          title: service.title,
        })),
      },
      trust: { ...publicTrustDefaults, mediaId: trustMedia },
    },
    settings: {
      email: legacy.settings.email,
      phoneDisplay: legacy.settings.phoneDisplay,
      phoneHref: legacy.settings.phoneHref,
      seoDescription: legacy.settings.seoDescription ?? 'קייטרינג בוטיק לאירוח מוקפד מביתר עילית.',
      seoTitle: legacy.settings.seoTitle ?? 'Nis Boutique Catering',
      whatsappBase: legacy.settings.whatsappBase,
    },
    updatedAt,
    version: `legacy-${backup.backedUpAt}`,
  });

  const retiredSectionIds = legacy.sections
    .filter(({ active, deletedAt, group }) => archivedGroups.has(group) || !active || Boolean(deletedAt))
    .map(({ id }) => id).sort();
  const archive = {
    extraDriveFileIds: drive.files.map(({ id }) => id).filter((id) => !legacy.media.some(({ driveFileId }) => driveFileId === id)).sort(),
    retiredGalleryIds: activeGallery.slice(9).map(({ id }) => id).sort(),
    retiredSectionIds,
  };
  if (warnings.length) throw new Error(warnings.join('\n'));
  const serializedContent = `${JSON.stringify(document, null, 2)}\n`;
  return {
    archive,
    r2Manifest: media.map((asset) => ({ checksum: asset.checksum, mediaId: asset.id, objectKey: asset.objectKey, sizeBytes: asset.sizeBytes })),
    revision: {
      checksum: hash(serializedContent),
      content: document,
      id: deterministicUuid(`nis:${backup.backedUpAt}:${hash(serializedContent)}`),
      schemaVersion: 2,
      sourceBackup: backup.backedUpAt,
      status: 'draft',
      version: 1,
    },
  };
};

export const writeMigrationOutput = async (backupRoot: string, outputRoot: string) => {
  const output = await transformLegacyBackup(backupRoot);
  await mkdir(outputRoot, { recursive: true });
  for (const [name, value] of Object.entries({ archive: output.archive, 'r2-manifest': output.r2Manifest, revision: output.revision })) {
    await writeFile(join(outputRoot, `${name}.json`), `${JSON.stringify(value, null, 2)}\n`);
  }
  return output;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const backupRoot = resolve(process.argv[2] ?? '');
  const outputRoot = resolve(process.argv[3] ?? 'migration-output');
  const output = await writeMigrationOutput(backupRoot, outputRoot);
  console.log(JSON.stringify({ archive: output.archive, media: output.r2Manifest.length, revisionId: output.revision.id }));
}
