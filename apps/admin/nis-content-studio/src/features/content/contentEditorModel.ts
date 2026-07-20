import type { PublicSiteDocument } from '@monorepo/content-schema';

export const editableSectionIds = ['hero', 'services', 'gallery', 'process', 'trust', 'contact'] as const;
export type EditableSectionId = typeof editableSectionIds[number];

export interface EditorOption {
  readonly label: string;
  readonly value: string;
}

export interface EditorField {
  readonly kind: 'checkbox' | 'media' | 'select' | 'text' | 'textarea';
  readonly label: string;
  readonly options?: readonly EditorOption[];
  readonly path: string;
}

export interface EditorGroup {
  readonly fields: readonly EditorField[];
  readonly title: string;
}

export const sectionLabels: Record<EditableSectionId, string> = {
  contact: 'יצירת קשר', gallery: 'גלריה', hero: 'פתיח', process: 'תהליך', services: 'שירותים', trust: 'אמון',
};

const field = (path: string, label: string, kind: EditorField['kind'] = 'text', options?: readonly EditorOption[]): EditorField =>
  ({ kind, label, options, path });

const headingFields = (sectionId: EditableSectionId): readonly EditorField[] => [
  field(`sections.${sectionId}.eyebrow`, 'כותרת קטנה'),
  field(`sections.${sectionId}.title`, 'כותרת ראשית'),
  field(`sections.${sectionId}.description`, 'תיאור', 'textarea'),
];

const imageOptions = (document: PublicSiteDocument): readonly EditorOption[] => document.media
  .flatMap((asset) => asset.kind === 'image' && !asset.archivedAt
    ? [{ label: `${asset.title} — ${asset.alt}`, value: asset.id }]
    : []);

