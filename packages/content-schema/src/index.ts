import { z } from 'zod';

export * from './publicSite';
export * from './media';
export * from './contact';

export const galleryCategoryIds = ['all', 'tables', 'trays', 'salads', 'coffee', 'fish'] as const;

export const editableGalleryCategorySchema = z.enum(['tables', 'trays', 'salads', 'coffee', 'fish']);

export const imageAssetSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).optional(),
  src: z.string().min(1),
  width: z.coerce.number().int().positive(),
  height: z.coerce.number().int().positive(),
  sizes: z.string().min(1).optional(),
  responsive: z.coerce.boolean().default(true),
  driveFileId: z.string().optional(),
  usageNotes: z.string().optional(),
  deletedAt: z.string().optional(),
});

export const galleryItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  alt: z.string().min(1),
  category: editableGalleryCategorySchema,
  order: z.coerce.number().int().nonnegative(),
  active: z.coerce.boolean().default(true),
  tall: z.coerce.boolean().default(false),
  mediaId: z.string().min(1),
  driveFileId: z.string().optional(),
  deletedAt: z.string().optional(),
});

export const siteSettingsSchema = z.object({
  email: z.string().email(),
  siteVersion: z.string().min(1),
  seoTitle: z.string().min(1).optional(),
  seoDescription: z.string().min(1).optional(),
});

export const serviceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  description: z.string().min(1),
  bestFor: z.string().min(1),
  promise: z.string().min(1),
  details: z.array(z.string().min(1)),
  cta: z.string().min(1),
  mediaId: z.string().min(1),
  icon: z.string().min(1),
  active: z.coerce.boolean().default(true),
  order: z.coerce.number().int().nonnegative().default(0),
  deletedAt: z.string().optional(),
});

export const sectionBlockSchema = z.object({
  id: z.string().min(1),
  group: z.string().min(1),
  title: z.string().min(1).optional(),
  text: z.string().min(1).optional(),
  items: z.array(z.string().min(1)).default([]),
  active: z.coerce.boolean().default(true),
  order: z.coerce.number().int().default(0),
  deletedAt: z.string().optional(),
});

export const contentSnapshotSchema = z.object({
  version: z.string().min(1),
  updatedAt: z.string().datetime(),
  settings: siteSettingsSchema,
  media: z.array(imageAssetSchema),
  gallery: z.array(galleryItemSchema),
  services: z.array(serviceSchema).default([]),
  sections: z.array(sectionBlockSchema).default([]),
});

export type ContentSnapshot = z.infer<typeof contentSnapshotSchema>;

export type EditableGalleryCategory = z.infer<typeof editableGalleryCategorySchema>;
export type ImageAssetRecord = z.infer<typeof imageAssetSchema>;
export type GalleryItemRecord = z.infer<typeof galleryItemSchema>;
export type SiteSettingsRecord = z.infer<typeof siteSettingsSchema>;
export type ServiceRecord = z.infer<typeof serviceSchema>;
export type SectionBlockRecord = z.infer<typeof sectionBlockSchema>;

export type PreviewCopySectionFallback = {
  readonly eyebrow: string;
  readonly title: string;
  readonly text?: string;
  readonly extraText?: string;
};

export type MediaUsageKind = 'hero' | 'manifesto' | 'gallery' | 'service';

export type MediaUsageEntry = {
  readonly kind: MediaUsageKind;
  readonly id: string;
  readonly title: string;
  readonly active: boolean;
};

