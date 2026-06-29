import type { ContentSnapshot, GalleryItemRecord, ImageAssetRecord, SectionBlockRecord, ServiceRecord } from '@monorepo/content-schema';
import { cmsSrcFor } from './assetUrlHelpers';

const archiveDate = () => new Date().toISOString();

const updateById = <T extends { id: string }>(items: readonly T[], id: string, patch: Partial<T>) =>
  items.map((item) => (item.id === id ? { ...item, ...patch } : item));

export const normalizeMediaId = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'media-new';

export const updateGalleryInSnapshot = (current: ContentSnapshot, id: string, patch: Partial<GalleryItemRecord>): ContentSnapshot => ({
  ...current,
  gallery: updateById(current.gallery, id, patch),
});

export const updateMediaInSnapshot = (current: ContentSnapshot, id: string, patch: Partial<ImageAssetRecord>): ContentSnapshot => ({
  ...current,
  media: updateById(current.media, id, patch),
});

export const updateServiceInSnapshot = (current: ContentSnapshot, id: string, patch: Partial<ServiceRecord>): ContentSnapshot => ({
  ...current,
  services: updateById(current.services, id, patch),
});

export const updateSectionInSnapshot = (current: ContentSnapshot, id: string, patch: Partial<SectionBlockRecord>): ContentSnapshot => ({
  ...current,
  sections: updateById(current.sections, id, patch),
});

export const renameMediaInSnapshot = (current: ContentSnapshot, id: string, nextId: string): ContentSnapshot => {
  const cleanId = normalizeMediaId(nextId);
  return {
    ...current,
    media: current.media.map((media) => (media.id === id ? { ...media, id: cleanId, src: media.driveFileId ? cmsSrcFor(cleanId) : media.src } : media)),
    gallery: current.gallery.map((item) => (item.mediaId === id ? { ...item, mediaId: cleanId } : item)),
    services: current.services.map((service) => (service.mediaId === id ? { ...service, mediaId: cleanId } : service)),
    sections: current.sections.map((section) => (
      section.group === 'hero-media' || section.group === 'manifesto'
        ? { ...section, items: section.items.map((item) => (item === id ? cleanId : item)) }
        : section
    )),
  };
};

export const archiveGalleryItemInSnapshot = (current: ContentSnapshot, id: string): ContentSnapshot =>
  updateGalleryInSnapshot(current, id, { active: false, deletedAt: archiveDate() });

export const restoreGalleryItemInSnapshot = (current: ContentSnapshot, id: string): ContentSnapshot =>
  updateGalleryInSnapshot(current, id, { deletedAt: undefined });

export const archiveServiceInSnapshot = (current: ContentSnapshot, id: string): ContentSnapshot =>
  updateServiceInSnapshot(current, id, { active: false, deletedAt: archiveDate() });

export const restoreServiceInSnapshot = (current: ContentSnapshot, id: string): ContentSnapshot =>
  updateServiceInSnapshot(current, id, { deletedAt: undefined });

export const archiveSectionInSnapshot = (current: ContentSnapshot, id: string): ContentSnapshot =>
  updateSectionInSnapshot(current, id, { active: false, deletedAt: archiveDate() });

export const restoreSectionInSnapshot = (current: ContentSnapshot, id: string): ContentSnapshot =>
  updateSectionInSnapshot(current, id, { deletedAt: undefined });

export const archiveMediaInSnapshot = (current: ContentSnapshot, id: string): ContentSnapshot =>
  updateMediaInSnapshot(current, id, { deletedAt: archiveDate() });

export const restoreMediaInSnapshot = (current: ContentSnapshot, id: string): ContentSnapshot =>
  updateMediaInSnapshot(current, id, { deletedAt: undefined });

export const archiveSelectedMediaInSnapshot = (current: ContentSnapshot, targetIds: readonly string[]): ContentSnapshot => ({
  ...current,
  media: current.media.map((media) => (targetIds.includes(media.id) ? { ...media, deletedAt: archiveDate() } : media)),
});

export const restoreSelectedMediaInSnapshot = (current: ContentSnapshot, targetIds: readonly string[]): ContentSnapshot => ({
  ...current,
  media: current.media.map((media) => (targetIds.includes(media.id) ? { ...media, deletedAt: undefined } : media)),
});

export const moveGalleryItemInSnapshot = (current: ContentSnapshot, id: string, direction: -1 | 1): ContentSnapshot => {
  const sorted = [...current.gallery].sort((left, right) => left.order - right.order);
  const index = sorted.findIndex((item) => item.id === id);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= sorted.length) {
    return current;
  }
  const currentItem = sorted[index];
  const nextItem = sorted[nextIndex];
  return {
    ...current,
    gallery: current.gallery.map((item) => {
      if (item.id === currentItem.id) return { ...item, order: nextItem.order };
      if (item.id === nextItem.id) return { ...item, order: currentItem.order };
      return item;
    }),
  };
};

