import { z } from 'zod';

export const galleryCategoryIds = ['all', 'tables', 'trays', 'salads', 'coffee', 'fish'] as const;

export const editableGalleryCategorySchema = z.enum(['tables', 'trays', 'salads', 'coffee', 'fish']);

export const imageAssetSchema = z.object({
  id: z.string().min(1),
  src: z.string().min(1),
  width: z.coerce.number().int().positive(),
  height: z.coerce.number().int().positive(),
  sizes: z.string().min(1).optional(),
  responsive: z.coerce.boolean().default(true),
  driveFileId: z.string().optional(),
  usageNotes: z.string().optional(),
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
});

export const sectionBlockSchema = z.object({
  id: z.string().min(1),
  group: z.string().min(1),
  title: z.string().min(1).optional(),
  text: z.string().min(1).optional(),
  items: z.array(z.string().min(1)).default([]),
  active: z.coerce.boolean().default(true),
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
  [...items].filter((item) => item.active).sort((left, right) => left.order - right.order);