export const contentFieldHelp = {
  siteAreas: {
    hero: {
      label: 'מסך פתיחה',
      help: 'הדבר הראשון שרואים באתר: כותרת גדולה, טקסט וכפתור וואטסאפ.',
    },
    services: {
      label: 'מה מזמינים',
      help: 'כרטיסי השירות המרכזיים שמסבירים מה אפשר להזמין.',
    },
    gallery: {
      label: 'גלריה',
      help: 'התמונות שמופיעות בגלריה הציבורית, כולל סדר וקטגוריות.',
    },
    media: {
      label: 'ספריית תמונות',
      help: 'תמונות המקור בדרייב ומה שנוצר מהן לאתר.',
    },
  },
  media: {
    title: {
      label: 'שם תמונה',
      help: 'השם הפנימי בעברית שמופיע בסטודיו ועוזר לזהות את התמונה מהר.',
    },
    driveFileId: {
      label: 'מקור בדרייב',
      help: 'קובץ המקור שממנו נוצרות תמונות האתר בזמן פרסום.',
    },
    src: {
      label: 'כתובת באתר אחרי פרסום',
      help: 'כתובת סטטית מהירה שנוצרת מתוך Drive בזמן build.',
    },
  },
  gallery: {
    active: {
      label: 'מוצג באתר',
      help: 'אם כבוי, התמונה נשמרת בסטודיו אבל לא מופיעה בגלריה.',
    },
    tall: {
      label: 'תמונה גבוהה',
      help: 'נותן לתמונה מקום אנכי גדול יותר בגלריה.',
    },
    mediaId: {
      label: 'תמונה מחוברת',
      help: 'איזה קובץ מדיה יוצג בפריט הגלריה.',
    },
  },
} as const;

export const parseBoolean = (value: unknown, defaultValue = false) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'כן'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'n', 'לא'].includes(normalized)) {
      return false;
    }
  }

  return defaultValue;
};

export const sortActiveGallery = (items: readonly GalleryItemRecord[]) =>
  [...items].filter((item) => item.active && !item.deletedAt).sort((left, right) => left.order - right.order);

export const sortActiveServices = (items: readonly ServiceRecord[]) =>
  [...items]
    .filter((item) => item.active && !item.deletedAt)
    .sort((left, right) => left.order - right.order);

export const sortActiveSections = (items: readonly SectionBlockRecord[], group?: string) =>
  [...items]
    .filter((item) => item.active && !item.deletedAt && (!group || item.group === group))
    .sort((left, right) => left.order - right.order);

export const getActiveSectionsByGroup = (content: ContentSnapshot, group: string) =>
  sortActiveSections(content.sections, group);

export const getPreviewCopySection = (
  content: ContentSnapshot,
  id: string,
  fallback: PreviewCopySectionFallback,
) => {
  const section = content.sections.find((item) => item.id === `copy-${id}` && item.group === 'site-copy' && item.active && !item.deletedAt);

  return {
    eyebrow: section?.items[0] || fallback.eyebrow,
    title: section?.title || fallback.title,
    text: section?.text || fallback.text,
    extraText: section?.items[1] || fallback.extraText,
  };
};

export const getPreviewMicrocopy = (content: ContentSnapshot, id: string, fallback: string) => (
  content.sections.find((item) => item.id === `microcopy-${id}` && item.group === 'site-microcopy' && item.active && !item.deletedAt)?.text || fallback
);

export const getPreviewMicrocopyItems = (content: ContentSnapshot, id: string, fallback: readonly string[]) => {
  const items = content.sections.find((item) => item.id === `microcopy-${id}` && item.group === 'site-microcopy' && item.active && !item.deletedAt)?.items;
  return items && items.length > 0 ? items : fallback;
};

export const splitPipeList = (value: string) =>
  value.split('|').map((item) => item.trim()).filter(Boolean);

export const joinPipeList = (items: readonly string[]) => items.join(' | ');

export const patchSectionItem = (
  section: SectionBlockRecord,
  index: number,
  value: string,
  fallback: string,
): Partial<SectionBlockRecord> => {
  const items = [...section.items];
  items[index] = value || fallback;
  return { items };
};

export const managedCopySectionId = (id: string) => `copy-${id}`;

export const getManagedCopySection = (content: ContentSnapshot, id: string) =>
  content.sections.find((section) => section.id === managedCopySectionId(id) && section.group === 'site-copy' && !section.deletedAt);

