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

export const publicHeroDefaults = {
  eyebrow: 'Nis Boutique Catering',
  title: 'אירוח שנראה מוקפד ומרגיש ביתי.',
  description: 'אוכל לשבת, אירוח קטן ומארזים לדרך בהתאמה אישית.',
  primaryCta: {
    label: 'דברו איתנו בוואטסאפ',
    message: 'אוכל לשבת, אירוח קטן או מארזים לדרך',
  },
  secondaryCta: {
    label: 'לגלריה',
    targetSection: 'gallery',
  },
  valuePoints: ['הכנה טרייה', 'הגשה מוכנה', 'תיאום אישי'],
  mediaId: 'salmon-skewers-lemon',
} as const;

export const publicServicesDefaults = {
  eyebrow: 'מה אפשר להזמין',
  title: 'שלוש דרכים לארח עם Nis.',
  description: 'בוחרים את סוג האירוח שמתאים לכם וממשיכים לשיחה קצרה בוואטסאפ.',
  items: [
    { id: 'shabbat-food', title: 'אוכל לשבת', ctaLabel: 'לפרטים על אוכל לשבת', message: 'אוכל לשבת', order: 1 },
    { id: 'small-hosting', title: 'אירוח קטן', ctaLabel: 'לפרטים על אירוח קטן', message: 'אירוח קטן', order: 2 },
    { id: 'travel-boxes', title: 'מארזים לדרך', ctaLabel: 'לפרטים על מארזים לדרך', message: 'מארזים לדרך', order: 3 },
  ],
} as const;

export const publicProcessDefaults = {
  eyebrow: 'איך מזמינים',
  title: 'ארבעה צעדים קצרים עד שהאירוח מוכן.',
  description: 'מתחילים בפרטים הבסיסיים ומסיימים באיסוף או במשלוח שתואמו מראש.',
  steps: [
    { id: 'process-whatsapp', title: 'שולחים פרטים בוואטסאפ', description: 'סוג האירוח, התאריך והכמות המשוערת.', order: 1 },
    { id: 'process-details', title: 'מדייקים את ההזמנה', description: 'מתאמים יחד את סוג האירוח, הכמות והפרטים החשובים.', order: 2 },
    { id: 'process-prepare', title: 'Nis מכינה ואורזת', description: 'האוכל מוכן ונארז בהתאם להזמנה שסוכמה.', order: 3 },
    { id: 'process-receive', title: 'אוספים או מקבלים במשלוח', description: 'אופן הקבלה והשעה נקבעים מראש בתיאום אישי.', order: 4 },
  ],
  operationalNotes: [
    { id: 'service-area', title: 'אזור פעילות', text: 'ביתר עילית והסביבה, בהתאם לתיאום.' },
    { id: 'collection-delivery', title: 'אופן קבלה', text: 'איסוף או משלוח נקבעים לפי ההזמנה והתיאום.' },
    { id: 'advance-coordination', title: 'תיאום מראש', text: 'תאריך, כמות וזמינות נסגרים בשיחה לפני אישור ההזמנה.' },
  ],
} as const;

export const publicTrustDefaults = {
  eyebrow: 'למה לבחור ב־Nis',
  title: 'אוכל, הגשה ושירות שאפשר לסמוך עליהם.',
  description: 'האמון נבנה במה שמגיע לשולחן ובדרך שבה מתאמים את ההזמנה.',
  mediaId: 'hosting-table-overview',
  points: [
    { id: 'fresh-careful-food', title: 'אוכל טרי ומוקפד', text: 'המנות מוכנות בתשומת לב לטעם, לסדר ולפרטים הקטנים.' },
    { id: 'table-ready-presentation', title: 'הגשה אסתטית ומוכנה לשולחן', text: 'המגשים והמארזים מגיעים מסודרים ונוחים לפתיחה ולהגשה.' },
    { id: 'personal-human-service', title: 'התאמה אישית ושירות אנושי', text: 'מתאמים ישירות את סוג האירוח, הכמות והפרטים החשובים לכם.' },
  ],
  testimonials: [],
} as const;

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
