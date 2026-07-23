import { publicSiteDocumentSchema } from '@monorepo/content-schema';
import { buildSiteSectionPreviewData } from '../buildSiteSectionPreviewData';

const image = {
  alt: 'שולחן אירוח מוכן',
  checksum: '1234567890abcdef',
  height: 800,
  id: 'image',
  kind: 'image' as const,
  mimeType: 'image/webp' as const,
  objectKey: 'test/image.webp',
  sizeBytes: 1_024,
  title: 'שולחן אירוח',
  width: 1_200,
};

const document = publicSiteDocumentSchema.parse({
  media: [image],
  schemaVersion: 2,
  sections: {
    contact: {
      description: 'התשובות החשובות מרוכזות במקום אחד.',
      eyebrow: 'שאלות ויצירת קשר',
      faqs: [
        { answer: 'תשובה ראשונה', id: 'faq-1', question: 'שאלה ראשונה?' },
        { answer: 'תשובה שנייה', id: 'faq-2', question: 'שאלה שנייה?' },
        { answer: 'תשובה שלישית', id: 'faq-3', question: 'שאלה שלישית?' },
        { answer: 'תשובה רביעית', id: 'faq-4', question: 'שאלה רביעית?' },
      ],
      submitCta: {
        label: 'שלחו פנייה בוואטסאפ',
        message: 'שלום Nis, אשמח לקבל פרטים על הזמנה.',
      },
      title: 'מספרים בקצרה מה צריך.',
    },
    gallery: {
      cta: { label: 'דברו איתנו', message: 'גלריה' },
      description: 'מבחר קטן מסגנון ההגשה.',
      eyebrow: 'גלריה',
      items: Array.from({ length: 6 }, (_, index) => ({
        category: index < 2 ? 'tables' : index < 4 ? 'trays' : 'dishes',
        id: `gallery-${index + 1}`,
        mediaId: image.id,
        order: index + 1,
        title: `תמונה ${index + 1}`,
      })),
      title: 'כך האירוח נראה.',
    },
    hero: {
      description: 'אוכל לשבת, אירוח קטן ומארזים לדרך.',
      eyebrow: 'Nis Boutique Catering',
      mediaId: image.id,
      primaryCta: { label: 'דברו איתנו בוואטסאפ', message: 'אירוח' },
      secondaryCta: { label: 'לגלריה', targetSection: 'gallery' },
      title: 'אירוח מוקפד שמרגיש ביתי.',
      valuePoints: ['הכנה טרייה', 'הגשה מוכנה', 'תיאום אישי'],
    },
    process: {
      description: 'ארבעה צעדים קצרים.',
      eyebrow: 'איך מזמינים',
      operationalNotes: [
        { id: 'note-1', text: 'ביתר עילית והסביבה.', title: 'אזור פעילות' },
        { id: 'note-2', text: 'איסוף או משלוח.', title: 'אופן קבלה' },
        { id: 'note-3', text: 'קובעים מראש.', title: 'תיאום מראש' },
      ],
      steps: [
        { description: 'פרטים ראשונים.', id: 'step-1', order: 1, title: 'שולחים פרטים בוואטסאפ' },
        { description: 'סוג וכמות.', id: 'step-2', order: 2, title: 'מדייקים את ההזמנה' },
        { description: 'הכנה ואריזה.', id: 'step-3', order: 3, title: 'Nis מכינה ואורזת' },
        { description: 'איסוף או משלוח.', id: 'step-4', order: 4, title: 'אוספים או מקבלים במשלוח' },
      ],
      title: 'ארבעה צעדים עד שהאירוח מוכן.',
    },
    services: {
      description: 'שלוש דרכים לארח.',
      eyebrow: 'מה אפשר להזמין',
      items: [
        {
          active: true,
          bestFor: 'משפחות',
          cta: { label: 'לפרטים על אוכל לשבת', message: 'אוכל לשבת' },
          id: 'service-1',
          mediaId: image.id,
          order: 1,
          summary: 'אוכל מוכן לשבת.',
          title: 'אוכל לשבת',
        },
        {
          active: true,
          bestFor: 'אירועים',
          cta: { label: 'לפרטים על אירוח קטן', message: 'אירוח קטן' },
          id: 'service-2',
          mediaId: image.id,
          order: 2,
          summary: 'אירוח קטן ומוקפד.',
          title: 'אירוח קטן',
        },
        {
          active: true,
          bestFor: 'נסיעות',
          cta: { label: 'לפרטים על מארזים לדרך', message: 'מארזים לדרך' },
          id: 'service-3',
          mediaId: image.id,
          order: 3,
          summary: 'מארזים מסודרים.',
          title: 'מארזים לדרך',
        },
      ],
      title: 'שלוש אפשרויות ברורות.',
    },
    trust: {
      description: 'אוכל ושירות שאפשר לסמוך עליהם.',
      eyebrow: 'למה לבחור ב־Nis',
      mediaId: image.id,
      points: [
        { id: 'trust-1', text: 'הכנה מוקפדת.', title: 'אוכל טרי ומוקפד' },
        { id: 'trust-2', text: 'מוכן לשולחן.', title: 'הגשה אסתטית ומוכנה לשולחן' },
        { id: 'trust-3', text: 'תיאום ישיר.', title: 'התאמה אישית ושירות אנושי' },
      ],
      testimonials: [],
      title: 'אוכל, הגשה ושירות.',
    },
  },
  settings: {
    email: 'nis@example.com',
    seoDescription: 'קייטרינג בוטיק',
    seoTitle: 'Nis',
  },
  updatedAt: '2026-07-23T00:00:00.000Z',
  version: 'test',
});

export const siteSectionPreviewDataFixture = buildSiteSectionPreviewData(document, {
  formLabels: {
    date: 'תאריך רצוי',
    guests: 'מספר סועדים',
    interest: 'במה אתם מתעניינים?',
    message: 'הודעה קצרה',
    name: 'שם מלא',
    phone: 'טלפון',
    phoneCta: 'התקשרו עכשיו',
  },
});
