import { z } from 'zod';

export const publicSiteSchemaVersion = 2 as const;

const idSchema = z.string().trim().min(1).max(120);
const shortTextSchema = z.string().trim().min(1).max(180);
const bodyTextSchema = z.string().trim().min(1).max(1_200);
const timestampSchema = z.string().datetime();

const sectionHeadingSchema = z.object({
  eyebrow: shortTextSchema.optional(),
  title: shortTextSchema,
  description: bodyTextSchema.optional(),
});

const whatsappCtaSchema = z.object({
  label: shortTextSchema,
  message: bodyTextSchema,
});

export const publicMediaAssetSchema = z.discriminatedUnion('kind', [
  z.object({
    id: idSchema,
    kind: z.literal('image'),
    objectKey: z.string().trim().min(1).max(500),
    title: shortTextSchema,
    alt: shortTextSchema,
    mimeType: z.enum(['image/avif', 'image/jpeg', 'image/png', 'image/webp']),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    sizeBytes: z.number().int().positive(),
    checksum: z.string().trim().min(16).max(128),
    archivedAt: timestampSchema.optional(),
  }),
  z.object({
    id: idSchema,
    kind: z.literal('video'),
    objectKey: z.string().trim().min(1).max(500),
    title: shortTextSchema,
    mimeType: z.enum(['video/mp4', 'video/webm']),
    sizeBytes: z.number().int().positive(),
    checksum: z.string().trim().min(16).max(128),
    posterMediaId: idSchema,
    archivedAt: timestampSchema.optional(),
  }),
]);

const heroSectionSchema = sectionHeadingSchema.extend({
  description: bodyTextSchema,
  primaryCta: whatsappCtaSchema,
  secondaryCta: z.object({
    label: shortTextSchema,
    targetSection: z.literal('gallery'),
  }),
  valuePoints: z.array(shortTextSchema).length(3),
  mediaId: idSchema,
});

const serviceOfferSchema = z.object({
  id: idSchema,
  title: shortTextSchema,
  summary: bodyTextSchema,
  bestFor: shortTextSchema,
  mediaId: idSchema,
  cta: whatsappCtaSchema,
  order: z.number().int().min(1).max(3),
  active: z.boolean().default(true),
});

const servicesSectionSchema = sectionHeadingSchema.extend({
  items: z.array(serviceOfferSchema).length(3),
});

export const publicGalleryCategorySchema = z.enum(['tables', 'trays', 'dishes']);

const galleryItemSchemaV2 = z.object({
  id: idSchema,
  title: shortTextSchema,
  category: publicGalleryCategorySchema,
  mediaId: idSchema,
  order: z.number().int().min(1).max(9),
});

const gallerySectionSchema = sectionHeadingSchema.extend({
  items: z.array(galleryItemSchemaV2).min(6).max(9),
  videoMediaId: idSchema.optional(),
  cta: whatsappCtaSchema,
});

const processSectionSchema = sectionHeadingSchema.extend({
  steps: z.array(z.object({
    id: idSchema,
    title: shortTextSchema,
    description: bodyTextSchema,
    order: z.number().int().min(1).max(4),
  })).length(4),
  operationalNotes: z.array(z.object({
    id: idSchema,
    title: shortTextSchema,
    text: bodyTextSchema,
  })).max(3).default([]),
});

const trustSectionSchema = sectionHeadingSchema.extend({
  points: z.array(z.object({
    id: idSchema,
    title: shortTextSchema,
    text: bodyTextSchema,
  })).length(3),
  mediaId: idSchema,
  testimonials: z.array(z.object({
    id: idSchema,
    quote: bodyTextSchema,
    attribution: shortTextSchema,
    source: z.string().trim().url(),
  })).default([]),
});

const contactSectionSchema = sectionHeadingSchema.extend({
  faqs: z.array(z.object({
    id: idSchema,
    question: shortTextSchema,
    answer: bodyTextSchema,
  })).min(3).max(4),
  submitCta: whatsappCtaSchema,
});

