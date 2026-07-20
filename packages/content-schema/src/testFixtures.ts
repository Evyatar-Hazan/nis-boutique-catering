import type { PublicSiteDocument } from './publicSite';

const image = (id: string) => ({
  alt: `תיאור ${id}`,
  checksum: `checksum-${id}-1234567890`,
  height: 800,
  id,
  kind: 'image' as const,
  mimeType: 'image/webp' as const,
  objectKey: `images/${id}.webp`,
  sizeBytes: 100_000,
  title: id,
  width: 1200,
});

export const createPublicSiteDocument = (
  version = 'revision-1',
): PublicSiteDocument => ({
  media: Array.from({ length: 10 }, (_, index) => image(`image-${index + 1}`)),
  schemaVersion: 2,
  sections: {
    contact: {
      faqs: [1, 2, 3].map((number) => ({
        answer: `תשובה ברורה לשאלה ${number}.`,
        id: `faq-${number}`,
        question: `שאלה נפוצה ${number}?`,
      })),
      submitCta: { label: 'שלחו פנייה', message: 'אשמח לקבל פרטים.' },
      title: 'שאלות ויצירת קשר',
    },
    gallery: {
      cta: { label: 'אהבתם?', message: 'אשמח לתכנן אירוח.' },
      items: [1, 2, 3, 4, 5, 6].map((order) => ({
        category: order % 2 === 0 ? 'trays' as const : 'tables' as const,
        id: `gallery-${order}`,
        mediaId: `image-${order + 3}`,
        order,
        title: `תמונה ${order}`,
      })),
      title: 'גלריה',
    },
    hero: {
      description: 'אוכל לשבת, אירוח קטן ומארזים בהתאמה אישית.',
      mediaId: 'image-1',
      primaryCta: { label: 'דברו איתנו', message: 'אשמח לקבל פרטים.' },
      secondaryCta: { label: 'לגלריה', targetSection: 'gallery' },
      title: 'אירוח שנראה מוקפד ומרגיש ביתי',
      valuePoints: ['הכנה טרייה', 'הגשה מוכנה', 'תיאום אישי'],
    },
    process: {
      operationalNotes: [],
      steps: [1, 2, 3, 4].map((order) => ({
        description: 'תיאור קצר וברור של השלב.',
        id: `step-${order}`,
        order,
        title: `שלב ${order}`,
      })) as PublicSiteDocument['sections']['process']['steps'],
      title: 'איך מזמינים',
    },
    services: {
      items: [1, 2, 3].map((order) => ({
        active: true,
        bestFor: 'אירוח משפחתי',
        cta: { label: 'לפרטים', message: `אשמח לפרטים על שירות ${order}` },
        id: `service-${order}`,
        mediaId: `image-${order + 1}`,
        order,
        summary: 'שירות בוטיק מותאם לאירוח.',
        title: `שירות ${order}`,
      })) as PublicSiteDocument['sections']['services']['items'],
      title: 'מה אפשר להזמין',
    },
    trust: {
      mediaId: 'image-10',
      points: [1, 2, 3].map((number) => ({
        id: `trust-${number}`,
        text: 'פרט שמחזק את תחושת האמון.',
        title: `סיבה ${number}`,
      })) as PublicSiteDocument['sections']['trust']['points'],
      testimonials: [],
      title: 'למה לבחור ב־Nis',
    },
  },
  settings: {
    email: 'owner@example.com',
    phoneDisplay: '050-0000000',
    phoneHref: 'tel:+972500000000',
    seoDescription: 'קייטרינג בוטיק לאירוח מוקפד.',
    seoTitle: 'Nis Boutique Catering',
    whatsappBase: 'https://wa.me/972500000000',
  },
  updatedAt: '2026-07-20T00:00:00.000Z',
  version,
});