export const normalizeCmsMetadataInSnapshot = (current: ContentSnapshot): ContentSnapshot => ({
  ...current,
  media: current.media.map((media) => (media.driveFileId ? { ...media, src: cmsSrcFor(media.id), responsive: true } : media)),
  gallery: current.gallery.map((item, index) => ({ ...item, order: index + 1, driveFileId: undefined })),
});

export const getGalleryItemForMedia = (mediaId: string, content: ContentSnapshot) => (
  content.gallery.find((item) => item.mediaId === mediaId && !item.deletedAt) ?? null
);

export const makeGalleryItem = (
  content: ContentSnapshot,
  getMediaLabel: (media: ImageAssetRecord, content: ContentSnapshot) => string,
  mediaId?: string,
): GalleryItemRecord => {
  const media = mediaId ? content.media.find((item) => item.id === mediaId) : undefined;
  const title = media ? getMediaLabel(media, content) : 'תמונה חדשה';

  return {
    id: `gallery-${content.gallery.length + 1}`,
    title,
    alt: media ? `תיאור נגיש עבור ${title}` : 'תיאור נגיש לתמונה חדשה',
    category: 'trays',
    order: content.gallery.length + 1,
    active: Boolean(media),
    tall: false,
    mediaId: media?.id ?? content.media.find((item) => !item.deletedAt)?.id ?? '',
  };
};

export const addGalleryItemToSnapshot = (
  current: ContentSnapshot,
  getMediaLabel: (media: ImageAssetRecord, content: ContentSnapshot) => string,
  mediaId?: string,
): ContentSnapshot => ({
  ...current,
  gallery: [...current.gallery, makeGalleryItem(current, getMediaLabel, mediaId)],
});

export const duplicateGalleryItemInSnapshot = (current: ContentSnapshot, item: GalleryItemRecord): ContentSnapshot => ({
  ...current,
  gallery: [
    ...current.gallery,
    {
      ...item,
      id: `${item.id}-copy-${current.gallery.length + 1}`,
      title: `${item.title} - עותק`,
      order: current.gallery.length + 1,
      active: false,
      deletedAt: undefined,
    },
  ],
});

export const addServiceToSnapshot = (current: ContentSnapshot): ContentSnapshot => ({
  ...current,
  services: [
    ...current.services,
    {
      id: `service-${current.services.length + 1}`,
      title: 'שירות חדש',
      subtitle: 'משפט קצר שמסביר את השירות',
      description: 'כאן כותבים מה הלקוח מקבל בשירות הזה.',
      bestFor: 'למי זה מתאים',
      promise: 'מה מבטיחים ללקוח',
      details: ['פרט ראשון', 'פרט שני'],
      cta: 'דברו איתנו',
      mediaId: current.media.find((media) => !media.deletedAt)?.id ?? '',
      icon: 'Sparkles',
      active: false,
      order: current.services.length + 1,
    },
  ],
});

export const duplicateServiceInSnapshot = (current: ContentSnapshot, service: ServiceRecord): ContentSnapshot => ({
  ...current,
  services: [
    ...current.services,
    {
      ...service,
      id: `${service.id}-copy-${current.services.length + 1}`,
      title: `${service.title} - עותק`,
      active: false,
      order: current.services.length + 1,
      deletedAt: undefined,
    },
  ],
});

export const addSectionToSnapshot = (current: ContentSnapshot, group = 'general'): ContentSnapshot => ({
  ...current,
  sections: [
    ...current.sections,
    {
      id: `${group}-${current.sections.filter((section) => section.group === group).length + 1}`,
      group,
      title: 'מקטע חדש',
      text: 'טקסט לעריכה',
      items: [],
      active: false,
      order: current.sections.filter((section) => section.group === group).length + 1,
    },
  ],
});

export const duplicateSectionInSnapshot = (current: ContentSnapshot, section: SectionBlockRecord): ContentSnapshot => ({
  ...current,
  sections: [
    ...current.sections,
    {
      ...section,
      id: `${section.id}-copy-${current.sections.filter((item) => item.group === section.group).length + 1}`,
      title: `${section.title ?? 'מקטע'} - עותק`,
      active: false,
      order: current.sections.filter((item) => item.group === section.group).length + 1,
      deletedAt: undefined,
    },
  ],
});
