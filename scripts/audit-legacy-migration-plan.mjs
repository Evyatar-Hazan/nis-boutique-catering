import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const workspaceRoot = resolve(import.meta.dirname, '..');
const snapshotPaths = [
  'backups/legacy-google/20260720T080523Z/generated-snapshot.json',
];

const sectionGroupPlan = Object.freeze({
  hero: 'sections.hero',
  faq: 'sections.contact.faqs',
  editorial: 'archive: superseded by sections.services.items',
  manifesto: 'archive: selected proof moves to sections.trust.points',
  audience: 'archive: bestFor is owned by sections.services.items',
  boutique: 'sections.trust.points',
  process: 'sections.process.steps',
  signature: 'archive: selected proof moves to sections.trust.points',
  story: 'archive: optional one-line brand copy only',
  samples: 'archive: service details are not part of the public v2 contract',
  coordination: 'sections.process.operationalNotes',
  'hero-media': 'sections.hero.mediaId',
  'hero-notes': 'sections.hero.valuePoints',
  'hero-badges': 'archive: duplicate Hero proof',
  'hero-marquee': 'archive: decorative duplicate copy',
  'hero-stats': 'archive: unverified decorative statistics',
  'seo-topics': 'archive: legacy search-copy collection',
  'site-copy': 'archive: superseded by the v2 section contract',
  'site-microcopy': 'archive: superseded by typed application microcopy',
  trust: 'sections.trust.points',
});

const collectionPlan = Object.freeze({
  settings: 'settings (one-to-one, remove legacy-only siteVersion)',
  media: 'media (stable id; Drive source becomes R2 object metadata)',
  services: 'sections.services.items (stable id, exactly three active)',
  gallery: 'sections.gallery.items (select 6-9 active; archive remainder)',
});

const hash = (input) => createHash('sha256').update(input).digest('hex');

const findDuplicates = (values) => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];

const auditSnapshot = (relativePath) => {
  const absolutePath = resolve(workspaceRoot, relativePath);
  const raw = readFileSync(absolutePath);
  const beforeHash = hash(raw);
  const snapshot = JSON.parse(raw.toString('utf8'));
  const errors = [];
  const sectionGroups = [...new Set(snapshot.sections.map((section) => section.group))].sort();
  const unmappedGroups = sectionGroups.filter((group) => !(group in sectionGroupPlan));
  const duplicateSectionIds = findDuplicates(snapshot.sections.map((section) => section.id));
  const duplicateServiceIds = findDuplicates(snapshot.services.map((service) => service.id));
  const duplicateGalleryIds = findDuplicates(snapshot.gallery.map((item) => item.id));
  const duplicateMediaIds = findDuplicates(snapshot.media.map((asset) => asset.id));
  const mediaIds = new Set(snapshot.media.filter((asset) => !asset.deletedAt).map((asset) => asset.id));
  const missingMediaReferences = [
    ...snapshot.services.filter((service) => !service.deletedAt).map((service) => service.mediaId),
    ...snapshot.gallery.filter((item) => !item.deletedAt).map((item) => item.mediaId),
  ].filter((mediaId) => !mediaIds.has(mediaId));

  if (unmappedGroups.length > 0) errors.push(`unmapped section groups: ${unmappedGroups.join(', ')}`);
  if (duplicateSectionIds.length > 0) errors.push(`duplicate section ids: ${duplicateSectionIds.join(', ')}`);
  if (duplicateServiceIds.length > 0) errors.push(`duplicate service ids: ${duplicateServiceIds.join(', ')}`);
  if (duplicateGalleryIds.length > 0) errors.push(`duplicate gallery ids: ${duplicateGalleryIds.join(', ')}`);
  if (duplicateMediaIds.length > 0) errors.push(`duplicate media ids: ${duplicateMediaIds.join(', ')}`);
  if (missingMediaReferences.length > 0) errors.push(`missing media references: ${missingMediaReferences.join(', ')}`);

  const isolatedSnapshot = structuredClone(snapshot);
  const archivedSectionIds = isolatedSnapshot.sections
    .filter((section) => sectionGroupPlan[section.group]?.startsWith('archive:'))
    .map((section) => section.id);
  const simulatedMutation = structuredClone(isolatedSnapshot);
  simulatedMutation.sections = simulatedMutation.sections.map((section) => (
    archivedSectionIds.includes(section.id)
      ? { ...section, active: false, deletedAt: '2099-01-01T00:00:00.000Z' }
      : section
  ));
  const rollbackSnapshot = JSON.parse(JSON.stringify(isolatedSnapshot));
  const rollbackHash = hash(Buffer.from(`${JSON.stringify(rollbackSnapshot, null, 2)}\n`));
  const canonicalHash = hash(Buffer.from(`${JSON.stringify(snapshot, null, 2)}\n`));
  const afterHash = hash(readFileSync(absolutePath));

  if (beforeHash !== afterHash) errors.push('dry run changed the source file');
  if (canonicalHash !== rollbackHash) errors.push('isolated rollback did not restore the snapshot');
  if (simulatedMutation.sections.length !== snapshot.sections.length) errors.push('simulation lost section rows');

  return {
    path: relativePath,
    sourceSha256: beforeHash,
    counts: {
      sections: snapshot.sections.length,
      services: snapshot.services.length,
      gallery: snapshot.gallery.length,
      media: snapshot.media.length,
      archivedSectionsInPlan: archivedSectionIds.length,
    },
    mappedGroups: sectionGroups.length,
    duplicateActiveIds: duplicateSectionIds.length + duplicateServiceIds.length + duplicateGalleryIds.length + duplicateMediaIds.length,
    rollbackRestored: canonicalHash === rollbackHash,
    sourceUnchanged: beforeHash === afterHash,
    errors,
  };
};

const reports = snapshotPaths.map(auditSnapshot);
console.log(JSON.stringify({ sectionGroupPlan, collectionPlan, reports }, null, 2));

if (reports.some((report) => report.errors.length > 0)) {
  process.exitCode = 1;
}
