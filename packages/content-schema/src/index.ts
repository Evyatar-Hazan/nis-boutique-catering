import { z } from 'zod';

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
  phoneDisplay: z.string().min(1),
  phoneHref: z.string().min(1),
  email: z.string().email(),
  whatsappBase: z.string().url(),
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

export type EditableGalleryCategory = z.infer<typeof editableGalleryCategorySchema>;
export type ImageAssetRecord = z.infer<typeof imageAssetSchema>;
export type GalleryItemRecord = z.infer<typeof galleryItemSchema>;
export type SiteSettingsRecord = z.infer<typeof siteSettingsSchema>;
export type ServiceRecord = z.infer<typeof serviceSchema>;
export type SectionBlockRecord = z.infer<typeof sectionBlockSchema>;
export type ContentSnapshot = z.infer<typeof contentSnapshotSchema>;

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
  settings: {
    phoneDisplay: {
      label: 'טלפון שמוצג באתר',
      help: 'מופיע בכפתורי יצירת קשר ובאזור הסיום.',
    },
    phoneHref: {
      label: 'קישור טלפון',
      help: 'הקישור שלחיצה עליו פותחת שיחה במובייל.',
    },
    whatsappBase: {
      label: 'קישור WhatsApp',
      help: 'כל כפתורי הוואטסאפ באתר משתמשים בכתובת הזו.',
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