export const getMediaUsage = (mediaId: string, content: ContentSnapshot): readonly MediaUsageEntry[] => {
  const heroMedia = content.sections.find((section) => section.id === 'hero-media' && !section.deletedAt);
  const heroUsage = heroMedia?.items.includes(mediaId)
    ? [{ kind: 'hero', id: heroMedia.id, title: 'מסך פתיחה', active: heroMedia.active } satisfies MediaUsageEntry]
    : [];
  const manifestoUsage = content.sections
    .filter((section) => section.group === 'manifesto' && !section.deletedAt && section.items[1] === mediaId)
    .map((section): MediaUsageEntry => ({ kind: 'manifesto', id: section.id, title: section.title ?? 'השפה של Nis', active: section.active }));
  const galleryUsage = content.gallery
    .filter((item) => item.mediaId === mediaId && !item.deletedAt)
    .map((item): MediaUsageEntry => ({ kind: 'gallery', id: item.id, title: item.title, active: item.active }));
  const serviceUsage = content.services
    .filter((service) => service.mediaId === mediaId && !service.deletedAt)
    .map((service): MediaUsageEntry => ({ kind: 'service', id: service.id, title: service.title, active: service.active }));
  return [...heroUsage, ...manifestoUsage, ...galleryUsage, ...serviceUsage];
};

export const getActiveMediaUsages = (mediaId: string, content: ContentSnapshot) =>
  getMediaUsage(mediaId, content).filter((usage) => usage.active);

export const getMediaUsageKindLabel = (kind: MediaUsageKind) => {
  if (kind === 'gallery') return 'גלריה';
  if (kind === 'service') return 'שירות';
  if (kind === 'manifesto') return 'השפה של Nis';
  return 'מסך פתיחה';
};

export const formatMediaUsageList = (usages: readonly MediaUsageEntry[]) => usages
  .map((usage) => `- ${getMediaUsageKindLabel(usage.kind)}: ${usage.title}`)
  .join('\n');

export const getMediaLabel = (media: ImageAssetRecord, content: ContentSnapshot) => {
  if (media.title?.trim()) {
    return media.title.trim();
  }
  const firstGallery = content.gallery.find((item) => item.mediaId === media.id && !item.deletedAt);
  const firstService = content.services.find((service) => service.mediaId === media.id && !service.deletedAt);
  return firstGallery?.title ?? firstService?.title ?? media.id;
};

export const getMediaStatus = (media: ImageAssetRecord, content: ContentSnapshot) => {
  if (media.deletedAt) {
    return 'בארכיון';
  }
  if (!media.driveFileId) {
    return 'חסר מקור בדרייב';
  }
  if (getMediaUsage(media.id, content).length === 0) {
    return 'לא בשימוש באתר';
  }
  if (media.src.startsWith('/media/cms/')) {
    return 'תמונה תקינה';
  }
  return 'תיווצר באתר אחרי עדכון אתר';
};

export const validateContentReferences = (snapshot: ContentSnapshot) => {
  const issues: string[] = [];
  const mediaIds = new Set(snapshot.media.filter((media) => !media.deletedAt).map((media) => media.id));

  for (const item of snapshot.gallery) {
    if (item.deletedAt) {
      continue;
    }
    if (!mediaIds.has(item.mediaId)) {
      issues.push(`פריט הגלריה "${item.title}" מצביע לתמונה שלא קיימת: ${item.mediaId}`);
    }
  }

  for (const service of snapshot.services) {
    if (service.deletedAt) {
      continue;
    }
    if (!mediaIds.has(service.mediaId)) {
      issues.push(`השירות "${service.title}" מצביע לתמונה שלא קיימת: ${service.mediaId}`);
    }
  }

  for (const section of snapshot.sections) {
    if (section.deletedAt) {
      continue;
    }

    if (section.group === 'hero-media') {
      for (const mediaId of section.items) {
        if (!mediaIds.has(mediaId)) {
          issues.push(`תמונות מסך הפתיחה מצביעות לתמונה שלא קיימת: ${mediaId}`);
        }
      }
    }

    if (section.group === 'manifesto' && section.items[1] && !mediaIds.has(section.items[1])) {
      issues.push(`הכרטיס "${section.title ?? section.id}" באזור השפה של Nis מצביע לתמונה שלא קיימת: ${section.items[1]}`);
    }
  }

  return issues;
};
