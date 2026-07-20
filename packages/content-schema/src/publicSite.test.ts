import { describe, expect, it } from 'vitest';
import {
  getPublicMediaReferenceIds,
  publicHeroDefaults,
  publicContactDefaults,
  publicProcessDefaults,
  publicServicesDefaults,
  publicSiteDocumentSchema,
  publicTrustDefaults,
  type PublicSiteDocument,
} from './publicSite';

const image = (id: string) => ({
  id,
  kind: 'image' as const,
  objectKey: `images/${id}.webp`,
  title: id,
  alt: `תיאור ${id}`,
  mimeType: 'image/webp' as const,
  width: 1200,
  height: 800,
  sizeBytes: 100_000,
  checksum: `checksum-${id}-1234567890`,
});

const media = Array.from({ length: 10 }, (_, index) => image(`image-${index + 1}`));

const validDocument: PublicSiteDocument = {
  schemaVersion: 2,
  version: 'revision-1',
  updatedAt: '2026-07-20T00:00:00.000Z',
  settings: {
    phoneDisplay: '050-3502615',
    phoneHref: 'tel:+972503502615',
    email: 'nisboutiquecatering@gmail.com',
    whatsappBase: 'https://wa.me/972503502615',
    seoTitle: 'Nis Boutique Catering',
    seoDescription: 'קייטרינג בוטיק לאירוח מוקפד.',
  },
  media,
  sections: {
    hero: {
      title: 'אירוח שנראה מוקפד ומרגיש ביתי',
      description: 'אוכל לשבת, אירוח קטן ומארזים בהתאמה אישית.',
      primaryCta: { label: 'דברו איתנו', message: 'שלום Nis, אשמח לשמוע פרטים.' },
      secondaryCta: { label: 'לגלריה', targetSection: 'gallery' },
      valuePoints: ['הכנה טרייה', 'הגשה מוכנה', 'תיאום אישי'],
      mediaId: 'image-1',
    },
    services: {
      title: 'מה אפשר להזמין',
      items: [1, 2, 3].map((order) => ({
        id: `service-${order}`,
        title: `שירות ${order}`,
        summary: 'שירות בוטיק מותאם לאירוח.',
        bestFor: 'אירוח משפחתי',
        mediaId: `image-${order + 1}`,
        cta: { label: 'לפרטים', message: `אשמח לפרטים על שירות ${order}` },
        order,
        active: true,
      })) as PublicSiteDocument['sections']['services']['items'],
    },
    gallery: {
      title: 'גלריה',
      items: [1, 2, 3, 4, 5, 6].map((order) => ({
        id: `gallery-${order}`,
        title: `תמונה ${order}`,
        category: order % 2 === 0 ? 'trays' : 'tables',
        mediaId: `image-${order + 3}`,
        order,
      })),
      cta: { label: 'אהבתם?', message: 'אשמח לתכנן אירוח.' },
    },
    process: {
      title: 'איך מזמינים',
      steps: [1, 2, 3, 4].map((order) => ({
        id: `step-${order}`,
        title: `שלב ${order}`,
        description: 'תיאור קצר וברור של השלב.',
        order,
      })) as PublicSiteDocument['sections']['process']['steps'],
      operationalNotes: [],
    },
    trust: {
      title: 'למה לבחור ב-Nis',
      points: [1, 2, 3].map((index) => ({
        id: `trust-${index}`,
        title: `נקודת אמון ${index}`,
        text: 'הסבר אמיתי וקצר.',
      })) as PublicSiteDocument['sections']['trust']['points'],
      mediaId: 'image-10',
      testimonials: [],
    },
    contact: {
      title: 'יוצרים קשר',
      faqs: [1, 2, 3].map((index) => ({
        id: `faq-${index}`,
        question: `שאלה ${index}?`,
        answer: 'תשובה ברורה ומאושרת.',
      })),
      submitCta: { label: 'המשיכו ל-WhatsApp', message: 'שלום Nis, אשמח להתקדם.' },
    },
  },
};