const videoOptions = (document: PublicSiteDocument): readonly EditorOption[] => [
  { label: 'ללא וידאו', value: '' },
  ...document.media.filter((asset) => asset.kind === 'video' && !asset.archivedAt)
    .map((asset) => ({ label: asset.title, value: asset.id })),
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const buildEditorGroups = (
  document: PublicSiteDocument,
  sectionId: EditableSectionId,
): readonly EditorGroup[] => {
  const groups: EditorGroup[] = [{ fields: headingFields(sectionId), title: 'כותרות והסבר' }];

  if (sectionId === 'hero') {
    const section = document.sections.hero;
    groups.push({ title: 'פעולות ותמונה', fields: [
      field('sections.hero.primaryCta.label', 'טקסט כפתור ראשי'),
      field('sections.hero.primaryCta.message', 'הודעת וואטסאפ', 'textarea'),
      field('sections.hero.secondaryCta.label', 'טקסט כפתור גלריה'),
      field('sections.hero.mediaId', 'תמונה ראשית', 'media', imageOptions(document)),
      ...section.valuePoints.map((_, index) => field(`sections.hero.valuePoints.${index}`, `יתרון ${index + 1}`)),
    ] });
  }

  if (sectionId === 'services') {
    document.sections.services.items.forEach((_, index) => groups.push({ title: `שירות ${index + 1}`, fields: [
      field(`sections.services.items.${index}.title`, 'שם השירות'),
      field(`sections.services.items.${index}.summary`, 'תיאור השירות', 'textarea'),
      field(`sections.services.items.${index}.bestFor`, 'מתאים במיוחד ל־'),
      field(`sections.services.items.${index}.cta.label`, 'טקסט כפתור'),
      field(`sections.services.items.${index}.cta.message`, 'הודעת וואטסאפ', 'textarea'),
      field(`sections.services.items.${index}.mediaId`, 'תמונה', 'media', imageOptions(document)),
      field(`sections.services.items.${index}.active`, 'שירות פעיל', 'checkbox'),
    ] }));
  }

  if (sectionId === 'gallery') {
    groups.push({ title: 'פעולה ומדיה', fields: [
      field('sections.gallery.cta.label', 'טקסט פעולה'),
      field('sections.gallery.cta.message', 'הודעת וואטסאפ', 'textarea'),
      field('sections.gallery.videoMediaId', 'וידאו', 'select', videoOptions(document)),
    ] });
    document.sections.gallery.items.forEach((_, index) => groups.push({ title: `פריט גלריה ${index + 1}`, fields: [
      field(`sections.gallery.items.${index}.title`, 'כותרת'),
      field(`sections.gallery.items.${index}.category`, 'קטגוריה', 'select', [
        { label: 'שולחנות', value: 'tables' }, { label: 'מגשים', value: 'trays' }, { label: 'מנות', value: 'dishes' },
      ]),
      field(`sections.gallery.items.${index}.mediaId`, 'תמונה', 'media', imageOptions(document)),
    ] }));
  }

  if (sectionId === 'process') {
    document.sections.process.steps.forEach((_, index) => groups.push({ title: `שלב ${index + 1}`, fields: [
      field(`sections.process.steps.${index}.title`, 'כותרת'),
      field(`sections.process.steps.${index}.description`, 'תיאור', 'textarea'),
    ] }));
    document.sections.process.operationalNotes.forEach((_, index) => groups.push({ title: `מידע שימושי ${index + 1}`, fields: [
      field(`sections.process.operationalNotes.${index}.title`, 'כותרת'),
      field(`sections.process.operationalNotes.${index}.text`, 'טקסט', 'textarea'),
    ] }));
  }

  if (sectionId === 'trust') {
    groups.push({ title: 'תמונה', fields: [field('sections.trust.mediaId', 'תמונת אמון', 'media', imageOptions(document))] });
    document.sections.trust.points.forEach((_, index) => groups.push({ title: `נקודת אמון ${index + 1}`, fields: [
      field(`sections.trust.points.${index}.title`, 'כותרת'),
      field(`sections.trust.points.${index}.text`, 'טקסט', 'textarea'),
    ] }));
    document.sections.trust.testimonials.forEach((_, index) => groups.push({ title: `המלצה ${index + 1}`, fields: [
      field(`sections.trust.testimonials.${index}.quote`, 'ציטוט', 'textarea'),
      field(`sections.trust.testimonials.${index}.attribution`, 'ייחוס'),
      field(`sections.trust.testimonials.${index}.source`, 'קישור מקור'),
    ] }));
  }

  if (sectionId === 'contact') {
    document.sections.contact.faqs.forEach((_, index) => groups.push({ title: `שאלה ${index + 1}`, fields: [
      field(`sections.contact.faqs.${index}.question`, 'שאלה'),
      field(`sections.contact.faqs.${index}.answer`, 'תשובה', 'textarea'),
    ] }));
    groups.push({ title: 'פעולת יצירת קשר', fields: [
      field('sections.contact.submitCta.label', 'טקסט כפתור'),
      field('sections.contact.submitCta.message', 'הודעת וואטסאפ', 'textarea'),
    ] });
  }

  return groups;
};

export const readEditorValue = (document: PublicSiteDocument, path: string): string | boolean => {
  let value: unknown = document;
  for (const segment of path.split('.')) {
    if (!isRecord(value)) return '';
    value = value[segment];
  }
  return typeof value === 'boolean' ? value : typeof value === 'string' ? value : '';
};

export const updateEditorValue = (
  document: PublicSiteDocument,
  path: string,
  value: string | boolean,
): PublicSiteDocument => {
  const next = structuredClone(document);
  const segments = path.split('.');
  const fieldName = segments.pop();
  if (!fieldName) {
    throw new Error('Editor field path cannot be empty.');
  }

  let cursor: unknown = next;
  for (const segment of segments) {
    if (!isRecord(cursor)) {
      throw new Error(`Editor field path is invalid: ${path}`);
    }
    cursor = cursor[segment];
  }
  if (!isRecord(cursor)) {
    throw new Error(`Editor field path is invalid: ${path}`);
  }

  cursor[fieldName] = value || (path.endsWith('videoMediaId') ? undefined : value);
  return next;
};