export const publicSiteDocumentSchema = z.object({
  schemaVersion: z.literal(publicSiteSchemaVersion),
  version: idSchema,
  updatedAt: timestampSchema,
  settings: z.object({
    phoneDisplay: shortTextSchema,
    phoneHref: z.string().trim().regex(/^tel:\+?[0-9]+$/),
    email: z.string().trim().email(),
    whatsappBase: z.string().trim().url(),
    seoTitle: shortTextSchema,
    seoDescription: bodyTextSchema,
  }),
  media: z.array(publicMediaAssetSchema),
  sections: z.object({
    hero: heroSectionSchema,
    services: servicesSectionSchema,
    gallery: gallerySectionSchema,
    process: processSectionSchema,
    trust: trustSectionSchema,
    contact: contactSectionSchema,
  }).strict(),
}).superRefine((document, context) => {
  const activeMediaIds = new Set(document.media.filter((asset) => !asset.archivedAt).map((asset) => asset.id));
  const imageMediaIds = new Set(document.media.filter((asset) => asset.kind === 'image' && !asset.archivedAt).map((asset) => asset.id));
  const videoMediaIds = new Set(document.media.filter((asset) => asset.kind === 'video' && !asset.archivedAt).map((asset) => asset.id));
  const referencedImages = [
    document.sections.hero.mediaId,
    document.sections.trust.mediaId,
    ...document.sections.services.items.map((item) => item.mediaId),
    ...document.sections.gallery.items.map((item) => item.mediaId),
  ];

  for (const mediaId of referencedImages) {
    if (!imageMediaIds.has(mediaId)) {
      context.addIssue({
        code: 'custom',
        message: `Image media reference is missing or archived: ${mediaId}`,
        path: ['media'],
      });
    }
  }

  const videoMediaId = document.sections.gallery.videoMediaId;
  if (videoMediaId && !videoMediaIds.has(videoMediaId)) {
    context.addIssue({
      code: 'custom',
      message: `Video media reference is missing or archived: ${videoMediaId}`,
      path: ['sections', 'gallery', 'videoMediaId'],
    });
  }

  for (const asset of document.media) {
    if (asset.kind === 'video' && !activeMediaIds.has(asset.posterMediaId)) {
      context.addIssue({
        code: 'custom',
        message: `Video poster reference is missing or archived: ${asset.posterMediaId}`,
        path: ['media'],
      });
    }
  }

  const uniqueGroups: ReadonlyArray<readonly [string, readonly string[]]> = [
    ['media', document.media.map((asset) => asset.id)],
    ['services', document.sections.services.items.map((item) => item.id)],
    ['gallery', document.sections.gallery.items.map((item) => item.id)],
    ['process', document.sections.process.steps.map((item) => item.id)],
    ['trust', document.sections.trust.points.map((item) => item.id)],
    ['faqs', document.sections.contact.faqs.map((item) => item.id)],
  ];

  for (const [group, ids] of uniqueGroups) {
    if (new Set(ids).size !== ids.length) {
      context.addIssue({ code: 'custom', message: `Duplicate IDs in ${group}`, path: ['sections'] });
    }
  }

  const orderedGroups: ReadonlyArray<readonly [string, readonly number[]]> = [
    ['services', document.sections.services.items.map((item) => item.order)],
    ['gallery', document.sections.gallery.items.map((item) => item.order)],
    ['process', document.sections.process.steps.map((item) => item.order)],
  ];

  for (const [group, orders] of orderedGroups) {
    if (new Set(orders).size !== orders.length) {
      context.addIssue({ code: 'custom', message: `Duplicate order values in ${group}`, path: ['sections', group] });
    }
  }
});

export type PublicMediaAsset = z.infer<typeof publicMediaAssetSchema>;
export type PublicGalleryCategory = z.infer<typeof publicGalleryCategorySchema>;
export type PublicSiteDocument = z.infer<typeof publicSiteDocumentSchema>;