describe('public site v2 content contract', () => {
  it('keeps the approved hero copy and exactly three value points in one shared default', () => {
    expect(publicHeroDefaults.title).toBe('אירוח שנראה מוקפד ומרגיש ביתי.');
    expect(publicHeroDefaults.description).toBe('אוכל לשבת, אירוח קטן ומארזים לדרך בהתאמה אישית.');
    expect(publicHeroDefaults.valuePoints).toEqual(['הכנה טרייה', 'הגשה מוכנה', 'תיאום אישי']);
  });

  it('keeps the three approved public service names in fixed order', () => {
    expect(publicServicesDefaults.items.map(({ title }) => title)).toEqual(['אוכל לשבת', 'אירוח קטן', 'מארזים לדרך']);
    expect(publicServicesDefaults.items.map(({ order }) => order)).toEqual([1, 2, 3]);
  });

  it('keeps the approved process and operational notes in one shared source', () => {
    expect(publicProcessDefaults.steps.map(({ title, order }) => ({ title, order }))).toEqual([
      { title: 'שולחים פרטים בוואטסאפ', order: 1 },
      { title: 'מדייקים את ההזמנה', order: 2 },
      { title: 'Nis מכינה ואורזת', order: 3 },
      { title: 'אוספים או מקבלים במשלוח', order: 4 },
    ]);
    expect(publicProcessDefaults.operationalNotes).toHaveLength(3);
  });

  it('keeps exactly three approved trust points and no unverified testimonials', () => {
    expect(publicTrustDefaults.points.map(({ title }) => title)).toEqual([
      'אוכל טרי ומוקפד',
      'הגשה אסתטית ומוכנה לשולחן',
      'התאמה אישית ושירות אנושי',
    ]);
    expect(publicTrustDefaults.testimonials).toHaveLength(0);
  });

  it('keeps four approved FAQs and one WhatsApp conversion CTA', () => {
    expect(publicContactDefaults.faqs).toHaveLength(4);
    expect(new Set(publicContactDefaults.faqs.map(({ id }) => id)).size).toBe(4);
    expect(publicContactDefaults.submitCta.label).toBe('שלחו פנייה בוואטסאפ');
  });

  it('accepts the exact six-section document', () => {
    const result = publicSiteDocumentSchema.parse(validDocument);
    expect(Object.keys(result.sections)).toEqual(['hero', 'services', 'gallery', 'process', 'trust', 'contact']);
  });

  it('derives one unique referenced-media list for storage and build consumers', () => {
    const references = getPublicMediaReferenceIds(validDocument);
    expect(new Set(references)).toEqual(new Set(media.map((asset) => asset.id)));
    expect(references).toHaveLength(media.length);
  });

  it('rejects legacy or extra sections', () => {
    expect(() => publicSiteDocumentSchema.parse({
      ...validDocument,
      sections: { ...validDocument.sections, story: { title: 'ישן' } },
    })).toThrow();
  });

  it('enforces section item counts', () => {
    expect(() => publicSiteDocumentSchema.parse({
      ...validDocument,
      sections: {
        ...validDocument.sections,
        services: { ...validDocument.sections.services, items: validDocument.sections.services.items.slice(0, 2) },
      },
    })).toThrow();
  });

  it('rejects missing, archived, or wrong-kind media references', () => {
    expect(() => publicSiteDocumentSchema.parse({
      ...validDocument,
      sections: {
        ...validDocument.sections,
        hero: { ...validDocument.sections.hero, mediaId: 'missing' },
      },
    })).toThrow(/Image media reference is missing or archived/);
  });

  it('rejects duplicate IDs and order values', () => {
    expect(() => publicSiteDocumentSchema.parse({
      ...validDocument,
      sections: {
        ...validDocument.sections,
        services: {
          ...validDocument.sections.services,
          items: validDocument.sections.services.items.map((item) => ({ ...item, order: 1 })),
        },
      },
    })).toThrow(/Duplicate order values in services/);
  });
});
