import {
  assertUniquePublicFaqQuestions,
  businessContact,
  publicSiteDocumentSchema,
} from '@monorepo/content-schema';
import {
  buildSiteSectionPreviewData,
  type GalleryCategory,
  type ImageAsset,
} from '@monorepo/site-preview';
import { publicSiteDocument as generatedPublicSiteDocument } from '../generated/publicSiteDocument.generated';

export type { GalleryCategory, ImageAsset };

export const publicSiteDocument = publicSiteDocumentSchema.parse(generatedPublicSiteDocument);
assertUniquePublicFaqQuestions(publicSiteDocument.sections.contact.faqs);
export const siteSectionData = buildSiteSectionPreviewData(publicSiteDocument, {
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

export const { email } = publicSiteDocument.settings;
export const {
  phoneDisplay,
  phoneHref,
  whatsappBase,
} = businessContact;
export const siteVersion = 'v0.1.2';
export const galleryImages = siteSectionData.gallery.images;

export const sectionIds = ['top', 'experiences', 'gallery', 'process', 'contact'] as const;

export const brandMedia = {
  logo: {
    height: 610,
    responsive: false,
    src: '/brand/nis-logo-20260619.svg',
    width: 1060,
  },
  socialCard: {
    height: 630,
    responsive: false,
    src: '/brand/nis-logo-card.jpg',
    width: 945,
  },
} as const satisfies Readonly<Record<string, ImageAsset>>;

export const siteMicrocopy = {
  floatingWhatsappAria: 'דברו איתנו בוואטסאפ',
  footerTagline: 'אוכל של בית, גימור של בוטיק.',
  footerWhatsappLabel: 'וואטסאפ',
  mobileActionsAria: 'פעולות מהירות ליצירת קשר',
  mobilePhoneLabel: 'טלפון',
  mobileWhatsappLabel: 'וואטסאפ',
  navContactLabel: 'יצירת קשר',
  navExperiencesLabel: 'מה מזמינים',
  navGalleryLabel: 'גלריה',
  navProcessLabel: 'איך זה עובד',
  studioLoginLabel: 'כניסת ניהול',
  topbarWhatsappLabel: 'וואטסאפ',
  whatsappFloatingMessage: 'שלום Nis, אשמח לקבל פרטים דרך האתר.',
  whatsappFooterMessage: 'שלום Nis, אשמח לקבל פרטים.',
  whatsappTopbarMessage: 'שלום Nis, אשמח ליצור קשר.',
} as const;

export interface NavItem {
  readonly href: `#${string}`;
  readonly label: string;
}

export const navItems: readonly NavItem[] = [
  { label: siteMicrocopy.navExperiencesLabel, href: '#experiences' },
  { label: siteMicrocopy.navGalleryLabel, href: '#gallery' },
  { label: siteMicrocopy.navProcessLabel, href: '#process' },
  { label: siteMicrocopy.navContactLabel, href: '#contact' },
];
