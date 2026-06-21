import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Copy,
  Eye,
  ExternalLink,
  FileText,
  HeartHandshake,
  HelpCircle,
  Home,
  ImagePlus,
  Images,
  ListChecks,
  Lock,
  LogIn,
  MonitorCheck,
  PanelRightClose,
  PanelRightOpen,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Rocket,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  Users,
  Wand2,
} from 'lucide-react';
import {
  contentSnapshotSchema,
  galleryCategoryIds,
  validateContentReferences,
  type ContentSnapshot,
  type GalleryItemRecord,
  type ImageAssetRecord,
  type SectionBlockRecord,
  type ServiceRecord,
} from '@monorepo/content-schema';
import { isGoogleConfigured, studioConfig } from './config';
import {
  fetchGoogleUserEmail,
  getDriveFileDownloadUrl,
  openDrivePicker,
  readContentFromSheets,
  requestGoogleAccessToken,
  saveContentToSheets,
  triggerPublish,
  uploadImageToDrive,
  type GoogleAccessToken,
} from './googleApi';
import {
  AudienceSection,
  BookingBasicsSection,
  BoutiqueSection,
  ContactSection,
  CoordinationSection,
  EditorialSection,
  ExperienceLabSection,
  FaqSection,
  GallerySection,
  HeroSection,
  IntroBandSection,
  ManifestoSection,
  ProcessSection,
  RealMediaSection,
  SamplesSection,
  SeoSection,
  ServicesSection,
  SignatureSection,
  StorySection,
  TrustSection,
} from '../../../frontend/nis-boutique-catering/src/components/MainSections';
import {
  SiteSectionPreviewDataProvider,
  defaultSiteSectionPreviewData,
  type SiteSectionPreviewData,
} from '../../../frontend/nis-boutique-catering/src/components/SiteSectionPreviewData';
import {
  exactPreviewCopySectionIds,
  exactPreviewSectionGroupIds,
} from './previewParityContract';
import siteBaseCss from '../../../frontend/nis-boutique-catering/src/styles/base.css?raw';
import siteThemeCss from '../../../frontend/nis-boutique-catering/src/styles/theme.css?raw';

type ActiveView =
  | 'site-map'
  | 'hero'
  | 'intro-band'
  | 'contact'
  | 'editorial'
  | 'manifesto'
  | 'services'
  | 'experience-lab'
  | 'site-copy'
  | 'site-microcopy'
  | 'audience'
  | 'boutique'
  | 'signature'
  | 'process'
  | 'story'
  | 'samples'
  | 'coordination'
  | 'real-media'
  | 'booking-basics'
  | 'seo'
  | 'gallery'
  | 'trust'
  | 'faq'
  | 'media'
  | 'publish';
type AuthState = 'signed-out' | 'loading' | 'authorized' | 'denied';
type PublishState = 'clean' | 'draft' | 'saving' | 'publishing' | 'checking' | 'published' | 'live' | 'error';
type PreviewDevice = 'desktop' | 'mobile';
type MediaUsageKind = 'gallery' | 'service' | 'hero' | 'manifesto';
type PublishStepState = 'done' | 'active' | 'pending' | 'blocked' | 'error';

type StudioWorkflowStep = {
  readonly step: string;
  readonly title: string;
  readonly text: string;
  readonly state: PublishStepState;
};

type OwnerVerificationItem = {
  readonly title: string;
  readonly text: string;
  readonly state: PublishStepState;
};

type PublishProgress = {
  readonly targetVersion: string;
  readonly liveUrl: string;
  readonly totalAttempts: number;
  readonly attempt?: number;
  readonly checkedAt?: string;
  readonly lastBundleUrl?: string;
};

type LiveVersionCheckResult = {
  readonly live: boolean;
  readonly bundleUrl?: string;
};

type MediaUsageEntry = {
  readonly kind: MediaUsageKind;
  readonly id: string;
  readonly title: string;
  readonly active: boolean;
};

type Session = {
  readonly accessToken: string;
  readonly email: string;
  readonly expiresAt: number;
};

const emptyContent: ContentSnapshot = {
  version: '1',
  updatedAt: new Date(0).toISOString(),
  settings: {
    phoneDisplay: '',
    phoneHref: 'tel:',
    email: 'studio@nisboutiquecatering.com',
    whatsappBase: 'https://wa.me/',
    siteVersion: 'draft',
  },
  media: [],
  gallery: [],
  services: [],
  sections: [],
};

const editableCategories = galleryCategoryIds.filter((category) => category !== 'all');
const publicSiteOrigin = 'https://nisboutiquecatering.com';
const archiveDate = () => new Date().toISOString();
const creatorUrl = 'https://EvyatarHazan.com';
const rememberedSessionKey = 'nis-content-studio-session-v1';
const tokenRefreshWindowMs = 60_000;
const liveVersionPollDelayMs = 15_000;
const liveVersionPollAttempts = 12;
const heroMediaSlots = [
  { key: 'background', label: 'רקע מסך פתיחה', help: 'התמונה הרחבה שמופיעה מאחורי כל מסך הפתיחה.', fallbackMediaId: 'hosting-table-overview' },
  { key: 'primary', label: 'תמונה ראשית', help: 'התמונה הגדולה באזור התצוגה/האירוח.', fallbackMediaId: 'salmon-skewers-lemon' },
  { key: 'side', label: 'תמונה צדדית', help: 'תמונה קטנה שמוסיפה עומק לתצוגת האירוח.', fallbackMediaId: 'dips-tray-close' },
  { key: 'tall', label: 'תמונה גבוהה', help: 'תמונה אנכית נוספת באזור התצוגה.', fallbackMediaId: 'table-setting-blue-gold' },
] as const;
const manifestoMediaFallbacks = ['hosting-table-overview', 'dips-tray-close', 'table-setting-blue-gold'] as const;

const isSessionShape = (value: unknown): value is Session => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<Record<keyof Session, unknown>>;
  return (
    typeof candidate.accessToken === 'string'
    && typeof candidate.email === 'string'
    && typeof candidate.expiresAt === 'number'
  );
};

const clearRememberedSession = () => {
  try {
    window.localStorage.removeItem(rememberedSessionKey);
  } catch {
    // Browser storage can be disabled; login should still work for the current tab.
  }
};

const readRememberedSession = () => {
  try {
    const raw = window.localStorage.getItem(rememberedSessionKey);
    const parsed = raw ? JSON.parse(raw) as unknown : null;
    if (!isSessionShape(parsed) || parsed.expiresAt <= Date.now() + tokenRefreshWindowMs) {
      clearRememberedSession();
      return null;
    }

    return parsed;
  } catch {
    clearRememberedSession();
    return null;
  }
};

const rememberSession = (session: Session) => {
  try {
    window.localStorage.setItem(rememberedSessionKey, JSON.stringify(session));
  } catch {
    // Non-blocking: a private browsing policy should not prevent editing in this tab.
  }
};

const nextContentVersion = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return [
    'studio',
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('-');
};

const categoryLabels: Readonly<Record<GalleryItemRecord['category'], string>> = {
  tables: 'שולחנות',
  trays: 'מגשים',
  salads: 'סלטים',
  coffee: 'קפה',
  fish: 'דגים',
};

const sectionGroupLabels: Readonly<Record<string, string>> = {
  hero: 'מסך פתיחה',
  audience: 'למי זה מתאים',
  intro: 'פתיח',
  'site-copy': 'טקסטי מעטפת',
  'site-microcopy': 'טקסטים קטנים',
  editorial: 'מה מזמינים אצלנו',
  manifesto: 'השפה של Nis',
  process: 'איך זה עובד',
  boutique: 'למה זה בוטיק',
  signature: 'רגעי בוטיק',
  story: 'הסיפור של המותג',
  samples: 'כיוונים להזמנה',
  coordination: 'תיאום וזמינות',
  faq: 'שאלות ותשובות',
  trust: 'אמון',
  'hero-notes': 'נקודות Hero',
  'hero-marquee': 'טקסט רץ Hero',
  'hero-media': 'תמונות Hero',
  general: 'כללי',
};

const makeCopySection = (
  id: string,
  title: string,
  text: string | undefined,
  eyebrow: string,
  order: number,
  extraText?: string,
) => makeSection(`copy-${id}`, 'site-copy', title, text, extraText ? [eyebrow, extraText] : [eyebrow], order);

const makeMicrocopySection = (
  id: string,
  title: string,
  text: string | undefined,
  order: number,
  items: readonly string[] = [],
) => makeSection(`microcopy-${id}`, 'site-microcopy', title, text, items, order);

const makeSection = (
  id: string,
  group: string,
  title: string,
  text: string | undefined,
  items: readonly string[],
  order: number,
): SectionBlockRecord => ({
  id,
  group,
  title,
  text,
  items: [...items],
  active: true,
  order,
});

// Exported for the coverage test that keeps public generated content aligned with studio defaults.
// eslint-disable-next-line react-refresh/only-export-components
export const managedSectionDefaults: readonly SectionBlockRecord[] = [
  makeSection('hero', 'hero', 'קייטרינג בוטיק ביתי\nלשבתות ואירועים קטנים', 'רואים את הסגנון, בוחרים את סוג ההזמנה, ומשאירים פנייה מסודרת. Nis כבר תהפוך את זה לתפריט, מגשים או מארז שמתאימים לאירוח שלכם.', ['מהרובע היהודי לביתר עילית', 'שבתות, מגשי אירוח ו־Travel Nis, עם אוכל מוקפד, נראות יפה ושיחה קצרה שסוגרת כיוון.'], 0),
  makeCopySection('intro-band', 'אוכל ביתי מוקפד, בהגשה של בוטיק, לאירוח קטן שמרגיש גדול.', 'במקום לנסות להיות הכול, Nis בנויה סביב שלוש חוויות ברורות: שבתות, אירועים קטנים ומארזים לדרך. החוט שמחבר ביניהן הוא אותו חוט: אוכל שמרגיש חם וביתי, נראות נקייה ומכובדת, ושירות אישי שלא משאיר אתכם לבד עם הפרטים.', 'רעיון אחד ברור', 1),
  makeCopySection('manifesto', 'לא עוד מגש.\nחוויית אירוח שנראית\nכמו מחשבה.', 'כש־Nis נראית נכון, זה מרגיש מיד אחרת: יותר שקט למארח, יותר כבוד לשולחן, ויותר תחושה שמישהו החזיק את כל הפרטים יחד.', 'השפה של Nis', 2),
  makeCopySection('editorial', 'שלוש קטגוריות ברורות. שפה אחת של אירוח.', undefined, 'מה מזמינים אצלנו', 3),
  makeCopySection('audience', 'כשרוצים לארח יפה, טעים ומכובד בלי לסחוב הכול לבד.', 'Nis מתאימה למי שרוצה לזהות את עצמו מהר: שבת רגועה יותר, אירוע קטן שנראה נכון, או מארז יפה שלוקחים לדרך או שולחים הלאה.', 'למי זה מתאים', 4),
  makeCopySection('experience-lab', 'מהרגע שבוחרים כיוון, האירוח מתחיל לקבל צורה.', 'בוחרים את סוג האירוח ומבינים מהר איך זה יכול להיראות אצלכם: מה נפתח על השולחן, מה מתאים לאופי האירוע, ואיך ממשיכים לשיחה קצרה.', 'בחרו את החוויה', 5),
  makeCopySection('signature', 'בוטיק זו לא מילה. זו הדרך שבה כל פרט מרגיש נכון יותר.', undefined, 'למה זה בוטיק', 6),
  makeCopySection('boutique', 'הפרטים הקטנים שעוזרים להחליט מהר יותר.', 'התאמה אישית, נראות מוכנה לשולחן, יחס אנושי וטעם שמרגיש ביתי אבל חגיגי. אלה הפרטים שעוזרים לאירוח להרגיש רגוע ומדויק יותר.', 'למה זה מרגיש בוטיק', 7),
  makeCopySection('services', 'שלוש אפשרויות ברורות. בוחרים כיוון וממשיכים לפנייה.', 'שבת, אירוח קטן או דרך: שלושת השירותים מקבלים משקל שווה, וכל אחד מהם נבנה לפי כמות, תאריך והתחושה שרוצים ליצור.', 'מה אפשר להזמין', 8),
  makeCopySection('process', 'ארבעה צעדים קצרים מהרעיון ועד אוכל שמוכן להגשה.', undefined, 'איך זה עובד', 9),
  makeCopySection('story', 'Nis נולדה מתוך אהבה לאירוח יפה, אוכל ביתי מדויק ותשומת לב לפרטים הקטנים.', 'מאחורי Nis עומדת יהודית ניסטנפובר, עם אהבה עמוקה לאירוח, לאוכל מוקפד ולרגעים הקטנים שהופכים ארוחה לחוויה.', 'הסיפור של המותג', 10, 'אחרי שנים של חיים ברובע היהודי, בין סמטאות אבן, בתים מלאי ריח של שבת ושולחנות שנפתחים לאנשים שאוהבים, יהודית מביאה למטבח של Nis חיבור בין ביתיות, אסתטיקה ושירות אישי.|כל הזמנה נבנית מתוך תשומת לב לפרטים הקטנים: חומרי גלם טריים, טעמים מדויקים, אריזה אסתטית ותחושה שמישהו חשב עליכם באמת.'),
  makeCopySection('samples', 'כיוונים טעימים שקל להתחיל מהם שיחה.', 'אפשר להתחיל מכיוון כללי ולהתאים אותו לשבת, לאירוח קטן או למארז לדרך. בשיחה קצרה מדייקים יחד כמויות, תאריך וסגנון הגשה.', 'כיוונים שאפשר להתחיל מהם', 11),
  makeCopySection('coordination', 'הפרטים שעוזרים להתקדם בביטחון.', undefined, 'תיאום וזמינות', 12),
  makeCopySection('real-media', 'ככה נראית תשומת לב לפני שהאירוח בכלל פוגש את האורחים.', 'מנות אישיות, אריזה נקייה, מדבקת Nis ופרטים קטנים שמסדרים את החוויה עוד לפני הביס הראשון. התמונות והווידאו כאן הם מהכנות אמיתיות של Nis.', 'וידאו אמיתי', 13),
  makeCopySection('gallery', 'קודם רואים. אחר כך הרבה יותר קל לפנות.', 'שולחנות, מגשים, סלטים, קפה ופרטים קטנים שמראים את הסגנון לפני שמתחילים לדבר על תפריט.', 'גלריה', 14),
  makeCopySection('booking-basics', 'כל מה שצריך לדעת כדי לשלוח פנייה בלי להתלבט.', 'מספיק לדעת מה סוג האירוח, בערך כמה סועדים ומה התאריך הרצוי. משם אפשר לדייק יחד את התפריט, ההגשה ואופן הקבלה.', 'לפני שפונים', 16),
  makeCopySection('seo', 'קייטרינג בוטיק מביתר עילית לשבת, אירוח קטן ומארזים לדרך.', 'Nis נותנת מענה למי שמחפש קייטרינג בוטיק בביתר עילית והסביבה: תפריט שבת מוכן, מגשי אירוח לאירועים קטנים, פינגר פוד, בראנץ׳ משפחתי ומארזי פיקניק או דרך. כל פנייה מתחילה בשיחה קצרה כדי להבין את סוג האירוח, כמות הסועדים, התאריך והתחושה שרוצים ליצור.', 'מה אפשר להזמין', 17),
  makeCopySection('trust', 'פחות סימני שאלה, יותר תחושה שיש עם מי לדבר.', undefined, 'מה מרגיע לפני שסוגרים', 18),
  makeCopySection('faq', 'התשובות שמקלות על הפנייה הראשונה.', undefined, 'שאלות נפוצות', 19),
  makeCopySection('contact', 'אהבתם את הסגנון? שלחו פנייה מסודרת לוואטסאפ.', 'הטופס נשאר קצר ומעשי: סוג הזמנה, תאריך, כמות והערה. אחרי השליחה נפתחת הודעת וואטסאפ מוכנה, כדי שיהיה קל להמשיך לשיחה אישית.', 'יצירת קשר', 20, 'שיחה קצרה, התאמה אישית, ואז סיכום ברור של תאריך, כמות וסגנון אירוח.'),
  makeMicrocopySection('nav-experiences-label', 'קישור בתפריט: מה מזמינים', 'מה מזמינים', -11),
  makeMicrocopySection('nav-gallery-label', 'קישור בתפריט: גלריה', 'גלריה', -10),
  makeMicrocopySection('nav-process-label', 'קישור בתפריט: איך זה עובד', 'איך זה עובד', -9),
  makeMicrocopySection('nav-samples-label', 'קישור בתפריט: דוגמאות', 'דוגמאות', -8),
  makeMicrocopySection('nav-faq-label', 'קישור בתפריט: שאלות', 'שאלות', -7),
  makeMicrocopySection('nav-contact-label', 'קישור בתפריט: יצירת קשר', 'יצירת קשר', -6),
  makeMicrocopySection('gallery-all-label', 'מסנן גלריה: הכל', 'הכל', -5),
  makeMicrocopySection('gallery-tables-label', 'מסנן גלריה: שולחנות', 'שולחנות', -4),
  makeMicrocopySection('gallery-trays-label', 'מסנן גלריה: מגשים', 'מגשים', -3),
  makeMicrocopySection('gallery-salads-label', 'מסנן גלריה: סלטים', 'סלטים', -2),
  makeMicrocopySection('gallery-fish-label', 'מסנן גלריה: דגים', 'דגים', -1),
  makeMicrocopySection('gallery-coffee-label', 'מסנן גלריה: קפה', 'קפה', 0),
  makeMicrocopySection('topbar-whatsapp-label', 'כפתור וואטסאפ בתפריט העליון', 'וואטסאפ', 1),
  makeMicrocopySection('footer-tagline', 'משפט קצר בפוטר', 'אוכל של בית, גימור של בוטיק.', 2),
  makeMicrocopySection('footer-whatsapp-label', 'קישור וואטסאפ בפוטר', 'וואטסאפ', 3),
  makeMicrocopySection('studio-login-label', 'קישור כניסה לסטודיו בפוטר', 'כניסת ניהול', 4),
  makeMicrocopySection('floating-whatsapp-aria', 'תיאור נגישות לכפתור וואטסאפ צף', 'דברו איתנו בוואטסאפ', 5),
  makeMicrocopySection('mobile-actions-aria', 'תיאור נגישות לפעולות מובייל', 'פעולות מהירות ליצירת קשר', 6),
  makeMicrocopySection('mobile-whatsapp-label', 'כפתור וואטסאפ במובייל', 'וואטסאפ', 7),
  makeMicrocopySection('mobile-phone-label', 'כפתור טלפון במובייל', 'טלפון', 8),
  makeMicrocopySection('hero-primary-cta', 'כפתור ראשי במסך הפתיחה', 'דברו איתנו בוואטסאפ', 9),
  makeMicrocopySection('hero-secondary-cta', 'כפתור משני במסך הפתיחה', 'ראו איך זה נראה', 10),
  makeMicrocopySection('hero-microcopy', 'משפט קטן מתחת לכפתורי Hero', 'אפשר גם למלא את הטופס בסוף האתר ולשלוח פנייה מסודרת לוואטסאפ.', 11),
  makeMicrocopySection('hero-showcase-title', 'כותרת קטנה בתמונת Hero', 'שבתות, אירוח קטן ומארזים', 12),
  makeMicrocopySection('hero-showcase-text', 'טקסט קטן בתמונת Hero', 'אותה שפה של טעם, נראות ושקט למארח.', 13),
  makeMicrocopySection('hero-video-chip', 'כפתור וידאו במסך הפתיחה', 'רגעים אמיתיים מהאירוח', 14),
  makeMicrocopySection('experience-cta', 'קישור בתוך בחירת חוויה', 'לפתוח שיחה על החוויה הזו', 15),
  makeMicrocopySection('contact-primary-cta', 'כפתור וואטסאפ באזור יצירת קשר', 'קבלו הצעה מותאמת בוואטסאפ', 16),
  makeMicrocopySection('contact-phone-cta', 'כפתור טלפון באזור יצירת קשר', 'התקשרו עכשיו', 17),
  makeMicrocopySection('contact-location', 'מיקום שמוצג באזור יצירת קשר', 'ביתר עילית', 18),
  makeMicrocopySection('contact-promise-heading', 'כותרת הבטחה באזור יצירת קשר', 'מה קורה אחרי הפנייה?', 19),
  makeMicrocopySection('form-name-label', 'תווית שדה שם', 'שם מלא', 20),
  makeMicrocopySection('form-phone-label', 'תווית שדה טלפון', 'טלפון', 21),
  makeMicrocopySection('form-email-label', 'תווית שדה מייל', 'מייל', 22),
  makeMicrocopySection('form-interest-label', 'תווית שדה סוג הזמנה', 'במה אתם מתעניינים?', 23),
  makeMicrocopySection('form-date-label', 'תווית שדה תאריך', 'תאריך רצוי', 24),
  makeMicrocopySection('form-guests-label', 'תווית שדה מספר סועדים', 'מספר סועדים', 25),
  makeMicrocopySection('form-delivery-label', 'תווית שדה אופן קבלה', 'אופן קבלה מועדף', 26),
  makeMicrocopySection('form-message-label', 'תווית שדה הודעה', 'הודעה קצרה', 27),
  makeMicrocopySection('form-submit-label', 'כפתור שליחת הטופס', 'שלחו פנייה בוואטסאפ', 28),
  makeMicrocopySection('whatsapp-topbar-message', 'הודעת וואטסאפ מהתפריט העליון', 'שלום Nis, אשמח ליצור קשר.', 29),
  makeMicrocopySection('whatsapp-hero-topic', 'נושא הודעת וואטסאפ מה-Hero', 'קייטרינג בוטיק לאירוח', 30),
  makeMicrocopySection('whatsapp-contact-message', 'הודעת וואטסאפ מאזור יצירת קשר', 'שלום Nis, אשמח ליצור קשר לגבי הזמנה.', 31),
  makeMicrocopySection('whatsapp-footer-message', 'הודעת וואטסאפ מהפוטר', 'שלום Nis, אשמח לקבל פרטים.', 32),
  makeMicrocopySection('whatsapp-floating-message', 'הודעת וואטסאפ מהכפתור הצף', 'שלום Nis, אשמח לקבל פרטים דרך האתר.', 33),
  makeMicrocopySection('contact-interest-options', 'אפשרויות שדה סוג הזמנה', undefined, 34, ['ניס בטעם של שבת', 'ניס בכיס - מגשי אירוח', 'Travel Nis', 'אירוע קטן', 'אחר']),
  makeMicrocopySection('contact-delivery-options', 'אפשרויות שדה אופן קבלה', undefined, 35, ['נדבר ונבדוק יחד', 'איסוף מביתר עילית', 'משלוח בתיאום']),
  makeSection('seo-topics', 'seo-topics', 'תגיות תחומי שירות לאזור SEO', undefined, ['קייטרינג בוטיק בביתר עילית', 'תפריט שבת מוכן ומסודר', 'מגשי אירוח לאירועים קטנים', 'פינגר פוד והרמות כוסית', 'מארזי פיקניק ומארזי דרך', 'אירוח משפחתי בהתאמה אישית'], 1),
  makeSection('editorial-shabbat', 'editorial', 'אוכל ביתי מוקפד לשבת שנכנסת ברוגע', 'תפריטי שבת עשירים, מסודרים ויפים להגשה, כדי שהבית ירגיש מלא בלי שכל העומס יישב עליכם.', ['שבתות', 'ChefHat'], 1),
  makeSection('editorial-events', 'editorial', 'שולחן שנפתח יפה ומייצר רושם כבר בדקה הראשונה', 'מגשי אירוח, פינגר פוד ושולחנות קטנים עם הגשה אסתטית שמתאימה למשפחה, מפגש או אירוח עסקי.', ['אירועים קטנים', 'Sparkles'], 2),
  makeSection('editorial-travel', 'editorial', 'Travel Nis לפינוקים שלוקחים אתכם הלאה', 'מארזים נוחים, חכמים ויפים לנסיעות, טיולים וימי כיף, כך שהחוויה מתחילה כבר בדרך.', ['מארזים ודרך', 'Gift'], 3),
  makeSection('manifesto-table', 'manifesto', 'שולחן שנראה מסודר עוד לפני שנוגעים בו', 'ההגשה, הצבעים והקצב של השולחן הם חלק מהחוויה, לא רק הרקע של האוכל.', ['01', 'hosting-table-overview'], 1),
  makeSection('manifesto-home', 'manifesto', 'אוכל שמרגיש ביתי, אבל לא יומיומי', 'הטעם נשאר חם ומוכר, אבל ההופעה, האריזה והדיוק נותנים תחושת occasion.', ['02', 'dips-tray-close'], 2),
  makeSection('manifesto-custom', 'manifesto', 'התאמה אישית במקום פס ייצור', 'החוויה נבנית סביב האירוח שלכם, לא סביב קטלוג אחיד שצריך להסתדר איתו.', ['03', 'table-setting-blue-gold'], 3),
  makeSection('audience-shabbat', 'audience', 'למשפחות שמארחות שבת', 'למי שרוצה שולחן מכובד, מלא ויפה בלי לעמוד שעות במטבח ובלי להיכנס ללחץ לפני שבת.', ['Users'], 1),
  makeSection('audience-events', 'audience', 'לאירועים קטנים ומוקפדים', 'לזוגות, משפחות ומארחים שמתכננים שמחה קטנה, ברית, שבע ברכות או מפגש משפחתי עם נראות טובה ושקט תפעולי.', ['HeartHandshake'], 2),
  makeSection('audience-travel', 'audience', 'למארזים, דרך ומתנה', 'למי שרוצה לשלוח או לקחת משהו יפה, טעים ומכובד לדרך, לשבת, לאורחים או ליום מיוחד.', ['Gift'], 3),
  makeSection('boutique-custom', 'boutique', 'התאמה בשיחה קצרה', 'סוג האירוח, מספר הסועדים והתאריך הופכים מהר לכיוון ברור שאפשר להתקדם איתו.', ['ClipboardList'], 1),
  makeSection('boutique-ready', 'boutique', 'נראות שמוכנה לשולחן', 'מגשים, מארזים וסידור שמרגישים יפים כבר בפתיחה, בלי עבודה מיותרת מצד המארח.', ['Sparkles'], 2),
  makeSection('boutique-personal', 'boutique', 'יחס אישי ולא תעשייתי', 'אין מסלול גנרי. יש תיאום, הקשבה ותשומת לב לפרטים שחשובים לאירוח שלכם.', ['HeartHandshake'], 3),
  makeSection('boutique-home', 'boutique', 'טעם ביתי בגימור בוטיק', 'החיבור בין אוכל חם ומוכר לבין אריזה, צבעים וסידור שמרגישים חגיגיים יותר.', ['Package'], 4),
  makeSection('process-whatsapp', 'process', 'שולחים הודעה בוואטסאפ', 'אפשר ללחוץ על וואטסאפ או לשלוח את הטופס המסודר בתחתית האתר.', ['MessageCircle'], 1),
  makeSection('process-details', 'process', 'מחדדים סוג אירוח וכמות', 'בוחרים שבת, מגשי אירוח או Travel Nis, ומוסיפים תאריך, כמות וכיוון כללי.', ['CalendarDays'], 2),
  makeSection('process-offer', 'process', 'מקבלים הצעה או תפריט מותאם', 'מקבלים כיוון שמתאים לאירוח, למספר הסועדים ולרמת ההגשה הרצויה.', ['ClipboardList'], 3),
  makeSection('process-ready', 'process', 'סוגרים פרטים ומקבלים מוכן להגשה', 'מסכמים תאריך, אופן קבלה והתאמות, ואז מקבלים אוכל מסודר ונוח להגשה.', ['CheckCircle2'], 4),
  makeSection('signature-table', 'signature', 'שולחן שנפתח יפה', 'מגשים, צבעים וכלי הגשה שמרגישים מוכנים לאורחים כבר מהרגע הראשון.', [], 1),
  makeSection('signature-bites', 'signature', 'ביסים קטנים, רושם גדול', 'פינגר פוד, כריכונים ומנות אישיות שנוחים להגשה, לצילום ולאכילה.', [], 2),
  makeSection('signature-details', 'signature', 'פרטים שמרגישים בוטיק', 'קפה, עריכה, אריזה ותיאום קטן שמסדרים את כל החוויה סביבכם.', [], 3),
  makeSection('story-rova', 'story', 'מהרובע היהודי', 'שנים של סמטאות אבן, בתים פתוחים וריח של שבת בנו אצל יהודית שפה של אירוח שיש בו נשמה, סדר וחום.', [], 1),
  makeSection('story-kitchen', 'story', 'אל המטבח של Nis', 'הזיכרון הזה הופך למטבח מוקפד: חומרי גלם טריים, טעמים מדויקים, אריזה יפה ותחושה שמישהו חשב עליכם באמת.', [], 2),
  makeSection('story-table', 'story', 'עד השולחן שלכם', 'המטרה פשוטה: שתוכלו לארח ברוגע, לפתוח את המארז או המגש, ולהרגיש שהאוכל כבר מספר את הסיפור הנכון.', [], 3),
  makeSection('samples-shabbat', 'samples', 'תפריט שבת לדוגמה', 'כיוון לשולחן שבת שמרגיש מלא, מכובד ונוח להגשה.', ['מבחר סלטים לשולחן', 'דגים לשבת', 'עיקריות חמות', 'תוספות וסירים משפחתיים', 'חלות וקינוחים'], 1),
  makeSection('samples-trays', 'samples', 'מגשי אירוח ופינגר פוד', 'פתרון לאירוח קטן שרוצה להרגיש מוקפד ולא גנרי.', ['מגש מלוח מעוצב', 'מיני קישים ומאפים אישיים', 'כריכונים וביסים קטנים', 'בראנץ׳ בוטיק למשפחה', 'קינוחים אישיים'], 2),
  makeSection('samples-travel', 'samples', 'Travel Nis לדרך', 'מארזים יפים ונוחים לרגעים מיוחדים שמתחילים כבר ביציאה מהבית.', ['ערכת פיקניק זוגית', 'ערכת דרך משפחתית', 'מארז נסיעה מפנק לילדים', 'מארז יום כיף', 'פתרון מותאם לטיול או יציאה'], 3),
  makeSection('coordination-area', 'coordination', 'אזור פעילות', 'ביתר עילית כבסיס פעילות. איסוף ומשלוחים בסביבה מתואמים לפי תאריך, מיקום ואופי ההזמנה.', ['MapPin'], 1),
  makeSection('coordination-time', 'coordination', 'זמן פנייה מומלץ', 'לשבתות, חגים ואירועים כדאי לפנות כמה שיותר מוקדם כדי להשאיר מקום להתאמה אישית.', ['CalendarDays'], 2),
  makeSection('coordination-price', 'coordination', 'הצעת מחיר', 'מקבלים הצעה מותאמת אחרי שמבינים את סוג האירוח, הכמות, התאריך ורמת ההגשה הרצויה.', ['Users'], 3),
  makeSection('coordination-confirm', 'coordination', 'אישור תפריט', 'אחרי שיחה קצרה מסכמים כיוון, התאמות, תאריך ואופן קבלה לפני סגירת ההזמנה.', ['ClipboardList'], 4),
  makeSection('trust-ready', 'trust', 'אסתטיקה שמגיעה מוכנה', 'המנות נארזות ומסודרות כך שהשולחן נראה מוקפד בלי עבודה מיותרת מצדכם.', ['Sparkles'], 1),
  makeSection('trust-personal', 'trust', 'התאמה לפני סגירה', 'לפני שמתקדמים עוברים יחד על סוג האירוח, מספר הסועדים והעדפות חשובות.', ['ClipboardList'], 2),
  makeSection('trust-human', 'trust', 'שיחה אישית, לא תפריט גנרי', 'כל פנייה מקבלת מענה לפי התאריך, המיקום והחוויה שאתם רוצים ליצור.', ['HeartHandshake'], 3),
  makeSection('faq-timing', 'faq', 'כמה זמן מראש צריך להזמין?', 'מומלץ לפנות כמה שיותר מוקדם, במיוחד לפני שבתות, חגים ואירועים עם מספר סועדים גדול.', [], 1),
  makeSection('faq-delivery', 'faq', 'האם יש משלוחים?', 'העסק פועל מביתר עילית. משלוח או איסוף בסביבה נבדקים מול הלקוח לפי מיקום, תאריך וסוג הזמנה.', [], 2),
  makeSection('faq-custom-menu', 'faq', 'האם אפשר להרכיב תפריט אישי?', 'כן. כל הזמנה נבנית אחרי שיחה קצרה כדי להתאים את התפריט לאירוח, לסועדים ולסגנון המבוקש.', [], 3),
  makeSection('faq-preferences', 'faq', 'האם אפשר להתחשב ברגישויות או בהעדפות?', 'כן. מעלים רגישויות, אלרגיות או העדפות בתחילת השיחה, ובודקים יחד מה אפשר להתאים בפועל.', [], 4),
  makeSection('faq-business-events', 'faq', 'האם אפשר להזמין לאירועים עסקיים?', 'כן. Nis בכיס מתאימה גם להרמות כוסית, ישיבות, אירוח עסקי ושולחנות קטנים ומוקפדים.', [], 5),
  makeSection('faq-minimum-order', 'faq', 'האם יש מינימום הזמנה?', 'מינימום הזמנה ייקבע בשיחה לפי סוג השירות, התאריך והיקף האירוח.', [], 6),
  makeSection('hero-badges', 'hero-badges', 'תגיות אמון במסך הפתיחה', undefined, ['שבתות', 'מגשי אירוח', 'Travel Nis', 'מומלץ לפנות מוקדם'], 1),
  makeSection('hero-stat-shabbat', 'hero-stats', 'שבתות', 'אוכל ביתי מוקפד, מוכן להגשה', [], 1),
  makeSection('hero-stat-events', 'hero-stats', 'אירוח קטן', 'מגשים ושולחנות שנראים כמו בוטיק', [], 2),
  makeSection('hero-stat-travel', 'hero-stats', 'Travel Nis', 'מארזים חכמים לדרך ולרגעים מיוחדים', [], 3),
  makeSection('hero-media', 'hero-media', 'תמונות מסך פתיחה', 'התמונות שמרכיבות את הרקע והקומפוזיציה במסך הפתיחה.', heroMediaSlots.map((slot) => slot.fallbackMediaId), 1),
  makeSection('hero-note-ready', 'hero-notes', 'אירוח מוכן להגשה', 'כל מגש מגיע מסודר כך שהשולחן נראה נכון כבר מהרגע הראשון.', [], 1),
  makeSection('hero-note-custom', 'hero-notes', 'שיחה קצרה, התאמה אישית', 'מספר סועדים, סוג האירוח והאווירה שאתם רוצים יוצרים יחד את הכיוון.', [], 2),
  makeSection('hero-marquee', 'hero-marquee', 'טקסט רץ במסך הפתיחה', undefined, ['שולחן שנפתח יפה', 'אוכל ביתי מוקפד', 'מגשי אירוח אלגנטיים', 'Travel Nis', 'ביתר עילית', 'אריזה שנראית כמו מותג'], 1),
];

// Exported for the regression test that covers archived managed sections recovery.
// eslint-disable-next-line react-refresh/only-export-components
export const ensureManagedSections = (snapshot: ContentSnapshot): ContentSnapshot => {
  const existingIds = new Set(snapshot.sections.filter((section) => !section.deletedAt).map((section) => section.id));
  const missing = managedSectionDefaults.filter((section) => !existingIds.has(section.id));
  if (missing.length === 0) {
    return snapshot;
  }

  return {
    ...snapshot,
    sections: [...snapshot.sections, ...missing],
  };
};

const formatError = (error: unknown) => (error instanceof Error ? error.message : 'הפעולה נכשלה');

const updateById = <T extends { id: string }>(items: readonly T[], id: string, patch: Partial<T>) =>
  items.map((item) => (item.id === id ? { ...item, ...patch } : item));

const splitPipeList = (value: string) => value.split('|').map((item) => item.trim()).filter(Boolean);
const joinPipeList = (items: readonly string[]) => items.join(' | ');
const cmsSrcFor = (id: string) => `/media/cms/${id}.webp`;
const publicAssetSrcFor = (src: string) => (src.startsWith('http') ? src : `${publicSiteOrigin}${src}`);
const patchSectionItem = (section: SectionBlockRecord, index: number, value: string, fallback: string): Partial<SectionBlockRecord> => {
  const items = [...section.items];
  items[index] = value || fallback;
  return { items };
};
const heroMediaIdAt = (heroMedia: SectionBlockRecord | undefined, index: number) => heroMedia?.items[index] ?? heroMediaSlots[index]?.fallbackMediaId ?? '';
const patchHeroMediaId = (heroMedia: SectionBlockRecord, index: number, mediaId: string): Partial<SectionBlockRecord> => {
  const items = heroMediaSlots.map((slot, slotIndex) => (slotIndex === index ? mediaId : heroMedia.items[slotIndex] ?? slot.fallbackMediaId));
  return { items };
};

const managedCopySectionId = (id: string) => `copy-${id}`;

const getManagedCopySection = (content: ContentSnapshot, id: string) =>
  content.sections.find((section) => section.id === managedCopySectionId(id) && section.group === 'site-copy' && !section.deletedAt);

const normalizeMediaId = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'media-new';

const areaDefinitions: readonly {
  readonly id: ActiveView;
  readonly title: string;
  readonly location: string;
  readonly help: string;
  readonly icon: ReactNode;
}[] = [
  {
    id: 'hero',
    title: 'מסך פתיחה',
    location: 'החלק הראשון באתר, מעל כל התוכן',
    help: 'כותרת גדולה, משפט הסבר, תמונות Hero וכפתור וואטסאפ ראשי.',
    icon: <Home aria-hidden="true" />,
  },
  {
    id: 'intro-band',
    title: 'רעיון אחד ברור',
    location: 'הפתיח שאחרי מסך הפתיחה',
    help: 'מסביר ללקוח בשני משפטים למי Nis מיועדת ולמה שלושת השירותים שייכים לאותה שפה.',
    icon: <FileText aria-hidden="true" />,
  },
  {
    id: 'manifesto',
    title: 'השפה של Nis',
    location: 'אחרי פתיח הבידול, לפני קטגוריות הפתיחה',
    help: 'כרטיסים עם מסר רגשי ותמונות, לפני הפירוט המעשי.',
    icon: <Wand2 aria-hidden="true" />,
  },
  {
    id: 'editorial',
    title: 'קטגוריות פתיחה',
    location: 'שלושת הכרטיסים הראשונים שמסבירים מה מזמינים',
    help: 'שבתות, אירועים קטנים ו-Travel Nis לפני אזור השירותים המלא.',
    icon: <FileText aria-hidden="true" />,
  },
  {
    id: 'audience',
    title: 'למי זה מתאים',
    location: 'אחרי קטגוריות הפתיחה',
    help: 'מי אמור להבין מיד שהשירות מתאים לו.',
    icon: <Users aria-hidden="true" />,
  },
  {
    id: 'experience-lab',
    title: 'בחרו את החוויה',
    location: 'אחרי קהל היעד ולפני רגעי הבוטיק',
    help: 'טקסט ההסבר שמלווה את בחירת סוג האירוח באתר.',
    icon: <Sparkles aria-hidden="true" />,
  },
  {
    id: 'signature',
    title: 'רגעי בוטיק',
    location: 'אחרי בחירת חוויית האירוח באתר',
    help: 'שלושה רגעים ויזואליים שמחזקים את תחושת המותג.',
    icon: <Images aria-hidden="true" />,
  },
  {
    id: 'services',
    title: 'מה מזמינים',
    location: 'כרטיסי השירות המרכזיים בעמוד',
    help: 'שבת, אירועים, Travel Nis וכל שירות נוסף שתוסיפו.',
    icon: <Sparkles aria-hidden="true" />,
  },
  {
    id: 'boutique',
    title: 'למה זה בוטיק',
    location: 'אחרי כרטיסי השירותים באתר',
    help: 'כרטיסי הסבר קצרים שעוזרים ללקוח להבין למה זה מרגיש מוקפד.',
    icon: <Sparkles aria-hidden="true" />,
  },
  {
    id: 'gallery',
    title: 'תמונות וגלריה',
    location: 'אחרי אזור הבוטיק ולפני הווידאו',
    help: 'כאן מנהלים גם את מאגר התמונות וגם את הגלריה הציבורית במקום אחד.',
    icon: <Images aria-hidden="true" />,
  },
  {
    id: 'real-media',
    title: 'וידאו אמיתי',
    location: 'אחרי הגלריה ולפני השלבים',
    help: 'כותרת וטקסט לאזור הווידאו והתיעוד האמיתי מההכנות.',
    icon: <Images aria-hidden="true" />,
  },
  {
    id: 'process',
    title: 'איך זה עובד',
    location: 'אחרי אזור המדיה והגלריה',
    help: 'אפשר להוסיף, לכבות ולסדר שלבים.',
    icon: <ListChecks aria-hidden="true" />,
  },
  {
    id: 'story',
    title: 'הסיפור של המותג',
    location: 'אחרי אזור השלבים',
    help: 'תחנות קצרות שמספרות מאיפה המותג מגיע ומה הוא מביא לשולחן.',
    icon: <Home aria-hidden="true" />,
  },
  {
    id: 'samples',
    title: 'כיוונים להזמנה',
    location: 'אחרי סיפור המותג',
    help: 'לא מחירים ולא תפריט קשיח, אלא כיוונים שאפשר לערוך ולהציג.',
    icon: <ListChecks aria-hidden="true" />,
  },
  {
    id: 'coordination',
    title: 'תיאום וזמינות',
    location: 'אחרי כיוונים להזמנה ולפני פרטי ההזמנה',
    help: 'אזור פעילות, זמן פנייה, הצעת מחיר ואישור תפריט.',
    icon: <Phone aria-hidden="true" />,
  },
  {
    id: 'booking-basics',
    title: 'לפני שפונים',
    location: 'אחרי תיאום וזמינות',
    help: 'טקסט פתיחה לאזור שמסביר מה כדאי לדעת לפני שליחת פנייה.',
    icon: <ListChecks aria-hidden="true" />,
  },
  {
    id: 'seo',
    title: 'אזור SEO',
    location: 'אחרי לפני שפונים ולפני אמון',
    help: 'כותרת, טקסט ותגיות שמחזקים חיפוש והבנת השירות באתר.',
    icon: <Tag aria-hidden="true" />,
  },
  {
    id: 'trust',
    title: 'אמון ועובדות',
    location: 'אחרי פרטי ההזמנה, לפני שאלות ותשובות',
    help: 'כרטיסי אמון, עובדות קצרות והבטחות שירות.',
    icon: <ShieldCheck aria-hidden="true" />,
  },
  {
    id: 'faq',
    title: 'שאלות ותשובות',
    location: 'אחרי אזור האמון, לפני יצירת קשר',
    help: 'כל שאלה היא כרטיס שאפשר להוסיף, לכבות או לארכב.',
    icon: <HelpCircle aria-hidden="true" />,
  },
  {
    id: 'site-copy',
    title: 'טקסטי מעטפת',
    location: 'כותרות ופתיחים שמחזיקים את כל אזורי האתר',
    help: 'כאן עורכים את הכותרת, התווית והטקסט שמלווים כל אזור באתר.',
    icon: <FileText aria-hidden="true" />,
  },
  {
    id: 'site-microcopy',
    title: 'טקסטים קטנים',
    location: 'כפתורים, טופס, הודעות וואטסאפ וטקסטי עזר',
    help: 'מילים קצרות שהלקוח רואה ולוחץ עליהן, בלי להיכנס לקוד.',
    icon: <Tag aria-hidden="true" />,
  },
  {
    id: 'contact',
    title: 'תפריט עליון ויצירת קשר',
    location: 'סוף האתר, פרטי קשר, SEO ופרסום',
    help: 'כל שינוי כאן משפיע על דרכי הפנייה באתר ועל שיתופי הקישור.',
    icon: <Phone aria-hidden="true" />,
  },
];

const studioSections: readonly {
  readonly id: ActiveView;
  readonly label: string;
  readonly help: string;
  readonly icon: ReactNode;
}[] = [
  {
    id: 'site-map',
    label: 'ניהול האתר',
    help: 'האזורים לפי סדר ההופעה באתר, מה-Hero ועד יצירת קשר.',
    icon: <MonitorCheck aria-hidden="true" />,
  },
  {
    id: 'gallery',
    label: 'תמונות וגלריה',
    help: 'מאגר התמונות בדרייב ומה מתוכן מוצג באתר.',
    icon: <Images aria-hidden="true" />,
  },
  {
    id: 'contact',
    label: 'מטה דאטה ופרסום',
    help: 'טלפון, וואטסאפ, SEO, גרסה וכפתור עדכון אתר.',
    icon: <Tag aria-hidden="true" />,
  },
];

export const App = () => {
  const [authState, setAuthState] = useState<AuthState>('signed-out');
  const [session, setSession] = useState<Session | null>(null);
  const [content, setContent] = useState<ContentSnapshot>(emptyContent);
  const [activeView, setActiveView] = useState<ActiveView>('site-map');
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');
  const [publishState, setPublishState] = useState<PublishState>('clean');
  const [publishProgress, setPublishProgress] = useState<PublishProgress | null>(null);
  const [status, setStatus] = useState('התחברו כדי לנהל את התוכן האמיתי של האתר.');
  const [isBusy, setIsBusy] = useState(false);
  const [query, setQuery] = useState('');

  const mediaById = useMemo(() => new Map(content.media.map((media) => [media.id, media])), [content.media]);
  const validation = useMemo(() => contentSnapshotSchema.safeParse(content), [content]);
  const referenceIssues = useMemo(() => validateContentReferences(content), [content]);
  const canUseGoogle = Boolean(session && isGoogleConfigured);
  const hasErrors = !validation.success || referenceIssues.length > 0;
  const visibleMedia = content.media.filter((media) => !media.deletedAt);
  const activeGalleryCount = content.gallery.filter((item) => item.active && !item.deletedAt).length;
  const archivedCount = [
    ...content.gallery,
    ...content.services,
    ...content.sections,
    ...content.media,
  ].filter((item) => item.deletedAt).length;
  const driveMediaCount = visibleMedia.filter((media) => media.driveFileId).length;
  const filteredGallery = useMemo(
    () =>
      content.gallery
        .filter((item) => `${item.title} ${item.alt} ${item.category}`.toLowerCase().includes(query.toLowerCase()))
        .sort((left, right) => left.order - right.order),
    [content.gallery, query],
  );
  const seoTopicsSection = content.sections.find((section) => section.id === 'seo-topics');

  const markDraft = () => {
    if (authState === 'authorized') {
      setPublishProgress(null);
      setPublishState('draft');
      setStatus('יש שינויים שלא פורסמו עדיין. לחצו "עדכן אתר" כדי להעלות אותם לאתר החי.');
    }
  };

  const updateContent = (updater: (current: ContentSnapshot) => ContentSnapshot) => {
    setContent((current) => {
      const next = updater(current);
      const siteVersion = nextContentVersion();
      return {
        ...next,
        updatedAt: new Date().toISOString(),
        version: siteVersion,
        settings: {
          ...next.settings,
          siteVersion,
        },
      };
    });
    markDraft();
  };

  const loadAuthorizedSession = useCallback(async (token: GoogleAccessToken, knownEmail?: string) => {
    const email = knownEmail ?? await fetchGoogleUserEmail(token.accessToken);
    const allowed = studioConfig.allowedEditors.length === 0 || studioConfig.allowedEditors.includes(email);

    if (!allowed) {
      clearRememberedSession();
      setSession(null);
      setAuthState('denied');
      throw new Error('אין למשתמש הזה הרשאה לנהל את האתר.');
    }

    const remoteContent = ensureManagedSections(await readContentFromSheets(token.accessToken));
    const nextSession = { accessToken: token.accessToken, email, expiresAt: token.expiresAt };
    setSession(nextSession);
    rememberSession(nextSession);
    setContent(remoteContent);
    setAuthState('authorized');
    setPublishProgress(null);
    setPublishState('clean');
    setStatus('התוכן נטען מה-Sheets. אפשר לערוך וללחוץ "עדכן אתר" כדי לפרסם.');
    return nextSession;
  }, []);

  const getFreshAccessToken = useCallback(async () => {
    if (!session) {
      throw new Error('צריך להתחבר לפני שמירה.');
    }

    if (session.expiresAt > Date.now() + tokenRefreshWindowMs) {
      return session.accessToken;
    }

    const token = await requestGoogleAccessToken({ prompt: '' });
    const email = await fetchGoogleUserEmail(token.accessToken);
    if (email !== session.email) {
      clearRememberedSession();
      setSession(null);
      setAuthState('signed-out');
      throw new Error('התחברת עם משתמש אחר. צריך להתחבר שוב כדי להמשיך.');
    }

    const nextSession = { accessToken: token.accessToken, email, expiresAt: token.expiresAt };
    setSession(nextSession);
    rememberSession(nextSession);
    return token.accessToken;
  }, [session]);

  useEffect(() => {
    if (!isGoogleConfigured) {
      return;
    }

    const remembered = readRememberedSession();
    if (!remembered) {
      return;
    }

    let cancelled = false;

    const restore = async () => {
      setAuthState('loading');
      setIsBusy(true);
      setStatus('מחזירים אותך לסטודיו...');

      try {
        if (remembered.expiresAt <= Date.now() + tokenRefreshWindowMs) {
          throw new Error('Saved Google session expired');
        }
        const token = { accessToken: remembered.accessToken, expiresAt: remembered.expiresAt };
        await loadAuthorizedSession(token, remembered.email);
        if (!cancelled) {
          setStatus('החיבור הקודם נטען. אפשר להמשיך לעבוד.');
        }
      } catch {
        clearRememberedSession();
        if (!cancelled) {
          setSession(null);
          setAuthState('signed-out');
          setStatus('ההתחברות הקודמת פגה. צריך להתחבר שוב עם Google.');
        }
      } finally {
        if (!cancelled) {
          setIsBusy(false);
        }
      }
    };

    void restore();

    return () => {
      cancelled = true;
    };
  }, [loadAuthorizedSession]);

  const runTask = async (label: string, task: () => Promise<void>) => {
    setIsBusy(true);
    setStatus(`${label}...`);
    try {
      await task();
    } catch (error) {
      setPublishState('error');
      setStatus(formatError(error));
    } finally {
      setIsBusy(false);
    }
  };

  const handleLogin = () =>
    runTask('מתחברים לגוגל', async () => {
      if (!isGoogleConfigured) {
        throw new Error('חסרה הגדרת Google לסטודיו. צריך להגדיר Client ID ו-Sheet ID.');
      }

      setAuthState('loading');
      const token = await requestGoogleAccessToken({ prompt: 'consent' });
      await loadAuthorizedSession(token);
    });

  const handleRefresh = () => {
    if (!session) {
      return;
    }
    void runTask('מרעננים תוכן מ-Google Sheets', async () => {
      const accessToken = await getFreshAccessToken();
      setContent(ensureManagedSections(await readContentFromSheets(accessToken)));
      setPublishProgress(null);
      setPublishState('clean');
      setStatus('התוכן רוענן מה-Sheets.');
    });
  };

  const saveDraft = async () => {
    if (!session) {
      throw new Error('צריך להתחבר לפני שמירה.');
    }
    if (hasErrors) {
      throw new Error('יש שדות שצריך לתקן לפני שמירה.');
    }

    setPublishState('saving');
    const accessToken = await getFreshAccessToken();
    await saveContentToSheets(accessToken, { ...content, updatedAt: new Date().toISOString() });
    setPublishState('draft');
    setStatus('נשמר כטיוטה ב-Google Sheets. האתר החי עדיין לא השתנה.');
  };

  const handleSaveDraft = () => {
    void runTask('שומרים טיוטה', saveDraft);
  };

  const handleUpdateSite = () => {
    if (!session) {
      return;
    }

    void (async () => {
      const targetVersion = content.settings.siteVersion || content.version;
      const initialProgress: PublishProgress = {
        targetVersion,
        liveUrl: publicSiteOrigin,
        totalAttempts: liveVersionPollAttempts,
      };
      setIsBusy(true);
      setPublishProgress(initialProgress);
      setStatus(`מכינים פרסום לגרסת ${targetVersion}. קודם שומרים טיוטה, אחר כך שולחים לבנייה.`);
      try {
        await saveDraft();
        setPublishState('publishing');
        setStatus('הטיוטה נשמרה. שולחים את הפרסום ל-Cloudflare דרך השרת המאובטח.');
        const accessToken = await getFreshAccessToken();
        await triggerPublish(accessToken);

        setPublishState('published');
        setStatus(`הפרסום נשלח. Cloudflare קיבל את גרסת ${targetVersion} ומתחיל לבנות.`);
        await wait(900);

        setPublishState('checking');
        setStatus(`הפרסום נשלח. Cloudflare בונה עכשיו את גרסת ${targetVersion}; הסטודיו בודק מתי האתר החי מגיש אותה.`);
        setIsBusy(false);
        const liveProgress = await waitForLiveSiteVersion(targetVersion, ({ attempt, bundleUrl, checkedAt, message, totalAttempts }) => {
          setPublishState('checking');
          setPublishProgress({
            targetVersion,
            liveUrl: publicSiteOrigin,
            totalAttempts,
            attempt,
            checkedAt,
            lastBundleUrl: bundleUrl,
          });
          setStatus(message);
        });
        setPublishState('live');
        setPublishProgress({
          targetVersion,
          liveUrl: publicSiteOrigin,
          totalAttempts: liveProgress.totalAttempts,
          attempt: liveProgress.attempt,
          checkedAt: liveProgress.checkedAt,
          lastBundleUrl: liveProgress.bundleUrl,
        });
        setStatus(`האתר החי עודכן ומגיש עכשיו את גרסת ${targetVersion}.`);
      } catch (error) {
        setPublishState('error');
        setStatus(formatError(error));
      } finally {
        setIsBusy(false);
      }
    })();
  };

  const handleLogout = () => {
    clearRememberedSession();
    setSession(null);
    setAuthState('signed-out');
    setPublishProgress(null);
    setPublishState('clean');
    setContent(emptyContent);
    setStatus('התנתקת מהסטודיו. אפשר להתחבר שוב עם Google.');
  };

  const updateGallery = (id: string, patch: Partial<GalleryItemRecord>) => {
    updateContent((current) => ({ ...current, gallery: updateById(current.gallery, id, patch) }));
  };

  const updateMedia = (id: string, patch: Partial<ImageAssetRecord>) => {
    updateContent((current) => ({ ...current, media: updateById(current.media, id, patch) }));
  };

  const renameMedia = (id: string, nextId: string) => {
    const cleanId = normalizeMediaId(nextId);
    updateContent((current) => ({
      ...current,
      media: current.media.map((media) => (media.id === id ? { ...media, id: cleanId, src: media.driveFileId ? cmsSrcFor(cleanId) : media.src } : media)),
      gallery: current.gallery.map((item) => (item.mediaId === id ? { ...item, mediaId: cleanId } : item)),
      services: current.services.map((service) => (service.mediaId === id ? { ...service, mediaId: cleanId } : service)),
      sections: current.sections.map((section) => (
        section.group === 'hero-media' || section.group === 'manifesto'
          ? { ...section, items: section.items.map((item) => (item === id ? cleanId : item)) }
          : section
      )),
    }));
  };

  const updateService = (id: string, patch: Partial<ServiceRecord>) => {
    updateContent((current) => ({ ...current, services: updateById(current.services, id, patch) }));
  };

  const updateSection = (id: string, patch: Partial<SectionBlockRecord>) => {
    updateContent((current) => ({ ...current, sections: updateById(current.sections, id, patch) }));
  };

  const archiveGalleryItem = (id: string) => updateGallery(id, { active: false, deletedAt: archiveDate() });
  const restoreGalleryItem = (id: string) => updateGallery(id, { deletedAt: undefined });
  const archiveService = (id: string) => updateService(id, { active: false, deletedAt: archiveDate() });
  const restoreService = (id: string) => updateService(id, { deletedAt: undefined });
  const archiveSection = (id: string) => updateSection(id, { active: false, deletedAt: archiveDate() });
  const restoreSection = (id: string) => updateSection(id, { deletedAt: undefined });
  const archiveMedia = (id: string) => {
    const usages = getMediaUsage(id, content);
    const activeUsages = usages.filter((usage) => usage.active);
    if (activeUsages.length > 0) {
      const ok = window.confirm(`התמונה הזאת עדיין מוצגת באתר ב-${activeUsages.length} מקום/ות:\n${formatMediaUsage(activeUsages)}\n\nלהעביר אותה לארכיון בכל זאת?`);
      if (!ok) {
        setStatus('הארכוב בוטל. קודם החליפו את התמונה באזורים שבהם היא בשימוש.');
        return;
      }
    }

    updateMedia(id, { deletedAt: archiveDate() });
  };
  const restoreMedia = (id: string) => updateMedia(id, { deletedAt: undefined });

  const moveGalleryItem = (id: string, direction: -1 | 1) => {
    updateContent((current) => {
      const sorted = [...current.gallery].sort((left, right) => left.order - right.order);
      const index = sorted.findIndex((item) => item.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= sorted.length) {
        return current;
      }
      const currentItem = sorted[index];
      const nextItem = sorted[nextIndex];
      return {
        ...current,
        gallery: current.gallery.map((item) => {
          if (item.id === currentItem.id) return { ...item, order: nextItem.order };
          if (item.id === nextItem.id) return { ...item, order: currentItem.order };
          return item;
        }),
      };
    });
  };

  const normalizeCmsMetadata = () => {
    updateContent((current) => ({
      ...current,
      media: current.media.map((media) => (media.driveFileId ? { ...media, src: cmsSrcFor(media.id), responsive: true } : media)),
      gallery: current.gallery.map((item, index) => ({ ...item, order: index + 1, driveFileId: undefined })),
    }));
    setStatus('נתיבי המדיה נוקו לכתובות CMS. לחצו "עדכן אתר" כדי לפרסם את הניקוי.');
  };

  const addGalleryItem = (mediaId?: string) => {
    let duplicateTitle: string | null = null;

    updateContent((current) => {
      if (mediaId) {
        const existingItem = getGalleryItemForMedia(mediaId, current);
        if (existingItem) {
          duplicateTitle = existingItem.title;
          return current;
        }
      }

      return {
        ...current,
        gallery: [
          ...current.gallery,
          makeGalleryItem(current, mediaId),
        ],
      };
    });

    if (duplicateTitle) {
      setStatus(`התמונה כבר מחוברת לגלריה תחת "${duplicateTitle}". לא נוצר עותק נוסף.`);
      return;
    }

    if (mediaId) {
      setStatus('נוצר פריט גלריה חדש מהתמונה. בדקו שם, תיאור וקטגוריה לפני פרסום.');
    }
  };

  const duplicateGalleryItem = (item: GalleryItemRecord) => {
    updateContent((current) => ({
      ...current,
      gallery: [
        ...current.gallery,
        {
          ...item,
          id: `${item.id}-copy-${current.gallery.length + 1}`,
          title: `${item.title} - עותק`,
          order: current.gallery.length + 1,
          active: false,
          deletedAt: undefined,
        },
      ],
    }));
  };

  const addService = () => {
    updateContent((current) => ({
      ...current,
      services: [
        ...current.services,
        {
          id: `service-${current.services.length + 1}`,
          title: 'שירות חדש',
          subtitle: 'משפט קצר שמסביר את השירות',
          description: 'כאן כותבים מה הלקוח מקבל בשירות הזה.',
          bestFor: 'למי זה מתאים',
          promise: 'מה מבטיחים ללקוח',
          details: ['פרט ראשון', 'פרט שני'],
          cta: 'דברו איתנו',
          mediaId: current.media.find((media) => !media.deletedAt)?.id ?? '',
          icon: 'Sparkles',
          active: false,
          order: current.services.length + 1,
        },
      ],
    }));
  };

  const duplicateService = (service: ServiceRecord) => {
    updateContent((current) => ({
      ...current,
      services: [
        ...current.services,
        {
          ...service,
          id: `${service.id}-copy-${current.services.length + 1}`,
          title: `${service.title} - עותק`,
          active: false,
          order: current.services.length + 1,
          deletedAt: undefined,
        },
      ],
    }));
  };

  const addSection = (group = 'general') => {
    updateContent((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          id: `${group}-${current.sections.filter((section) => section.group === group).length + 1}`,
          group,
          title: 'מקטע חדש',
          text: 'טקסט לעריכה',
          items: [],
          active: false,
          order: current.sections.filter((section) => section.group === group).length + 1,
        },
      ],
    }));
  };

  const duplicateSection = (section: SectionBlockRecord) => {
    updateContent((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          ...section,
          id: `${section.id}-copy-${current.sections.filter((item) => item.group === section.group).length + 1}`,
          title: `${section.title ?? 'מקטע'} - עותק`,
          active: false,
          order: current.sections.filter((item) => item.group === section.group).length + 1,
          deletedAt: undefined,
        },
      ],
    }));
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !session) {
      return;
    }

    void runTask('מעלים תמונה ל-Google Drive', async () => {
      const accessToken = await getFreshAccessToken();
      const uploaded = await uploadImageToDrive(accessToken, file);
      const id = normalizeMediaId(uploaded.name);
      updateContent((current) => ({
        ...current,
        media: [
          ...current.media,
          {
            id,
            src: cmsSrcFor(id),
            width: uploaded.imageMediaMetadata?.width ?? 1200,
            height: uploaded.imageMediaMetadata?.height ?? 1600,
            sizes: '(max-width: 720px) 100vw, 33vw',
            responsive: true,
            driveFileId: uploaded.id,
            usageNotes: 'תמונה שהועלתה מהסטודיו',
          },
        ],
      }));
      setStatus('התמונה עלתה ל-Drive. חברו אותה לגלריה או לשירות ואז לחצו "עדכן אתר".');
    });
  };

  const handlePickDriveFile = (mediaId: string) => {
    if (!session) {
      return;
    }

    const activeUsages = getMediaUsage(mediaId, content).filter((usage) => usage.active);
    if (activeUsages.length > 0) {
      const ok = window.confirm(`התמונה הזאת מוצגת עכשיו באתר ב-${activeUsages.length} מקום/ות:\n${formatMediaUsage(activeUsages)}\n\nלהחליף את מקור ה-Drive שלה בכל זאת?`);
      if (!ok) {
        setStatus('החלפת מקור Drive בוטלה. קודם החליפו את התמונה באזורים שבהם היא בשימוש, או אשרו את ההחלפה.');
        return;
      }
    }

    void runTask('בוחרים תמונה מ-Google Drive', async () => {
      const accessToken = await getFreshAccessToken();
      const file = await openDrivePicker(accessToken);
      updateMedia(mediaId, { driveFileId: file.id, src: cmsSrcFor(mediaId), usageNotes: `מקור בדרייב: ${file.name}` });
      setStatus('נבחר מקור חדש מדרייב. לחצו "עדכן אתר" כדי ליצור ממנו תמונה מהירה באתר.');
    });
  };

  if (authState !== 'authorized' || !session) {
    return (
      <LoginGate
        authState={authState}
        isBusy={isBusy}
        status={status}
        onLogin={handleLogin}
        googleConfigured={isGoogleConfigured}
      />
    );
  }

  return (
    <main className={`studio-shell${isSidebarHidden ? ' is-sidebar-hidden' : ''}`}>
      <button
        type="button"
        className="sidebar-toggle"
        onClick={() => setIsSidebarHidden((current) => !current)}
        aria-expanded={!isSidebarHidden}
        aria-controls="studio-sidebar"
      >
        {isSidebarHidden ? <PanelRightOpen aria-hidden="true" /> : <PanelRightClose aria-hidden="true" />}
        {isSidebarHidden ? 'הצג תפריט' : 'הסתר תפריט'}
      </button>

      <aside id="studio-sidebar" className="studio-sidebar" aria-label="ניווט ניהול" aria-hidden={isSidebarHidden} inert={isSidebarHidden ? true : undefined}>
        <div className="brand-block">
          <img className="studio-logo" src={`${publicSiteOrigin}/brand/nis-logo.svg`} alt="Nis Boutique Catering" />
          <div>
            <h1>Nis Studio</h1>
            <p>ניהול האתר בלי קוד</p>
          </div>
        </div>
        <nav className="nav-stack">
          {studioSections.map((section) => (
            <button
              key={section.id}
              className={activeView === section.id || (section.id === 'site-map' && areaDefinitions.some((area) => area.id === activeView)) ? 'is-active' : ''}
              onClick={() => setActiveView(section.id)}
            >
              {section.icon}
              <span>
                <strong>{section.label}</strong>
                <small>{section.help}</small>
              </span>
            </button>
          ))}
        </nav>
        <div className="auth-panel">
          <ShieldCheck aria-hidden="true" />
          <strong>{session.email}</strong>
          <span>מחובר ל-Google Sheets + Drive</span>
          <button type="button" className="logout-button" onClick={handleLogout}>
            התנתק
          </button>
        </div>
        <a className="creator-credit studio-credit" href={creatorUrl} target="_blank" rel="noreferrer">
          נבנה באהבה על ידי EvyatarHazan.com
        </a>
      </aside>

      <section className="studio-main">
        <header className="topbar">
          <div>
            <p className="kicker">ניהול אתר Nis</p>
            <h2>{activeView === 'site-map' ? 'ניהול מלא של האתר' : activeView === 'contact' ? 'מטה דאטה ופרסום' : areaDefinitions.find((area) => area.id === activeView)?.title ?? 'תוכן האתר'}</h2>
            <p className="topbar-help">כל שינוי מקבל גרסה חדשה ונשמר כטיוטה. רק הכפתור "עדכן אתר" מפרסם לאתר החי.</p>
          </div>
          <div className="topbar-actions">
            {activeView !== 'site-map' && (
              <button className="ghost-button" onClick={() => setActiveView('site-map')}>
                <Home aria-hidden="true" />
                חזרה לניהול אתר
              </button>
            )}
            <button className="ghost-button" onClick={handleRefresh} disabled={isBusy || !canUseGoogle}>
              <RefreshCw aria-hidden="true" />
              רענון מה-Sheets
            </button>
            <button className="ghost-button" onClick={handleSaveDraft} disabled={isBusy || !canUseGoogle || hasErrors}>
              <Save aria-hidden="true" />
              שמור טיוטה
            </button>
            <button className="publish-button" onClick={handleUpdateSite} disabled={isBusy || !canUseGoogle || hasErrors || !studioConfig.publishUrl}>
              <Rocket aria-hidden="true" />
              עדכן אתר
            </button>
          </div>
        </header>

        <StatusPanel
          publishState={publishState}
          status={hasErrors ? validationErrorText(validation, referenceIssues) : status}
          hasErrors={hasErrors}
        />
        <EditingWorkflow
          activeView={activeView}
          publishState={publishState}
          hasErrors={hasErrors}
          hasPublishUrl={Boolean(studioConfig.publishUrl)}
        />

        <section className="overview-strip" aria-label="מצב התוכן">
          <Metric label="תמונות פעילות בגלריה" value={String(activeGalleryCount)} />
          <Metric label="תמונות מחוברות ל-Drive" value={String(driveMediaCount)} />
          <Metric label="שירותים באתר" value={String(content.services.filter((service) => !service.deletedAt).length)} />
          <Metric label="פריטים בארכיון" value={String(archivedCount)} />
          <Metric label="גרסת תוכן" value={content.settings.siteVersion || content.version} />
        </section>

        {activeView === 'site-map' && (
          <SiteMapPanel content={content} mediaById={mediaById} onOpen={setActiveView} />
        )}

        {activeView === 'hero' && (
          <HeroEditor
            content={content}
            mediaById={mediaById}
            previewDevice={previewDevice}
            onPreviewDeviceChange={setPreviewDevice}
            updateSection={updateSection}
            addSection={addSection}
          />
        )}

        {activeView === 'intro-band' && (
          <IntroBandEditor
            content={content}
            mediaById={mediaById}
            previewDevice={previewDevice}
            onPreviewDeviceChange={setPreviewDevice}
            updateSection={updateSection}
            addSection={addSection}
          />
        )}

        {activeView === 'experience-lab' && (
          <CopyOnlySectionEditor
            content={content}
            mediaById={mediaById}
            sectionId="experience-lab"
            title="בחרו את החוויה"
            text="הטקסט שמלווה את אזור בחירת החוויה באתר. כאן מסבירים למה לבחור קודם את סוג האירוח ומה קורה אחר כך."
            previewDevice={previewDevice}
            onPreviewDeviceChange={setPreviewDevice}
            updateSection={updateSection}
          />
        )}

        {activeView === 'contact' && (
          <section className="workspace-panel split-editor">
            <div className="editor-column settings-grid">
              <PanelHeader title="מטה דאטה, יצירת קשר ופרסום" text="כאן משנים את פרטי ההתקשרות, SEO, גרסת התוכן ומפעילים עדכון אתר." />
              <Field label="טלפון שמוצג באתר" help="מופיע בתפריט, בכפתורי יצירת קשר ובתחתית האתר.">
                <TextInput value={content.settings.phoneDisplay} onChange={(value) => updateContent((current) => ({ ...current, settings: { ...current.settings, phoneDisplay: value } }))} />
              </Field>
              <Field label="קישור טלפון" help="צריך להתחיל ב-tel: כדי שלחיצה במובייל תפתח שיחה.">
                <TextInput value={content.settings.phoneHref} onChange={(value) => updateContent((current) => ({ ...current, settings: { ...current.settings, phoneHref: value } }))} />
              </Field>
              <Field label="אימייל" help="מופיע בפרטי קשר ובמטא דאטה של האתר.">
                <TextInput value={content.settings.email} onChange={(value) => updateContent((current) => ({ ...current, settings: { ...current.settings, email: value } }))} />
              </Field>
              <Field label="קישור WhatsApp" help="כל כפתורי הוואטסאפ באתר משתמשים בכתובת הזו.">
                <TextInput value={content.settings.whatsappBase} onChange={(value) => updateContent((current) => ({ ...current, settings: { ...current.settings, whatsappBase: value } }))} />
              </Field>
              <details className="technical-details">
                <summary>פרטי פרסום מתקדמים</summary>
                <Field label="גרסת תוכן אוטומטית" help="מתעדכן לבד בכל שינוי. בדרך כלל אין צורך לשנות ידנית.">
                  <TextInput value={content.settings.siteVersion} onChange={(value) => updateContent((current) => ({ ...current, settings: { ...current.settings, siteVersion: value } }))} />
                </Field>
              </details>
              <Field label="כותרת SEO" help="כותרת הדף שמופיעה בדפדפן ובשיתוף קישורים.">
                <TextInput value={content.settings.seoTitle ?? ''} onChange={(value) => updateContent((current) => ({ ...current, settings: { ...current.settings, seoTitle: value || undefined } }))} />
              </Field>
              <Field label="תיאור SEO" help="תיאור קצר למנועי חיפוש ושיתופים.">
                <textarea value={content.settings.seoDescription ?? ''} onChange={(event) => updateContent((current) => ({ ...current, settings: { ...current.settings, seoDescription: event.target.value || undefined } }))} />
              </Field>
            </div>
            <div className="preview-column">
              <PreviewHeader
                title="תצוגה מקדימה כמו באתר"
                text="כך אזור יצירת הקשר ופרטי ה-SEO ירגישו ללקוח במחשב או במובייל."
                device={previewDevice}
                onDeviceChange={setPreviewDevice}
              />
              <ContactPreview content={content} mediaById={mediaById} device={previewDevice} />
              <MetadataSeoPreview content={content} device={previewDevice} />
              <PublishPanel
                content={content}
                hasErrors={hasErrors}
                status={hasErrors ? validationErrorText(validation, referenceIssues) : status}
                publishState={publishState}
                publishProgress={publishProgress}
                hasPublishUrl={Boolean(studioConfig.publishUrl)}
                onSaveDraft={handleSaveDraft}
                onPublish={handleUpdateSite}
                disabled={isBusy || !canUseGoogle || hasErrors}
              />
            </div>
          </section>
        )}

        {activeView === 'services' && (
          <section className="workspace-panel split-editor">
            <div className="editor-column">
              <PanelHeader
                title="מה מזמינים"
                text="כל כרטיס כאן הוא שירות שמופיע באזור המרכזי באתר. אפשר לכבות, לשכפל, להוסיף או להעביר לארכיון."
                action={
                  <button className="compact-button" onClick={addService}>
                    <Plus aria-hidden="true" />
                    הוסף שירות
                  </button>
                }
              />
              <div className="cards-list">
                {[...content.services].sort((left, right) => left.order - right.order).map((service) => (
                <article className={service.deletedAt ? 'edit-card service-card is-archived' : 'edit-card service-card'} key={service.id}>
                  <DrivePreviewImage media={mediaById.get(service.mediaId)} accessToken={session.accessToken} />
                  <div className="card-heading">
                    <div>
                      <p className="kicker">כרטיס שירות באתר</p>
                      <h3>{service.title}</h3>
                    </div>
                    <ItemActions
                      isArchived={Boolean(service.deletedAt)}
                      onDuplicate={() => duplicateService(service)}
                      onArchive={() => archiveService(service.id)}
                      onRestore={() => restoreService(service.id)}
                    />
                  </div>
                  <div className="toggle-row">
                    <Toggle checked={service.active && !service.deletedAt} label="מוצג באתר" onChange={(checked) => updateService(service.id, { active: checked })} />
                  </div>
                  <Field label="שם השירות" help="הכותרת הראשית של כרטיס השירות.">
                    <TextInput value={service.title} onChange={(value) => updateService(service.id, { title: value })} />
                  </Field>
                  <Field label="כותרת משנה" help="שורת ההסבר הקצרה מתחת לשם השירות.">
                    <TextInput value={service.subtitle} onChange={(value) => updateService(service.id, { subtitle: value })} />
                  </Field>
                  <Field label="תיאור" help="הטקסט המרכזי בכרטיס השירות.">
                    <textarea value={service.description} onChange={(event) => updateService(service.id, { description: event.target.value })} />
                  </Field>
                  <div className="inline-grid">
                    <Field label="מתאים ל..." help="שורת התאמה קצרה באתר.">
                      <TextInput value={service.bestFor} onChange={(value) => updateService(service.id, { bestFor: value })} />
                    </Field>
                    <Field label="משפט הבטחה" help="הדגשה קטנה בכרטיס השירות.">
                      <TextInput value={service.promise} onChange={(value) => updateService(service.id, { promise: value })} />
                    </Field>
                  </div>
                  <Field label="נקודות שירות" help="כל נקודה מופרדת בסימן |">
                    <TextInput value={joinPipeList(service.details)} onChange={(value) => updateService(service.id, { details: splitPipeList(value) })} />
                  </Field>
                  <div className="inline-grid">
                    <Field label="תמונה לשירות" help="איזו תמונה תופיע בכרטיס.">
                      <select value={service.mediaId} onChange={(event) => updateService(service.id, { mediaId: event.target.value })}>
                        {visibleMedia.map((media) => <option key={media.id} value={media.id}>{mediaLabel(media, content)}</option>)}
                      </select>
                    </Field>
                    <MediaQuickPicker
                      label="בחירה מהירה לתמונת השירות"
                      mediaItems={visibleMedia}
                      selectedMediaId={service.mediaId}
                      content={content}
                      onSelect={(mediaId) => updateService(service.id, { mediaId })}
                    />
                    <MediaSelectionUsageNotice
                      mediaId={service.mediaId}
                      content={content}
                      currentUsage={{ kind: 'service', id: service.id }}
                    />
                    <Field label="טקסט כפתור" help="כפתור הפעולה בכרטיס.">
                      <TextInput value={service.cta} onChange={(value) => updateService(service.id, { cta: value })} />
                    </Field>
                  </div>
                  <details className="technical-details">
                    <summary>הגדרות טכניות</summary>
                    <TextInput value={service.id} onChange={(value) => updateService(service.id, { id: value })} />
                    <TextInput value={service.icon} onChange={(value) => updateService(service.id, { icon: value })} />
                    <NumberInput value={service.order} onChange={(value) => updateService(service.id, { order: value })} />
                  </details>
                </article>
                ))}
              </div>
            </div>
            <div className="preview-column">
              <PreviewHeader
                title="תצוגה מקדימה כמו באתר"
                text="אפשר לעבור בין מחשב למובייל ולראות איך כרטיסי השירות ירגישו ללקוח."
                device={previewDevice}
                onDeviceChange={setPreviewDevice}
              />
              <ServicesPreview content={content} mediaById={mediaById} device={previewDevice} />
            </div>
          </section>
        )}

        {activeView === 'gallery' && (
          <section className="workspace-panel">
            <PanelHeader
              title="תמונות וגלריה"
              text="זה מסך אחד: קודם מנהלים את התמונות שמופיעות בגלריה, ובהמשך אותו מסך מציג את כל מאגר התמונות מדרייב."
              action={
                <div className="action-row">
                  <button className="compact-button" onClick={normalizeCmsMetadata}>
                    <Wand2 aria-hidden="true" />
                    ניקוי מדיה
                  </button>
                  <button className="compact-button" onClick={() => addGalleryItem()}>
                    <ImagePlus aria-hidden="true" />
                    הוספת תמונה לגלריה
                  </button>
                </div>
              }
            />
            <PreviewHeader
              title="תצוגה מקדימה כמו באתר"
              text="כך התמונות הראשונות בגלריה יופיעו במחשב או במובייל אחרי פרסום."
              device={previewDevice}
              onDeviceChange={setPreviewDevice}
            />
              <GallerySitePreview content={content} mediaById={mediaById} device={previewDevice} />
            <label className="search-box">
              <Search aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="חיפוש לפי שם, תיאור או קטגוריה" />
            </label>
            <div className="subsection-heading gallery-area-heading is-site-gallery">
              <div>
                <p className="kicker">גלריה באתר</p>
                <h3>התמונות שהלקוח רואה בפועל</h3>
                <p>כל פריט כאן הוא מקום בגלריה הציבורית. אפשר לשנות סדר, שם, קטגוריה, תיאור ותמונה מחוברת.</p>
              </div>
              <div className="area-status-pill">
                <Images aria-hidden="true" />
                <span>{filteredGallery.length} פריטים לעריכה</span>
              </div>
            </div>
            <div className="gallery-editor-grid">
              {filteredGallery.map((item) => {
                const media = mediaById.get(item.mediaId);
                return (
                  <article className={item.deletedAt ? 'gallery-edit-card is-archived' : item.active ? 'gallery-edit-card' : 'gallery-edit-card is-muted'} key={item.id}>
                    <DrivePreviewImage media={media} accessToken={session.accessToken} />
                    <div className="card-heading">
                      <div>
                        <p className="kicker">תמונה מספר {item.order}</p>
                        <h3>{item.title}</h3>
                      </div>
                      <div className="row-actions">
                        <button type="button" className="icon-button" onClick={() => moveGalleryItem(item.id, -1)} aria-label="העלאה למעלה">
                          <ArrowUp aria-hidden="true" />
                        </button>
                        <button type="button" className="icon-button" onClick={() => moveGalleryItem(item.id, 1)} aria-label="הורדה למטה">
                          <ArrowDown aria-hidden="true" />
                        </button>
                        <ItemActions
                          isArchived={Boolean(item.deletedAt)}
                          onDuplicate={() => duplicateGalleryItem(item)}
                          onArchive={() => archiveGalleryItem(item.id)}
                          onRestore={() => restoreGalleryItem(item.id)}
                        />
                      </div>
                    </div>
                    <Field label="שם פנימי לתמונה" help="עוזר לזהות את התמונה בסטודיו.">
                      <TextInput value={item.title} onChange={(value) => updateGallery(item.id, { title: value })} />
                    </Field>
                    <Field label="תיאור נגיש לתמונה" help="לא תמיד מוצג באתר, אבל חשוב לנגישות ול-SEO.">
                      <TextInput value={item.alt} onChange={(value) => updateGallery(item.id, { alt: value })} />
                    </Field>
                    <div className="inline-grid">
                      <Field label="קטגוריה באתר" help="באיזה פילטר בגלריה התמונה תופיע.">
                        <select value={item.category} onChange={(event) => updateGallery(item.id, { category: event.target.value as GalleryItemRecord['category'] })}>
                          {editableCategories.map((category) => <option key={category} value={category}>{categoryLabels[category]}</option>)}
                        </select>
                      </Field>
                      <Field label="תמונה מחוברת" help="איזה מקור מדיה ישמש לפריט הזה.">
                        <select value={item.mediaId} onChange={(event) => updateGallery(item.id, { mediaId: event.target.value })}>
                          {visibleMedia.map((mediaItem) => <option key={mediaItem.id} value={mediaItem.id}>{mediaLabel(mediaItem, content)}</option>)}
                        </select>
                      </Field>
                    </div>
                    <MediaQuickPicker
                      label="בחירה מהירה לתמונת הגלריה"
                      mediaItems={visibleMedia}
                      selectedMediaId={item.mediaId}
                      content={content}
                      onSelect={(mediaId) => updateGallery(item.id, { mediaId })}
                    />
                    <MediaSelectionUsageNotice
                      mediaId={item.mediaId}
                      content={content}
                      currentUsage={{ kind: 'gallery', id: item.id }}
                    />
                    <div className="toggle-row">
                      <Toggle checked={item.active} label="מוצג באתר" onChange={(checked) => updateGallery(item.id, { active: checked })} />
                      <Toggle checked={item.tall} label="תמונה גבוהה" onChange={(checked) => updateGallery(item.id, { tall: checked })} />
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="subsection-heading gallery-area-heading is-media-library">
              <div>
                <p className="kicker">ספריית תמונות</p>
                <h3>כל מקורות התמונות, גם כאלה שלא מוצגים בגלריה</h3>
                <p>כאן מנהלים את מקור התמונה בדרייב ואת מפת השימושים. כדי להציג תמונה באתר, חברו אותה לפריט באזור “גלריה באתר”.</p>
              </div>
              <div className="area-heading-actions">
                <div className="area-status-pill">
                  <Cloud aria-hidden="true" />
                  <span>{content.media.filter((media) => !media.deletedAt).length} תמונות בספרייה</span>
                </div>
                <label className="compact-button file-button">
                  <Upload aria-hidden="true" />
                  העלאה ל-Drive
                  <input type="file" accept="image/*" onChange={handleUpload} disabled={!canUseGoogle} />
                </label>
              </div>
            </div>
            <div className="media-grid compact-media-grid">
              {content.media.map((media) => {
                const galleryItem = getGalleryItemForMedia(media.id, content);
                const galleryButtonLabel = galleryItem ? 'כבר בגלריה' : 'הוסף לגלריה';

                return (
                  <article className={media.deletedAt ? 'media-card is-archived' : 'media-card'} key={media.id}>
                    <DrivePreviewImage media={media} accessToken={session.accessToken} />
                    <div className="card-heading">
                      <div>
                        <p className="kicker">{mediaStatus(media, content)}</p>
                        <h3>{mediaLabel(media, content)}</h3>
                      </div>
                      <ItemActions
                        isArchived={Boolean(media.deletedAt)}
                        onDuplicate={undefined}
                        onArchive={() => archiveMedia(media.id)}
                        onRestore={() => restoreMedia(media.id)}
                      />
                    </div>
                    <div className="usage-list">
                      <strong>איפה זה משפיע באתר</strong>
                      <MediaUsageList mediaId={media.id} content={content} />
                    </div>
                    <MediaRiskNotice mediaId={media.id} content={content} />
                    <div className="media-quick-actions">
                      <button
                        className={galleryItem ? 'ghost-button is-confirmed' : 'ghost-button'}
                        onClick={() => addGalleryItem(media.id)}
                        disabled={Boolean(media.deletedAt) || Boolean(galleryItem)}
                        title={galleryItem ? `כבר מחובר לפריט "${galleryItem.title}"` : undefined}
                      >
                        {galleryButtonLabel}
                      </button>
                      <button className="ghost-button" onClick={() => handlePickDriveFile(media.id)} disabled={!canUseGoogle}>החלף מקור מדרייב</button>
                    </div>
                    <details className="technical-details">
                      <summary>פרטים מתקדמים</summary>
                      <Field label="שם תמונה בסטודיו" help="שם קצר באנגלית שמזהה את התמונה במערכת.">
                        <TextInput value={media.id} onChange={(value) => renameMedia(media.id, value)} />
                      </Field>
                      <div className="inline-grid">
                        <Field label="רוחב" help="נלקח מהתמונה המקורית בדרייב.">
                          <NumberInput value={media.width} onChange={(value) => updateMedia(media.id, { width: value })} />
                        </Field>
                        <Field label="גובה" help="נלקח מהתמונה המקורית בדרייב.">
                          <NumberInput value={media.height} onChange={(value) => updateMedia(media.id, { height: value })} />
                        </Field>
                      </div>
                      <Field label="הערות שימוש" help="הסבר פנימי איפה כדאי להשתמש בתמונה.">
                        <TextInput value={media.usageNotes ?? ''} onChange={(value) => updateMedia(media.id, { usageNotes: value })} />
                      </Field>
                      <Field label="כתובת באתר אחרי פרסום" help="נוצרת אוטומטית מתוך Drive בזמן build.">
                        <TextInput value={media.src} onChange={(value) => updateMedia(media.id, { src: value })} />
                      </Field>
                      <Field label="מקור Drive" help="מזהה הקובץ בדרייב.">
                        <TextInput value={media.driveFileId ?? ''} onChange={(value) => updateMedia(media.id, { driveFileId: value || undefined })} />
                      </Field>
                    </details>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {activeView === 'real-media' && (
          <CopyOnlySectionEditor
            content={content}
            mediaById={mediaById}
            sectionId="real-media"
            title="וידאו אמיתי"
            text="כותרת וטקסט לאזור הווידאו. אם האזור לא משרת את האתר, אפשר לכבות אותו כאן במקום להשאיר אותו לא ברור."
            previewDevice={previewDevice}
            onPreviewDeviceChange={setPreviewDevice}
            updateSection={updateSection}
          />
        )}

        {activeView === 'audience' && (
          <SectionGroupEditor
            title="למי זה מתאים"
            text="כרטיסים שמסבירים למבקר באתר אם השירות מתאים לו. אם עדיין אין כאלה ב-Sheets, אפשר להוסיף כאן."
            group="audience"
            content={content}
            mediaById={mediaById}
            sections={content.sections}
            updateSection={updateSection}
            addSection={addSection}
            duplicateSection={duplicateSection}
            archiveSection={archiveSection}
            restoreSection={restoreSection}
            previewDevice={previewDevice}
            onPreviewDeviceChange={setPreviewDevice}
          />
        )}

        {activeView === 'editorial' && (
          <SectionGroupEditor
            title="קטגוריות פתיחה"
            text="שלושת הכרטיסים הראשונים באתר שמסבירים מהר מה אפשר להזמין. בשדה נקודות נוספות: נקודה ראשונה היא התווית הקטנה, נקודה שנייה יכולה להיות שם אייקון."
            group="editorial"
            content={content}
            mediaById={mediaById}
            sections={content.sections}
            updateSection={updateSection}
            addSection={addSection}
            duplicateSection={duplicateSection}
            archiveSection={archiveSection}
            restoreSection={restoreSection}
            previewDevice={previewDevice}
            onPreviewDeviceChange={setPreviewDevice}
          />
        )}

        {activeView === 'site-copy' && (
          <SectionGroupEditor
            title="טקסטי מעטפת"
            text="כותרות, תוויות ופתיחים של אזורי האתר. הכותרת היא H2, הטקסט הוא ההסבר, ונקודה ראשונה היא התווית הקטנה מעל הכותרת."
            group="site-copy"
            content={content}
            mediaById={mediaById}
            sections={content.sections}
            updateSection={updateSection}
            addSection={addSection}
            duplicateSection={duplicateSection}
            archiveSection={archiveSection}
            restoreSection={restoreSection}
            previewDevice={previewDevice}
            onPreviewDeviceChange={setPreviewDevice}
          />
        )}

        {activeView === 'site-microcopy' && (
          <SectionGroupEditor
            title="טקסטים קטנים"
            text="כפתורים, תוויות בטופס, הודעות וואטסאפ וטקסטי עזר קצרים. השם הפנימי עוזר להבין איפה הטקסט מופיע; השדה טקסט הוא מה שהלקוח יראה."
            group="site-microcopy"
            content={content}
            mediaById={mediaById}
            sections={content.sections}
            updateSection={updateSection}
            addSection={addSection}
            duplicateSection={duplicateSection}
            archiveSection={archiveSection}
            restoreSection={restoreSection}
            previewDevice={previewDevice}
            onPreviewDeviceChange={setPreviewDevice}
          />
        )}

        {activeView === 'manifesto' && (
          <ManifestoEditor
            content={content}
            mediaById={mediaById}
            updateSection={updateSection}
            addSection={addSection}
            duplicateSection={duplicateSection}
            archiveSection={archiveSection}
            restoreSection={restoreSection}
            previewDevice={previewDevice}
            onPreviewDeviceChange={setPreviewDevice}
          />
        )}

        {activeView === 'boutique' && (
          <SectionGroupEditor
            title="למה זה בוטיק"
            text="כרטיסים קצרים שמסבירים את הערך: התאמה, נראות, יחס אישי וטעם ביתי."
            group="boutique"
            content={content}
            mediaById={mediaById}
            sections={content.sections}
            updateSection={updateSection}
            addSection={addSection}
            duplicateSection={duplicateSection}
            archiveSection={archiveSection}
            restoreSection={restoreSection}
            previewDevice={previewDevice}
            onPreviewDeviceChange={setPreviewDevice}
          />
        )}

        {activeView === 'signature' && (
          <SectionGroupEditor
            title="רגעי בוטיק"
            text="כרטיסי תמונה וטקסט שמחזקים את האופי הוויזואלי של האתר. כרגע התמונות נשמרות מהאתר והטקסט מנוהל כאן."
            group="signature"
            content={content}
            mediaById={mediaById}
            sections={content.sections}
            updateSection={updateSection}
            addSection={addSection}
            duplicateSection={duplicateSection}
            archiveSection={archiveSection}
            restoreSection={restoreSection}
            previewDevice={previewDevice}
            onPreviewDeviceChange={setPreviewDevice}
          />
        )}

        {activeView === 'process' && (
          <SectionGroupEditor
            title="איך זה עובד"
            text="שלבים פשוטים שמסבירים ללקוח מה קורה מהרגע שהוא פונה ועד שהאוכל מוכן."
            group="process"
            content={content}
            mediaById={mediaById}
            sections={content.sections}
            updateSection={updateSection}
            addSection={addSection}
            duplicateSection={duplicateSection}
            archiveSection={archiveSection}
            restoreSection={restoreSection}
            previewDevice={previewDevice}
            onPreviewDeviceChange={setPreviewDevice}
          />
        )}

        {activeView === 'story' && (
          <SectionGroupEditor
            title="הסיפור של המותג"
            text="התחנות הקצרות שמופיעות באזור הסיפור: מאיפה Nis באה, מה המטבח מביא, ומה מגיע לשולחן."
            group="story"
            content={content}
            mediaById={mediaById}
            sections={content.sections}
            updateSection={updateSection}
            addSection={addSection}
            duplicateSection={duplicateSection}
            archiveSection={archiveSection}
            restoreSection={restoreSection}
            previewDevice={previewDevice}
            onPreviewDeviceChange={setPreviewDevice}
          />
        )}

        {activeView === 'samples' && (
          <SectionGroupEditor
            title="כיוונים להזמנה"
            text="כל כרטיס הוא כיוון תפריט. הכותרת היא שם הכיוון, הטקסט הוא הפתיח, והנקודות הן הפריטים שמופיעים ברשימה."
            group="samples"
            content={content}
            mediaById={mediaById}
            sections={content.sections}
            updateSection={updateSection}
            addSection={addSection}
            duplicateSection={duplicateSection}
            archiveSection={archiveSection}
            restoreSection={restoreSection}
            previewDevice={previewDevice}
            onPreviewDeviceChange={setPreviewDevice}
          />
        )}

        {activeView === 'coordination' && (
          <SectionGroupEditor
            title="תיאום וזמינות"
            text="פרטים מעשיים שמרגיעים את הלקוח לפני פנייה: אזור פעילות, זמן פנייה, הצעת מחיר ואישור תפריט."
            group="coordination"
            content={content}
            mediaById={mediaById}
            sections={content.sections}
            updateSection={updateSection}
            addSection={addSection}
            duplicateSection={duplicateSection}
            archiveSection={archiveSection}
            restoreSection={restoreSection}
            previewDevice={previewDevice}
            onPreviewDeviceChange={setPreviewDevice}
          />
        )}

        {activeView === 'booking-basics' && (
          <CopyOnlySectionEditor
            content={content}
            mediaById={mediaById}
            sectionId="booking-basics"
            title="לפני שפונים"
            text="הטקסט שמסביר ללקוח מה כדאי לדעת לפני שליחת פנייה: סוג אירוח, כמות ותאריך."
            previewDevice={previewDevice}
            onPreviewDeviceChange={setPreviewDevice}
            updateSection={updateSection}
          />
        )}

        {activeView === 'seo' && (
          <CopyOnlySectionEditor
            content={content}
            mediaById={mediaById}
            sectionId="seo"
            title="אזור SEO"
            text="כאן עורכים את אזור הטקסט שמיועד גם להבנת השירות וגם לחיפוש. התגיות מוצגות באתר כתוויות קצרות."
            previewDevice={previewDevice}
            onPreviewDeviceChange={setPreviewDevice}
            updateSection={updateSection}
            tagsSection={seoTopicsSection}
          />
        )}

        {activeView === 'trust' && (
          <SectionGroupEditor
            title="אמון ועובדות"
            text="נקודות שמרגיעות לקוח לפני שהוא פונה: זמינות, התאמה אישית, אזור פעילות ועוד."
            group="trust"
            content={content}
            mediaById={mediaById}
            sections={content.sections}
            updateSection={updateSection}
            addSection={addSection}
            duplicateSection={duplicateSection}
            archiveSection={archiveSection}
            restoreSection={restoreSection}
            previewDevice={previewDevice}
            onPreviewDeviceChange={setPreviewDevice}
          />
        )}

        {activeView === 'faq' && (
          <SectionGroupEditor
            title="שאלות ותשובות"
            text="כל כרטיס הוא שאלה באתר. הכותרת היא השאלה, והטקסט הוא התשובה."
            group="faq"
            content={content}
            mediaById={mediaById}
            sections={content.sections}
            updateSection={updateSection}
            addSection={addSection}
            duplicateSection={duplicateSection}
            archiveSection={archiveSection}
            restoreSection={restoreSection}
            previewDevice={previewDevice}
            onPreviewDeviceChange={setPreviewDevice}
          />
        )}

        {activeView === 'publish' && (
          <PublishPanel
            content={content}
            hasErrors={hasErrors}
            status={hasErrors ? validationErrorText(validation, referenceIssues) : status}
            publishState={publishState}
            publishProgress={publishProgress}
            hasPublishUrl={Boolean(studioConfig.publishUrl)}
            onSaveDraft={handleSaveDraft}
            onPublish={handleUpdateSite}
            disabled={isBusy || !canUseGoogle || hasErrors}
          />
        )}

        {activeView === 'media' && (
          <section className="workspace-panel">
            <PanelHeader
              title="תמונות בדרייב"
              text="Drive הוא מקור העריכה. כאן רואים כל תמונה, איפה היא משמשת, ומה יקרה לה אחרי עדכון האתר."
              action={
                <label className="compact-button file-button">
                  <Upload aria-hidden="true" />
                  העלאה ל-Drive
                  <input type="file" accept="image/*" onChange={handleUpload} disabled={!canUseGoogle} />
                </label>
              }
            />
            <div className="media-grid">
              {content.media.map((media) => {
                const galleryItem = getGalleryItemForMedia(media.id, content);
                const galleryButtonLabel = galleryItem ? 'כבר בגלריה' : 'הוסף לגלריה';

                return (
                  <article className={media.deletedAt ? 'media-card is-archived' : 'media-card'} key={media.id}>
                    <DrivePreviewImage media={media} accessToken={session.accessToken} />
                    <div className="card-heading">
                      <div>
                        <p className="kicker">{mediaStatus(media, content)}</p>
                        <h3>{mediaLabel(media, content)}</h3>
                      </div>
                      <ItemActions
                        isArchived={Boolean(media.deletedAt)}
                        onDuplicate={undefined}
                        onArchive={() => archiveMedia(media.id)}
                        onRestore={() => restoreMedia(media.id)}
                      />
                    </div>
                    <div className="usage-list">
                      <strong>איפה זה משפיע באתר</strong>
                      <MediaUsageList mediaId={media.id} content={content} />
                    </div>
                    <MediaRiskNotice mediaId={media.id} content={content} />
                    <div className="inline-grid">
                      <Field label="רוחב" help="נלקח מהתמונה המקורית בדרייב.">
                        <NumberInput value={media.width} onChange={(value) => updateMedia(media.id, { width: value })} />
                      </Field>
                      <Field label="גובה" help="נלקח מהתמונה המקורית בדרייב.">
                        <NumberInput value={media.height} onChange={(value) => updateMedia(media.id, { height: value })} />
                      </Field>
                    </div>
                    <Field label="הערות שימוש" help="הסבר פנימי איפה כדאי להשתמש בתמונה.">
                      <TextInput value={media.usageNotes ?? ''} onChange={(value) => updateMedia(media.id, { usageNotes: value })} />
                    </Field>
                    <div className="asset-path">
                      <Cloud aria-hidden="true" />
                      <span>באתר אחרי פרסום: {media.driveFileId ? cmsSrcFor(media.id) : media.src}</span>
                    </div>
                    <div className="media-quick-actions">
                      <button
                        className={galleryItem ? 'ghost-button is-confirmed' : 'ghost-button'}
                        onClick={() => addGalleryItem(media.id)}
                        disabled={Boolean(media.deletedAt) || Boolean(galleryItem)}
                        title={galleryItem ? `כבר מחובר לפריט "${galleryItem.title}"` : undefined}
                      >
                        {galleryButtonLabel}
                      </button>
                      <button className="ghost-button" onClick={() => handlePickDriveFile(media.id)} disabled={!canUseGoogle}>בחירה מ-Drive</button>
                    </div>
                    <details className="technical-details">
                      <summary>פרטים מתקדמים</summary>
                      <Field label="שם תמונה בסטודיו" help="שם קצר באנגלית שמזהה את התמונה במערכת.">
                        <TextInput value={media.id} onChange={(value) => renameMedia(media.id, value)} />
                      </Field>
                      <TextInput value={media.src} onChange={(value) => updateMedia(media.id, { src: value })} />
                      <TextInput value={media.driveFileId ?? ''} onChange={(value) => updateMedia(media.id, { driveFileId: value || undefined })} />
                    </details>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </section>
    </main>
  );
};

const SiteMapPanel = ({
  content,
  mediaById,
  onOpen,
}: {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly onOpen: (view: ActiveView) => void;
}) => (
  <section className="workspace-panel">
    <PanelHeader title="מפת האתר" text="כל כרטיס מציג תיאור קצר ובצידו תצוגת דסקטופ ותצוגת מובייל של אותו אזור, כדי לראות את התוצאה בלי להיכנס קודם למסך העריכה." />
    <div className="site-map-grid">
      {areaDefinitions.map((area) => (
        <article className="site-area-card site-area-card-rich" key={area.id}>
          <div className="site-area-card-header">
            <div className="site-area-card-copy">
              <div className="site-area-icon">{area.icon}</div>
              <div>
                <p className="kicker">{area.location}</p>
                <h3>{area.title}</h3>
                <p>{area.help}</p>
              </div>
            </div>
            <div className="site-area-card-actions">
              <span>{areaStatus(area.id, content)}</span>
              <button className="compact-button" onClick={() => onOpen(area.id)}>עריכה</button>
            </div>
          </div>
          <SiteMapAreaPreview area={area.id} content={content} mediaById={mediaById} />
        </article>
      ))}
    </div>
  </section>
);

const SiteMapAreaPreview = ({
  area,
  content,
  mediaById,
}: {
  readonly area: ActiveView;
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
}) => (
  <div className="site-map-preview-shell">
    <div className="site-map-preview-pane site-map-preview-pane-desktop">
      <p className="site-map-preview-label">תצוגת מחשב</p>
      <div className="site-map-embedded-preview">
        <SiteMapAreaPreviewSurface area={area} content={content} mediaById={mediaById} device="desktop" />
      </div>
    </div>
    <div className="site-map-preview-pane site-map-preview-pane-mobile">
      <p className="site-map-preview-label">תצוגת מובייל</p>
      <div className="site-map-embedded-preview">
        <SiteMapAreaPreviewSurface area={area} content={content} mediaById={mediaById} device="mobile" />
      </div>
    </div>
  </div>
);

const SiteMapAreaPreviewSurface = ({
  area,
  content,
  mediaById,
  device,
}: {
  readonly area: ActiveView;
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly device: PreviewDevice;
}) => {
  const allSections = content.sections.filter((section) => !section.deletedAt);
  const title = areaDefinitions.find((definition) => definition.id === area)?.title ?? 'אזור באתר';
  const hero = content.sections.find((section) => section.id === 'hero' && section.active && !section.deletedAt);

  if (area === 'hero' && hero) {
    return <HeroSitePreview content={content} hero={hero} device={device} mediaById={mediaById} />;
  }

  if (area === 'intro-band') {
    return <IntroBandPreview content={content} device={device} mediaById={mediaById} />;
  }

  if (area === 'manifesto') {
    return <ManifestoSitePreview content={content} mediaById={mediaById} device={device} />;
  }

  if (area === 'experience-lab') {
    return <ActualExperienceLabPreview content={content} mediaById={mediaById} device={device} />;
  }

  if (area === 'services') {
    return <ServicesPreview content={content} mediaById={mediaById} device={device} />;
  }

  if (area === 'gallery') {
    return <GallerySitePreview content={content} mediaById={mediaById} device={device} />;
  }

  if (area === 'real-media') {
    return (
      <ActualSiteSectionFrame content={content} mediaById={mediaById} device={device}>
        <RealMediaSection />
      </ActualSiteSectionFrame>
    );
  }

  if (area === 'booking-basics') {
    return (
      <ActualSiteSectionFrame content={content} mediaById={mediaById} device={device}>
        <BookingBasicsSection />
      </ActualSiteSectionFrame>
    );
  }

  if (area === 'seo') {
    return (
      <ActualSiteSectionFrame content={content} mediaById={mediaById} device={device}>
        <SeoSection />
      </ActualSiteSectionFrame>
    );
  }

  if (area === 'contact') {
    return <ContactPreview content={content} device={device} mediaById={mediaById} />;
  }

  if (exactPreviewSectionGroupIds.some((group) => group === area)) {
    const group = area as typeof exactPreviewSectionGroupIds[number];
    const sections = content.sections
      .filter((section) => section.group === group)
      .sort((left, right) => left.order - right.order);
    return (
      <SectionGroupSitePreview
        group={group}
        title={title}
        content={content}
        mediaById={mediaById}
        sections={sections}
        allSections={allSections}
        device={device}
      />
    );
  }

  if (area === 'site-copy') {
    return <SiteCopyOverviewPreview content={content} device={device} />;
  }

  if (area === 'site-microcopy') {
    return <SiteMicrocopyOverviewPreview content={content} device={device} />;
  }

  return <MetadataSeoPreview content={content} device={device} />;
};

const SiteCopyOverviewPreview = ({
  content,
  device,
}: {
  readonly content: ContentSnapshot;
  readonly device: PreviewDevice;
}) => {
  const sections = content.sections
    .filter((section) => section.group === 'site-copy' && section.active && !section.deletedAt)
    .sort((left, right) => left.order - right.order)
    .slice(0, device === 'mobile' ? 4 : 6);

  return (
    <div className={device === 'mobile' ? 'preview-frame is-mobile' : 'preview-frame is-desktop'}>
      <PreviewBrowserBar device={device} />
      <div className="site-section-preview site-section-preview-frame site-copy-overview-preview">
        <p className="kicker">טקסטי מעטפת</p>
        <h3>כותרות הפתיחה שמחזיקות את כל האזורים באתר.</h3>
        <p>כך נראות כותרות, תוויות ופסקאות פתיחה של כמה אזורים מרכזיים, כדי לראות אם השפה הכללית של האתר נשארת עקבית.</p>
        <div className="site-copy-overview-grid">
          {sections.map((section) => (
            <article key={section.id}>
              <span>{section.items[0] || sectionGroupLabels[section.id.replace(/^copy-/, '')] || 'אזור באתר'}</span>
              <strong>{section.title}</strong>
              {section.text && <p>{section.text}</p>}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

const SiteMicrocopyOverviewPreview = ({
  content,
  device,
}: {
  readonly content: ContentSnapshot;
  readonly device: PreviewDevice;
}) => {
  const topbarWhatsapp = getPreviewMicrocopy(content, 'topbar-whatsapp-label', 'וואטסאפ');
  const heroPrimary = getPreviewMicrocopy(content, 'hero-primary-cta', 'דברו איתנו בוואטסאפ');
  const heroSecondary = getPreviewMicrocopy(content, 'hero-secondary-cta', 'ראו איך זה נראה');
  const floatingWhatsapp = getPreviewMicrocopy(content, 'floating-whatsapp-aria', 'דברו איתנו בוואטסאפ');
  const formLabels = [
    getPreviewMicrocopy(content, 'form-name-label', 'שם מלא'),
    getPreviewMicrocopy(content, 'form-phone-label', 'טלפון'),
    getPreviewMicrocopy(content, 'form-interest-label', 'במה אתם מתעניינים?'),
    getPreviewMicrocopy(content, 'form-submit-label', 'שלחו פנייה בוואטסאפ'),
  ];

  return (
    <div className={device === 'mobile' ? 'preview-frame is-mobile' : 'preview-frame is-desktop'}>
      <PreviewBrowserBar device={device} />
      <div className="site-section-preview site-section-preview-frame site-microcopy-overview-preview">
        <p className="kicker">טקסטים קטנים</p>
        <h3>כפתורים, תפריטים והודעות קצרות שהלקוח ממש לוחץ עליהן.</h3>
        <p>התצוגה כאן לא מחליפה את כל האתר, אבל כן מראה איך אותם טקסטים נראים בתוך UI אמיתי: תפריט, CTA וטופס.</p>
        <div className="microcopy-preview-topbar">
          <span>nis</span>
          <button type="button">{topbarWhatsapp}</button>
        </div>
        <div className="microcopy-preview-actions">
          <button type="button" className="microcopy-primary-action">{heroPrimary}</button>
          <button type="button" className="microcopy-secondary-action">{heroSecondary}</button>
          <span>{floatingWhatsapp}</span>
        </div>
        <div className="microcopy-preview-form">
          {formLabels.slice(0, device === 'mobile' ? 3 : 4).map((label) => (
            <label key={label}>
              <span>{label}</span>
              <input type="text" value="" readOnly aria-label={label} />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

const HeroEditor = ({
  content,
  mediaById,
  previewDevice,
  onPreviewDeviceChange,
  updateSection,
  addSection,
}: {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly previewDevice: PreviewDevice;
  readonly onPreviewDeviceChange: (device: PreviewDevice) => void;
  readonly updateSection: (id: string, patch: Partial<SectionBlockRecord>) => void;
  readonly addSection: (group?: string) => void;
}) => {
  const hero = content.sections.find((section) => section.id === 'hero') ?? content.sections.find((section) => section.group === 'hero');
  const heroBadges = content.sections.find((section) => section.id === 'hero-badges');
  const heroMedia = content.sections.find((section) => section.id === 'hero-media');
  const heroStats = content.sections
    .filter((section) => section.group === 'hero-stats')
    .sort((left, right) => left.order - right.order);
  const visibleMedia = content.media.filter((media) => !media.deletedAt);

  if (!hero) {
    return (
      <section className="workspace-panel">
        <PanelHeader title="מסך פתיחה" text="עדיין אין רשומת Hero ב-Sheets." />
        <button className="compact-button" onClick={() => addSection('hero')}>
          <Plus aria-hidden="true" />
          צור מסך פתיחה
        </button>
      </section>
    );
  }

  return (
    <section className="workspace-panel split-editor">
      <div className="editor-column">
        <PanelHeader title="מסך פתיחה" text="זה הדבר הראשון שרואים באתר. כתבו כותרת פשוטה וברורה." />
        <Toggle checked={hero.active && !hero.deletedAt} label="מסך הפתיחה פעיל" onChange={(checked) => updateSection(hero.id, { active: checked })} />
        <div className="editor-group">
          <div className="editor-group-heading">
            <strong>טקסטים במסך הראשון</strong>
            <span>כל שדה כאן מופיע במקום אחד ברור במסך הפתיחה.</span>
          </div>
          <Field label="טקסט קטן מעל הכותרת" help="מופיע מעל הכותרת הגדולה, ליד הקו הזהוב.">
            <TextInput
              value={hero.items[0] ?? ''}
              onChange={(value) => updateSection(hero.id, patchSectionItem(hero, 0, value, 'מהרובע היהודי לביתר עילית'))}
            />
          </Field>
          <Field label="כותרת גדולה" help="מופיעה במרכז המסך הראשון. אפשר לרדת שורה עם Enter.">
            <textarea value={hero.title ?? ''} onChange={(event) => updateSection(hero.id, { title: event.target.value || undefined })} />
          </Field>
          <Field label="משפט מודגש מתחת לכותרת" help="זה המשפט: שבתות, מגשי אירוח ו-Travel Nis...">
            <textarea
              value={hero.items[1] ?? ''}
              onChange={(event) => updateSection(hero.id, patchSectionItem(hero, 1, event.target.value, 'שבתות, מגשי אירוח ו־Travel Nis, עם אוכל מוקפד, נראות יפה ושיחה קצרה שסוגרת כיוון.'))}
            />
          </Field>
          <Field label="פסקת הסבר קצרה" help="הטקסט הקטן שמתחת למשפט המודגש.">
            <textarea value={hero.text ?? ''} onChange={(event) => updateSection(hero.id, { text: event.target.value || undefined })} />
          </Field>
        </div>
        {heroBadges && (
          <div className="editor-group">
            <div className="editor-group-heading">
              <strong>תגיות וכפתורי אמון</strong>
              <span>התגיות הקטנות שמופיעות מתחת לטקסטים במסך הפתיחה.</span>
            </div>
            <Field label="תגיות קצרות" help="מפרידים עם | לדוגמה: שבתות | מגשי אירוח | Travel Nis">
              <TextInput value={joinPipeList(heroBadges.items)} onChange={(value) => updateSection(heroBadges.id, { items: splitPipeList(value) })} />
            </Field>
          </div>
        )}
        {heroMedia && (
          <div className="editor-group hero-media-editor">
            <div className="editor-group-heading">
              <strong>תמונות מסך פתיחה</strong>
              <span>בחרו איזו תמונה תשמש לרקע ולכל שכבת תמונה ב-Hero.</span>
            </div>
            {heroMediaSlots.map((slot, index) => {
              const selectedMediaId = heroMediaIdAt(heroMedia, index);
              return (
                <Field key={slot.key} label={slot.label} help={slot.help}>
                  <select value={selectedMediaId} onChange={(event) => updateSection(heroMedia.id, patchHeroMediaId(heroMedia, index, event.target.value))}>
                    {visibleMedia.map((media) => <option key={media.id} value={media.id}>{mediaLabel(media, content)}</option>)}
                  </select>
                  <MediaQuickPicker
                    label={`בחירה מהירה - ${slot.label}`}
                    mediaItems={visibleMedia}
                    selectedMediaId={selectedMediaId}
                    content={content}
                    onSelect={(mediaId) => updateSection(heroMedia.id, patchHeroMediaId(heroMedia, index, mediaId))}
                  />
                  <MediaSelectionUsageNotice mediaId={selectedMediaId} content={content} currentUsage={{ kind: 'hero', id: slot.key }} />
                </Field>
              );
            })}
          </div>
        )}
        {heroStats.length > 0 && (
          <div className="nested-editor-list">
            <strong>נתוני Hero</strong>
            <span>מופיע בשורת הנתונים שמתחת למסך הפתיחה.</span>
            {heroStats.map((stat) => (
              <article key={stat.id}>
                <Field label="ערך קצר" help="לדוגמה: שבתות, אירוח קטן, Travel Nis.">
                  <TextInput value={stat.title ?? ''} onChange={(value) => updateSection(stat.id, { title: value || undefined })} />
                </Field>
                <Field label="הסבר קצר" help="משפט שמסביר את הערך.">
                  <TextInput value={stat.text ?? ''} onChange={(value) => updateSection(stat.id, { text: value || undefined })} />
                </Field>
              </article>
            ))}
          </div>
        )}
      </div>
      <div className="preview-column">
        <PreviewHeader
          title="תצוגה מקדימה כמו באתר"
          text="אפשר לעבור בין מחשב למובייל ולראות איך מסך הפתיחה ירגיש ללקוח."
          device={previewDevice}
          onDeviceChange={onPreviewDeviceChange}
        />
        <HeroSitePreview content={content} hero={hero} device={previewDevice} mediaById={mediaById} />
      </div>
    </section>
  );
};

const IntroBandEditor = ({
  content,
  previewDevice,
  onPreviewDeviceChange,
  updateSection,
  addSection,
  mediaById,
}: {
  readonly content: ContentSnapshot;
  readonly previewDevice: PreviewDevice;
  readonly onPreviewDeviceChange: (device: PreviewDevice) => void;
  readonly updateSection: (id: string, patch: Partial<SectionBlockRecord>) => void;
  readonly addSection: (group?: string) => void;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
}) => {
  const section = getManagedCopySection(content, 'intro-band');

  if (!section) {
    return (
      <section className="workspace-panel">
        <PanelHeader title="רעיון אחד ברור" text="האזור הזה עדיין לא קיים ב-Sheets." />
        <button className="compact-button" onClick={() => addSection('site-copy')}>
          <Plus aria-hidden="true" />
          צור אזור פתיח
        </button>
      </section>
    );
  }

  return (
    <section className="workspace-panel split-editor">
      <div className="editor-column">
        <PanelHeader
          title="רעיון אחד ברור"
          text="זה הפתיח הקצר שאחרי מסך הפתיחה. הוא מיועד להסביר במהירות למי Nis מתאימה ולמה שבתות, אירוח קטן ו-Travel Nis הם אותו עולם."
        />
        <Toggle checked={section.active && !section.deletedAt} label="האזור מוצג באתר" onChange={(checked) => updateSection(section.id, { active: checked })} />
        <Field label="תווית קטנה מעל הכותרת" help="לדוגמה: רעיון אחד ברור.">
          <TextInput value={section.items[0] ?? ''} onChange={(value) => updateSection(section.id, patchSectionItem(section, 0, value, 'רעיון אחד ברור'))} />
        </Field>
        <Field label="כותרת האזור" help="משפט אחד שמחדד את ההבטחה של Nis.">
          <textarea value={section.title ?? ''} onChange={(event) => updateSection(section.id, { title: event.target.value || undefined })} />
        </Field>
        <Field label="טקסט הסבר" help="פסקה קצרה שמסבירה למי האזור מיועד ולמה הוא חשוב.">
          <textarea value={section.text ?? ''} onChange={(event) => updateSection(section.id, { text: event.target.value || undefined })} />
        </Field>
      </div>
      <div className="preview-column">
        <PreviewHeader
          title="תצוגה מקדימה כמו באתר"
          text="האזור הזה אמור להיות קצר, ברור וללא גלילה בדסקטופ."
          device={previewDevice}
          onDeviceChange={onPreviewDeviceChange}
        />
        <IntroBandPreview content={content} mediaById={mediaById} device={previewDevice} />
      </div>
    </section>
  );
};

const CopyOnlySectionEditor = ({
  content,
  sectionId,
  title,
  text,
  previewDevice,
  onPreviewDeviceChange,
  updateSection,
  tagsSection,
  mediaById,
}: {
  readonly content: ContentSnapshot;
  readonly sectionId: string;
  readonly title: string;
  readonly text: string;
  readonly previewDevice: PreviewDevice;
  readonly onPreviewDeviceChange: (device: PreviewDevice) => void;
  readonly updateSection: (id: string, patch: Partial<SectionBlockRecord>) => void;
  readonly tagsSection?: SectionBlockRecord;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
}) => {
  const section = getManagedCopySection(content, sectionId);

  if (!section) {
    return (
      <section className="workspace-panel">
        <PanelHeader title={title} text="האזור הזה עדיין לא קיים ב-Sheets. רענון מה-Sheets יוסיף ברירות מחדל אם הן חסרות." />
      </section>
    );
  }

  return (
    <section className="workspace-panel split-editor">
      <div className="editor-column">
        <PanelHeader title={title} text={text} />
        <Toggle checked={section.active && !section.deletedAt} label="האזור מוצג באתר" onChange={(checked) => updateSection(section.id, { active: checked })} />
        <Field label="תווית קטנה מעל הכותרת" help="מופיעה מעל הכותרת של האזור באתר.">
          <TextInput value={section.items[0] ?? ''} onChange={(value) => updateSection(section.id, patchSectionItem(section, 0, value, title))} />
        </Field>
        <Field label="כותרת האזור" help="הכותרת הגדולה שמופיעה באתר.">
          <textarea value={section.title ?? ''} onChange={(event) => updateSection(section.id, { title: event.target.value || undefined })} />
        </Field>
        <Field label="טקסט הסבר" help="אפשר להשתמש ב-| כדי לחלק לפסקאות באתר.">
          <textarea value={section.text ?? ''} onChange={(event) => updateSection(section.id, { text: event.target.value || undefined })} />
        </Field>
        {tagsSection && (
          <Field label="תגיות תחומי שירות" help="מופיע באזור SEO באתר כתגיות קצרות. מפרידים עם |">
            <TextInput value={joinPipeList(tagsSection.items)} onChange={(value) => updateSection(tagsSection.id, { items: splitPipeList(value) })} />
          </Field>
        )}
      </div>
      <div className="preview-column">
        <PreviewHeader
          title="תצוגה מקדימה כמו באתר"
          text="האזור הזה צריך להישאר קצר וברור בדסקטופ ובמובייל."
          device={previewDevice}
          onDeviceChange={onPreviewDeviceChange}
        />
        {exactPreviewCopySectionIds.includes(sectionId as typeof exactPreviewCopySectionIds[number]) ? (
          sectionId === 'experience-lab' ? (
          <ActualExperienceLabPreview content={content} mediaById={mediaById} device={previewDevice} />
          ) : sectionId === 'real-media' ? (
          <ActualSiteSectionFrame content={content} mediaById={mediaById} device={previewDevice}>
            <RealMediaSection />
          </ActualSiteSectionFrame>
          ) : sectionId === 'booking-basics' ? (
          <ActualSiteSectionFrame content={content} mediaById={mediaById} device={previewDevice}>
            <BookingBasicsSection />
          </ActualSiteSectionFrame>
          ) : (
          <ActualSiteSectionFrame content={content} mediaById={mediaById} device={previewDevice}>
            <SeoSection />
          </ActualSiteSectionFrame>
          )
        ) : (
          <CopyOnlySectionPreview section={section} tagsSection={tagsSection} device={previewDevice} />
        )}
      </div>
    </section>
  );
};

const ManifestoEditor = ({
  content,
  mediaById,
  updateSection,
  addSection,
  duplicateSection,
  archiveSection,
  restoreSection,
  previewDevice,
  onPreviewDeviceChange,
}: {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly updateSection: (id: string, patch: Partial<SectionBlockRecord>) => void;
  readonly addSection: (group?: string) => void;
  readonly duplicateSection: (section: SectionBlockRecord) => void;
  readonly archiveSection: (id: string) => void;
  readonly restoreSection: (id: string) => void;
  readonly previewDevice: PreviewDevice;
  readonly onPreviewDeviceChange: (device: PreviewDevice) => void;
}) => {
  const copy = content.sections.find((section) => section.id === 'manifesto' && section.group === 'site-copy');
  const moments = content.sections
    .filter((section) => section.group === 'manifesto')
    .sort((left, right) => left.order - right.order);
  const visibleMedia = content.media.filter((media) => !media.deletedAt);

  return (
    <section className="workspace-panel split-editor">
      <div className="editor-column">
        <PanelHeader
          title="השפה של Nis"
          text="האזור הזה מסביר את תחושת הבוטיק: נראות, ביתיות והתאמה אישית. כאן עורכים גם את הטקסט הראשי וגם את התמונות של הכרטיסים."
          action={
            <button className="compact-button" onClick={() => addSection('manifesto')}>
              <Plus aria-hidden="true" />
              הוסף כרטיס
            </button>
          }
        />
        {copy && (
          <div className="editor-group">
            <div className="editor-group-heading">
              <strong>כותרת האזור</strong>
              <span>החלק הימני באתר: תווית, כותרת גדולה ופסקת הסבר.</span>
            </div>
            <Toggle checked={copy.active && !copy.deletedAt} label="האזור מוצג באתר" onChange={(checked) => updateSection(copy.id, { active: checked })} />
            <Field label="תווית קטנה" help="לדוגמה: השפה של Nis.">
              <TextInput value={copy.items[0] ?? ''} onChange={(value) => updateSection(copy.id, patchSectionItem(copy, 0, value, 'השפה של Nis'))} />
            </Field>
            <Field label="כותרת גדולה" help="אפשר לרדת שורה עם Enter.">
              <textarea value={copy.title ?? ''} onChange={(event) => updateSection(copy.id, { title: event.target.value || undefined })} />
            </Field>
            <Field label="טקסט מתחת לכותרת" help="משפט קצר שמסביר את התחושה שהאזור אמור להעביר.">
              <textarea value={copy.text ?? ''} onChange={(event) => updateSection(copy.id, { text: event.target.value || undefined })} />
            </Field>
          </div>
        )}
        <div className="cards-list">
          {moments.map((moment, index) => {
            const selectedMediaId = moment.items[1] ?? manifestoMediaFallbacks[index % manifestoMediaFallbacks.length];
            return (
              <article className={moment.deletedAt ? 'edit-card is-archived' : 'edit-card'} key={moment.id}>
                <div className="card-heading">
                  <div>
                    <p className="kicker">כרטיס בשפה של Nis</p>
                    <h3>{moment.title || 'כרטיס ללא כותרת'}</h3>
                  </div>
                  <ItemActions
                    isArchived={Boolean(moment.deletedAt)}
                    onDuplicate={() => duplicateSection(moment)}
                    onArchive={() => archiveSection(moment.id)}
                    onRestore={() => restoreSection(moment.id)}
                  />
                </div>
                <Toggle checked={moment.active && !moment.deletedAt} label="מוצג באתר" onChange={(checked) => updateSection(moment.id, { active: checked })} />
                <Field label="מספר/תווית בכרטיס" help="לדוגמה: 01, 02, 03.">
                  <TextInput value={moment.items[0] ?? ''} onChange={(value) => updateSection(moment.id, patchSectionItem(moment, 0, value, String(index + 1).padStart(2, '0')))} />
                </Field>
                <Field label="כותרת הכרטיס" help="הכותרת שמופיעה בתוך הכרטיס באתר.">
                  <textarea value={moment.title ?? ''} onChange={(event) => updateSection(moment.id, { title: event.target.value || undefined })} />
                </Field>
                <Field label="טקסט הכרטיס" help="הסבר קצר שמופיע מתחת לכותרת.">
                  <textarea value={moment.text ?? ''} onChange={(event) => updateSection(moment.id, { text: event.target.value || undefined })} />
                </Field>
                <Field label="תמונה לכרטיס" help="התמונה שמופיעה בצד הכרטיס באזור השפה של Nis.">
                  <select value={selectedMediaId} onChange={(event) => updateSection(moment.id, patchSectionItem(moment, 1, event.target.value, manifestoMediaFallbacks[index % manifestoMediaFallbacks.length]))}>
                    {visibleMedia.map((media) => <option key={media.id} value={media.id}>{mediaLabel(media, content)}</option>)}
                  </select>
                  <MediaQuickPicker
                    label="בחירה מהירה לתמונה"
                    mediaItems={visibleMedia}
                    selectedMediaId={selectedMediaId}
                    content={content}
                    onSelect={(mediaId) => updateSection(moment.id, patchSectionItem(moment, 1, mediaId, manifestoMediaFallbacks[index % manifestoMediaFallbacks.length]))}
                  />
                  <MediaSelectionUsageNotice mediaId={selectedMediaId} content={content} currentUsage={{ kind: 'manifesto', id: moment.id }} />
                </Field>
              </article>
            );
          })}
        </div>
      </div>
      <div className="preview-column">
        <PreviewHeader
          title="תצוגה מקדימה כמו באתר"
          text="אפשר לעבור בין מחשב למובייל ולבדוק שהאזור נכנס נכון בלי חיתוך מיותר."
          device={previewDevice}
          onDeviceChange={onPreviewDeviceChange}
        />
        <ManifestoSitePreview content={content} mediaById={mediaById} device={previewDevice} />
      </div>
    </section>
  );
};

const PreviewHeader = ({
  title,
  text,
  device,
  onDeviceChange,
}: {
  readonly title: string;
  readonly text: string;
  readonly device: PreviewDevice;
  readonly onDeviceChange: (device: PreviewDevice) => void;
}) => (
  <div className="preview-header">
    <div>
      <p className="kicker">{title}</p>
      <p>{text}</p>
    </div>
    <div className="preview-device-switch" aria-label="בחירת תצוגה מקדימה">
      <button type="button" className={device === 'desktop' ? 'is-active' : ''} onClick={() => onDeviceChange('desktop')} aria-pressed={device === 'desktop'}>
        <MonitorCheck aria-hidden="true" />
        מחשב
      </button>
      <button type="button" className={device === 'mobile' ? 'is-active' : ''} onClick={() => onDeviceChange('mobile')} aria-pressed={device === 'mobile'}>
        <Phone aria-hidden="true" />
        מובייל
      </button>
    </div>
  </div>
);

const HeroSitePreview = ({
  content,
  hero,
  device,
  mediaById,
}: {
  readonly content: ContentSnapshot;
  readonly hero: SectionBlockRecord;
  readonly device: PreviewDevice;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
}) => {
  const heroWhatsapp = buildPreviewWhatsappLink(content.settings.whatsappBase, `שלום Nis, אשמח לשמוע פרטים על ${hero.items[1] || hero.title || 'קייטרינג בוטיק לאירוח'}.`);
  return (
    <ActualSiteSectionFrame content={content} mediaById={mediaById} device={device}>
      <HeroSection heroWhatsapp={heroWhatsapp} />
    </ActualSiteSectionFrame>
  );
};

const IntroBandPreview = ({
  content,
  device,
  mediaById,
}: {
  readonly content: ContentSnapshot;
  readonly device: PreviewDevice;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
}) => (
  <ActualSiteSectionFrame content={content} mediaById={mediaById} device={device}>
    <IntroBandSection />
  </ActualSiteSectionFrame>
);

const shadowPreviewCss = `
${siteBaseCss}
${siteThemeCss}

:root {
  color-scheme: light;
}

html, body {
  margin: 0;
  min-height: 100%;
  width: 100%;
}

body {
  display: block;
  color: var(--ink);
}

#preview-root {
  min-height: 100%;
  width: 100%;
  container-type: inline-size;
}

*, *::before, *::after {
  box-sizing: border-box;
}

.studio-site-preview-shell {
  min-height: 100%;
  overflow: hidden;
}

.studio-site-preview-shell::before,
.studio-site-preview-shell::after {
  position: absolute;
}

.studio-site-preview-shell .container {
  width: min(100%, calc(100% - 32px));
}

.studio-site-preview-shell .section {
  min-height: 100%;
  display: grid;
  align-items: center;
}

.studio-site-preview-shell .intro-band {
  min-height: 100%;
}

.studio-site-preview-shell .reveal {
  opacity: 1;
  transform: none;
}

@container (max-width: 760px) {
  .studio-site-preview-shell .intro-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
  }

  .studio-site-preview-shell .intro-band h2 {
    font-size: clamp(1.8rem, 8cqw, 3rem);
    line-height: 1.02;
  }

  .studio-site-preview-shell .intro-band p:not(.eyebrow) {
    font-size: 0.95rem;
    line-height: 1.7;
  }
}

@container (max-width: 460px) {
  .studio-site-preview-shell .section {
    align-items: start;
    padding-block: 28px;
  }

  .studio-site-preview-shell .container {
    width: min(100%, calc(100% - 24px));
  }

  .studio-site-preview-shell .intro-band .intro-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
  }

  .studio-site-preview-shell .intro-band h2 {
    font-size: clamp(1.5rem, 10cqw, 2.35rem);
    line-height: 1.06;
  }

  .studio-site-preview-shell .intro-band p:not(.eyebrow) {
    font-size: 0.88rem;
    line-height: 1.62;
  }
}
`;

const previewViewportByDevice: Readonly<Record<PreviewDevice, { width: number; height: number }>> = {
  desktop: { width: 1440, height: 810 },
  mobile: { width: 390, height: 844 },
};

const IframeSitePreview = ({
  device,
  children,
}: {
  readonly device: PreviewDevice;
  readonly children: ReactNode;
}) => {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [iframeNode, setIframeNode] = useState<HTMLIFrameElement | null>(null);
  const [contentHeight, setContentHeight] = useState<number>(previewViewportByDevice[device].height);
  const setIframeRef = useCallback((node: HTMLIFrameElement | null) => {
    if (!node) {
      setIframeNode(null);
      setMountNode(null);
      return;
    }

    const doc = node.contentDocument;
    if (!doc) {
      return;
    }

    doc.open();
    doc.write(`<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8" /><base href="${publicSiteOrigin}/" /><meta name="viewport" content="width=device-width, initial-scale=1" /><style>${shadowPreviewCss}</style></head><body><div id="preview-root"></div></body></html>`);
    doc.close();
    setIframeNode(node);
    setMountNode(doc.getElementById('preview-root'));
  }, []);
  const viewport = previewViewportByDevice[device];

  useEffect(() => {
    if (!iframeNode || !mountNode) {
      return undefined;
    }

    const doc = iframeNode.contentDocument;
    const root = doc?.documentElement;
    const body = doc?.body;
    if (!doc || !root || !body) {
      return undefined;
    }

    let cancelled = false;

    const syncPreviewHeight = () => {
      if (cancelled) {
        return;
      }

      doc.querySelectorAll('img').forEach((image) => {
        image.setAttribute('loading', 'eager');
        image.setAttribute('decoding', 'sync');
        image.setAttribute('fetchpriority', 'high');
      });

      const nextHeight = Math.max(
        viewport.height,
        root.scrollHeight,
        body.scrollHeight,
        mountNode.scrollHeight,
      );
      setContentHeight(nextHeight);
    };

    const blockExternalPreviewNavigation = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest('a[href]');
      if (!link) {
        return;
      }

      const href = link.getAttribute('href') ?? '';
      if (href.startsWith('#')) {
        return;
      }

      event.preventDefault();
    };

    const resizeObserver = new ResizeObserver(() => {
      syncPreviewHeight();
    });

    resizeObserver.observe(root);
    resizeObserver.observe(body);
    resizeObserver.observe(mountNode);
    doc.addEventListener('click', blockExternalPreviewNavigation, true);

    const loadListeners = Array.from(doc.images).map((image) => {
      const handleLoad = () => syncPreviewHeight();
      image.addEventListener('load', handleLoad);
      image.addEventListener('error', handleLoad);
      return { image, handleLoad };
    });

    const rafId = window.requestAnimationFrame(() => {
      syncPreviewHeight();
    });
    const timeoutId = window.setTimeout(syncPreviewHeight, 120);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
      resizeObserver.disconnect();
      doc.removeEventListener('click', blockExternalPreviewNavigation, true);
      loadListeners.forEach(({ image, handleLoad }) => {
        image.removeEventListener('load', handleLoad);
        image.removeEventListener('error', handleLoad);
      });
    };
  }, [device, iframeNode, mountNode, viewport.height]);

  return (
    <div
      className={`iframe-site-preview ${device === 'mobile' ? 'is-mobile' : 'is-desktop'}`}
      style={{
        '--preview-viewport-width': `${viewport.width}px`,
        '--preview-viewport-height': `${viewport.height}px`,
        '--preview-content-height': `${contentHeight}px`,
      } as CSSProperties}
    >
      <iframe ref={setIframeRef} className="iframe-site-preview-frame" title={`site-preview-${device}`} />
      {mountNode ? createPortal(children, mountNode) : null}
    </div>
  );
};

const ActualSiteSectionFrame = ({
  content,
  mediaById,
  device,
  children,
}: {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly device: PreviewDevice;
  readonly children: ReactNode;
}) => {
  const previewData = useMemo(() => buildSiteSectionPreviewData(content, mediaById), [content, mediaById]);

  return (
    <div className={device === 'mobile' ? 'preview-frame is-mobile' : 'preview-frame is-desktop'}>
      <PreviewBrowserBar device={device} />
      <IframeSitePreview device={device}>
        <SiteSectionPreviewDataProvider value={previewData}>
          <div className="site-shell studio-site-preview-shell">{children}</div>
        </SiteSectionPreviewDataProvider>
      </IframeSitePreview>
    </div>
  );
};

const ActualExperienceLabPreview = ({
  content,
  mediaById,
  device,
}: {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly device: PreviewDevice;
}) => {
  const [activeExperienceIndex, setActiveExperienceIndex] = useState(0);
  return (
    <ActualSiteSectionFrame content={content} mediaById={mediaById} device={device}>
      <ExperienceLabSection activeExperienceIndex={activeExperienceIndex} onChangeExperience={setActiveExperienceIndex} />
    </ActualSiteSectionFrame>
  );
};

const ActualGalleryPreview = ({
  content,
  mediaById,
  device,
}: {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly device: PreviewDevice;
}) => {
  const previewData = useMemo(() => buildSiteSectionPreviewData(content, mediaById), [content, mediaById]);
  const [activeCategory, setActiveCategory] = useState<typeof previewData.galleryImages[number]['category'] | 'all'>('all');
  const visibleImages = useMemo(
    () => (activeCategory === 'all' ? previewData.galleryImages : previewData.galleryImages.filter((image) => image.category === activeCategory)),
    [activeCategory, previewData.galleryImages],
  );

  return (
    <div className={device === 'mobile' ? 'preview-frame is-mobile' : 'preview-frame is-desktop'}>
      <PreviewBrowserBar device={device} />
      <IframeSitePreview device={device}>
        <SiteSectionPreviewDataProvider value={previewData}>
          <div className="site-shell studio-site-preview-shell">
            <GallerySection activeCategory={activeCategory} images={visibleImages} onFilterChange={setActiveCategory} onOpenImage={() => undefined} />
          </div>
        </SiteSectionPreviewDataProvider>
      </IframeSitePreview>
    </div>
  );
};

const ActualContactPreview = ({
  content,
  mediaById,
  device,
}: {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly device: PreviewDevice;
}) => {
  const previewData = useMemo(() => buildSiteSectionPreviewData(content, mediaById), [content, mediaById]);
  const [leadSource, setLeadSource] = useState(previewData.contactInterestOptions[0] ?? 'ניס בטעם של שבת');
  const contactWhatsapp = buildPreviewWhatsappLink(content.settings.whatsappBase, previewData.siteMicrocopy.whatsappContactMessage);

  return (
    <div className={device === 'mobile' ? 'preview-frame is-mobile' : 'preview-frame is-desktop'}>
      <PreviewBrowserBar device={device} />
      <IframeSitePreview device={device}>
        <SiteSectionPreviewDataProvider value={previewData}>
          <div className="site-shell studio-site-preview-shell">
            <ContactSection
              contactWhatsapp={contactWhatsapp}
              email={content.settings.email}
              leadSource={leadSource}
              onLeadSourceChange={setLeadSource}
              onSubmit={(event) => event.preventDefault()}
            />
          </div>
        </SiteSectionPreviewDataProvider>
      </IframeSitePreview>
    </div>
  );
};

const CopyOnlySectionPreview = ({
  section,
  tagsSection,
  device,
}: {
  readonly section: SectionBlockRecord;
  readonly tagsSection?: SectionBlockRecord;
  readonly device: PreviewDevice;
}) => (
  <div className={device === 'mobile' ? 'preview-frame is-mobile' : 'preview-frame is-desktop'}>
    <PreviewBrowserBar device={device} />
    <div className="site-section-preview site-section-preview-frame copy-only-section-preview">
      <p className="kicker">{section.items[0] || section.title}</p>
      <h3>{section.title}</h3>
      <div className="copy-only-preview-text">
        {section.text?.split('|').filter(Boolean).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
      {tagsSection && (
        <div className="preview-mini-tags">
          {tagsSection.items.map((item) => <span key={item}>{item}</span>)}
        </div>
      )}
    </div>
  </div>
);

const ManifestoSitePreview = ({
  content,
  mediaById,
  device,
}: {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly device: PreviewDevice;
}) => (
  <ActualSiteSectionFrame content={content} mediaById={mediaById} device={device}>
    <ManifestoSection />
  </ActualSiteSectionFrame>
);

const ServicesPreview = ({
  content,
  mediaById,
  device,
}: {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly device: PreviewDevice;
}) => (
  <ActualSiteSectionFrame content={content} mediaById={mediaById} device={device}>
    <ServicesSection />
  </ActualSiteSectionFrame>
);

const GallerySitePreview = ({
  content,
  mediaById,
  device,
}: {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly device: PreviewDevice;
}) => <ActualGalleryPreview content={content} mediaById={mediaById} device={device} />;

const PreviewBrowserBar = ({ device }: { readonly device: PreviewDevice }) => (
  <div className="preview-browser-bar">
    <span>{device === 'mobile' ? '390px מובייל' : 'אתר במחשב'}</span>
    <strong>nisboutiquecatering.com</strong>
  </div>
);

const getPreviewCopySection = (
  content: ContentSnapshot,
  id: string,
  fallback: { readonly eyebrow: string; readonly title: string; readonly text?: string; readonly extraText?: string },
) => {
  const section = content.sections.find((item) => item.id === `copy-${id}` && item.group === 'site-copy' && item.active && !item.deletedAt);
  return {
    eyebrow: section?.items[0] || fallback.eyebrow,
    title: section?.title || fallback.title,
    text: section?.text || fallback.text,
    extraText: section?.items[1] || fallback.extraText,
  };
};

const getPreviewMicrocopy = (content: ContentSnapshot, id: string, fallback: string) => (
  content.sections.find((item) => item.id === `microcopy-${id}` && item.group === 'site-microcopy' && item.active && !item.deletedAt)?.text || fallback
);

const getPreviewMicrocopyItems = (content: ContentSnapshot, id: string, fallback: readonly string[]) => {
  const items = content.sections.find((item) => item.id === `microcopy-${id}` && item.group === 'site-microcopy' && item.active && !item.deletedAt)?.items;
  return items && items.length > 0 ? items : fallback;
};

const getActiveSectionsByGroup = (content: ContentSnapshot, group: string) =>
  content.sections
    .filter((section) => section.group === group && section.active && !section.deletedAt)
    .sort((left, right) => left.order - right.order);

const resolvePreviewImage = (
  mediaById: ReadonlyMap<string, ImageAssetRecord>,
  mediaId: string | undefined,
  fallback: { readonly src: string; readonly width: number; readonly height: number; readonly sizes?: string; readonly responsive?: boolean },
) => {
  const media = mediaId ? mediaById.get(mediaId) : null;
  if (!media?.src) {
    return fallback;
  }

  return {
    src: publicAssetSrcFor(media.src),
    width: media.width,
    height: media.height,
    sizes: media.sizes || fallback.sizes,
    responsive: media.responsive ?? fallback.responsive,
  };
};

const buildSiteSectionPreviewData = (
  content: ContentSnapshot,
  mediaById: ReadonlyMap<string, ImageAssetRecord>,
): SiteSectionPreviewData => {
  const defaults = defaultSiteSectionPreviewData;
  const hero = content.sections.find((section) => section.id === 'hero' && section.active && !section.deletedAt);
  const heroMedia = content.sections.find((section) => section.id === 'hero-media' && section.active && !section.deletedAt);
  const heroBadges = content.sections.find((section) => section.id === 'hero-badges' && section.active && !section.deletedAt);
  const heroStatsSections = getActiveSectionsByGroup(content, 'hero-stats');
  const heroNoteSections = getActiveSectionsByGroup(content, 'hero-notes');
  const manifestoSections = getActiveSectionsByGroup(content, 'manifesto');
  const editorialSections = getActiveSectionsByGroup(content, 'editorial');
  const audienceSections = getActiveSectionsByGroup(content, 'audience');
  const boutiqueSections = getActiveSectionsByGroup(content, 'boutique');
  const processSections = getActiveSectionsByGroup(content, 'process');
  const storySections = getActiveSectionsByGroup(content, 'story');
  const signatureSections = getActiveSectionsByGroup(content, 'signature');
  const coordinationSections = getActiveSectionsByGroup(content, 'coordination');
  const trustSections = getActiveSectionsByGroup(content, 'trust');
  const faqSections = getActiveSectionsByGroup(content, 'faq');
  const samplesSections = getActiveSectionsByGroup(content, 'samples');
  const seoTopicsSection = content.sections.find((section) => section.id === 'seo-topics' && section.active && !section.deletedAt);

  const services = [...content.services]
    .filter((service) => service.active && !service.deletedAt)
    .sort((left, right) => left.order - right.order)
    .map((service, index) => {
      const base = defaults.services[index] ?? defaults.services[0];
      return {
        ...base,
        title: service.title,
        subtitle: service.subtitle,
        description: service.description,
        bestFor: service.bestFor,
        promise: service.promise,
        details: service.details,
        cta: service.cta,
        image: resolvePreviewImage(mediaById, service.mediaId, base.image),
      };
    });

  const galleryImages = [...content.gallery]
    .filter((item) => item.active && !item.deletedAt)
    .sort((left, right) => left.order - right.order)
    .map((item) => {
      const fallbackImage = defaultSiteSectionPreviewData.foodMedia.hostingTableOverview;
      return {
        title: item.title,
        alt: item.alt,
        image: resolvePreviewImage(mediaById, item.mediaId, fallbackImage),
        category: item.category as 'all' | 'tables' | 'trays' | 'salads' | 'coffee' | 'fish',
        tall: item.tall,
      };
    });

  return {
    ...defaults,
    phoneHref: content.settings.phoneHref || defaults.phoneHref,
    heroContent: {
      eyebrow: hero?.items[0] || defaults.heroContent.eyebrow,
      title: hero?.title || defaults.heroContent.title,
      kicker: hero?.items[1] || defaults.heroContent.kicker,
      text: hero?.text || defaults.heroContent.text,
    },
    heroMedia: {
      background: resolvePreviewImage(mediaById, heroMedia?.items[0], defaults.heroMedia.background),
      primary: resolvePreviewImage(mediaById, heroMedia?.items[1], defaults.heroMedia.primary),
      side: resolvePreviewImage(mediaById, heroMedia?.items[2], defaults.heroMedia.side),
      tall: resolvePreviewImage(mediaById, heroMedia?.items[3], defaults.heroMedia.tall),
    },
    heroBadges: heroBadges?.items.length ? heroBadges.items : defaults.heroBadges,
    heroStats: heroStatsSections.length
      ? heroStatsSections.map((section, index) => ({
          value: section.title || defaults.heroStats[index]?.value || defaults.heroStats[0].value,
          label: section.text || defaults.heroStats[index]?.label || defaults.heroStats[0].label,
        }))
      : defaults.heroStats,
    heroSceneNotes: heroNoteSections.length
      ? heroNoteSections.map((section, index) => ({
          title: section.title || defaults.heroSceneNotes[index]?.title || defaults.heroSceneNotes[0].title,
          text: section.text || defaults.heroSceneNotes[index]?.text || defaults.heroSceneNotes[0].text,
        }))
      : defaults.heroSceneNotes,
    siteMicrocopy: {
      ...defaults.siteMicrocopy,
      heroPrimaryCta: getPreviewMicrocopy(content, 'hero-primary-cta', defaults.siteMicrocopy.heroPrimaryCta),
      heroSecondaryCta: getPreviewMicrocopy(content, 'hero-secondary-cta', defaults.siteMicrocopy.heroSecondaryCta),
      heroMicrocopy: getPreviewMicrocopy(content, 'hero-microcopy', defaults.siteMicrocopy.heroMicrocopy),
      heroShowcaseTitle: getPreviewMicrocopy(content, 'hero-showcase-title', defaults.siteMicrocopy.heroShowcaseTitle),
      heroShowcaseText: getPreviewMicrocopy(content, 'hero-showcase-text', defaults.siteMicrocopy.heroShowcaseText),
      heroVideoChip: getPreviewMicrocopy(content, 'hero-video-chip', defaults.siteMicrocopy.heroVideoChip),
      topbarWhatsappLabel: getPreviewMicrocopy(content, 'topbar-whatsapp-label', defaults.siteMicrocopy.topbarWhatsappLabel),
      galleryAllLabel: getPreviewMicrocopy(content, 'gallery-all-label', defaults.siteMicrocopy.galleryAllLabel),
      galleryTablesLabel: getPreviewMicrocopy(content, 'gallery-tables-label', defaults.siteMicrocopy.galleryTablesLabel),
      galleryTraysLabel: getPreviewMicrocopy(content, 'gallery-trays-label', defaults.siteMicrocopy.galleryTraysLabel),
      gallerySaladsLabel: getPreviewMicrocopy(content, 'gallery-salads-label', defaults.siteMicrocopy.gallerySaladsLabel),
      galleryCoffeeLabel: getPreviewMicrocopy(content, 'gallery-coffee-label', defaults.siteMicrocopy.galleryCoffeeLabel),
      galleryFishLabel: getPreviewMicrocopy(content, 'gallery-fish-label', defaults.siteMicrocopy.galleryFishLabel),
      contactPrimaryCta: getPreviewMicrocopy(content, 'contact-primary-cta', defaults.siteMicrocopy.contactPrimaryCta),
      contactPhoneCta: getPreviewMicrocopy(content, 'contact-phone-cta', defaults.siteMicrocopy.contactPhoneCta),
      contactLocation: getPreviewMicrocopy(content, 'contact-location', defaults.siteMicrocopy.contactLocation),
      contactPromiseHeading: getPreviewMicrocopy(content, 'contact-promise-heading', defaults.siteMicrocopy.contactPromiseHeading),
      formNameLabel: getPreviewMicrocopy(content, 'form-name-label', defaults.siteMicrocopy.formNameLabel),
      formPhoneLabel: getPreviewMicrocopy(content, 'form-phone-label', defaults.siteMicrocopy.formPhoneLabel),
      formEmailLabel: getPreviewMicrocopy(content, 'form-email-label', defaults.siteMicrocopy.formEmailLabel),
      formInterestLabel: getPreviewMicrocopy(content, 'form-interest-label', defaults.siteMicrocopy.formInterestLabel),
      formDateLabel: getPreviewMicrocopy(content, 'form-date-label', defaults.siteMicrocopy.formDateLabel),
      formGuestsLabel: getPreviewMicrocopy(content, 'form-guests-label', defaults.siteMicrocopy.formGuestsLabel),
      formDeliveryLabel: getPreviewMicrocopy(content, 'form-delivery-label', defaults.siteMicrocopy.formDeliveryLabel),
      formMessageLabel: getPreviewMicrocopy(content, 'form-message-label', defaults.siteMicrocopy.formMessageLabel),
      formSubmitLabel: getPreviewMicrocopy(content, 'form-submit-label', defaults.siteMicrocopy.formSubmitLabel),
      whatsappHeroTopic: getPreviewMicrocopy(content, 'whatsapp-hero-topic', defaults.siteMicrocopy.whatsappHeroTopic),
    },
    galleryCategories: [
      { id: 'all', label: getPreviewMicrocopy(content, 'gallery-all-label', defaults.galleryCategories[0].label) },
      { id: 'tables', label: getPreviewMicrocopy(content, 'gallery-tables-label', defaults.galleryCategories[1].label) },
      { id: 'trays', label: getPreviewMicrocopy(content, 'gallery-trays-label', defaults.galleryCategories[2].label) },
      { id: 'salads', label: getPreviewMicrocopy(content, 'gallery-salads-label', defaults.galleryCategories[3].label) },
      { id: 'fish', label: getPreviewMicrocopy(content, 'gallery-fish-label', defaults.galleryCategories[4].label) },
      { id: 'coffee', label: getPreviewMicrocopy(content, 'gallery-coffee-label', defaults.galleryCategories[5].label) },
    ],
    contactInterestOptions: getPreviewMicrocopyItems(content, 'contact-interest-options', defaults.contactInterestOptions),
    contactDeliveryOptions: getPreviewMicrocopyItems(content, 'contact-delivery-options', defaults.contactDeliveryOptions),
    sectionCopy: {
      ...defaults.sectionCopy,
      introBand: getPreviewCopySection(content, 'intro-band', defaults.sectionCopy.introBand),
      manifesto: getPreviewCopySection(content, 'manifesto', defaults.sectionCopy.manifesto),
      editorial: getPreviewCopySection(content, 'editorial', defaults.sectionCopy.editorial),
      audience: getPreviewCopySection(content, 'audience', defaults.sectionCopy.audience),
      experienceLab: getPreviewCopySection(content, 'experience-lab', defaults.sectionCopy.experienceLab),
      signature: getPreviewCopySection(content, 'signature', defaults.sectionCopy.signature),
      boutique: getPreviewCopySection(content, 'boutique', defaults.sectionCopy.boutique),
      services: getPreviewCopySection(content, 'services', defaults.sectionCopy.services),
      process: getPreviewCopySection(content, 'process', defaults.sectionCopy.process),
      story: getPreviewCopySection(content, 'story', defaults.sectionCopy.story),
      samples: getPreviewCopySection(content, 'samples', defaults.sectionCopy.samples),
      coordination: getPreviewCopySection(content, 'coordination', defaults.sectionCopy.coordination),
      realMedia: getPreviewCopySection(content, 'real-media', defaults.sectionCopy.realMedia),
      gallery: getPreviewCopySection(content, 'gallery', defaults.sectionCopy.gallery),
      bookingBasics: getPreviewCopySection(content, 'booking-basics', defaults.sectionCopy.bookingBasics),
      seo: getPreviewCopySection(content, 'seo', defaults.sectionCopy.seo),
      trust: getPreviewCopySection(content, 'trust', defaults.sectionCopy.trust),
      faq: getPreviewCopySection(content, 'faq', defaults.sectionCopy.faq),
      contact: getPreviewCopySection(content, 'contact', defaults.sectionCopy.contact),
    },
    manifestoMoments: manifestoSections.length
      ? manifestoSections.map((section, index) => {
          const base = defaults.manifestoMoments[index] ?? defaults.manifestoMoments[0];
          return {
            ...base,
            label: section.items[0] || base.label,
            title: section.title || base.title,
            text: section.text || base.text,
            image: resolvePreviewImage(mediaById, section.items[1], base.image),
          };
        })
      : defaults.manifestoMoments,
    editorialCards: editorialSections.length
      ? editorialSections.map((section, index) => {
          const base = defaults.editorialCards[index] ?? defaults.editorialCards[0];
          return {
            ...base,
            label: section.items[0] || base.label,
            title: section.title || base.title,
            text: section.text || base.text,
          };
        })
      : defaults.editorialCards,
    audienceCards: audienceSections.length
      ? audienceSections.map((section, index) => {
          const base = defaults.audienceCards[index] ?? defaults.audienceCards[0];
          return { ...base, title: section.title || base.title, text: section.text || base.text };
        })
      : defaults.audienceCards,
    boutiqueReasons: boutiqueSections.length
      ? boutiqueSections.map((section, index) => {
          const base = defaults.boutiqueReasons[index] ?? defaults.boutiqueReasons[0];
          return { ...base, title: section.title || base.title, text: section.text || base.text };
        })
      : defaults.boutiqueReasons,
    services: services.length ? services : defaults.services,
    processSteps: processSections.length
      ? processSections.map((section, index) => {
          const base = defaults.processSteps[index] ?? defaults.processSteps[0];
          return { ...base, title: section.title || base.title, text: section.text || base.text };
        })
      : defaults.processSteps,
    storyMoments: storySections.length
      ? storySections.map((section, index) => {
          const base = defaults.storyMoments[index] ?? defaults.storyMoments[0];
          return { title: section.title || base.title, text: section.text || base.text };
        })
      : defaults.storyMoments,
    signatureMoments: signatureSections.length
      ? signatureSections.map((section, index) => {
          const base = defaults.signatureMoments[index] ?? defaults.signatureMoments[0];
          return { ...base, title: section.title || base.title, text: section.text || base.text };
        })
      : defaults.signatureMoments,
    menuGroups: samplesSections.length
      ? samplesSections.map((section, index) => {
          const base = defaults.menuGroups[index] ?? defaults.menuGroups[0];
          return {
            ...base,
            title: section.title || base.title,
            intro: section.text || base.intro,
            items: section.items.length ? section.items : base.items,
          };
        })
      : defaults.menuGroups,
    coordinationCards: coordinationSections.length
      ? coordinationSections.map((section, index) => {
          const base = defaults.coordinationCards[index] ?? defaults.coordinationCards[0];
          return { ...base, title: section.title || base.title, text: section.text || base.text };
        })
      : defaults.coordinationCards,
    galleryImages: galleryImages.length ? galleryImages : defaults.galleryImages,
    seoTopics: seoTopicsSection?.items.length ? seoTopicsSection.items : defaults.seoTopics,
    trustCards: trustSections.length
      ? trustSections.map((section, index) => {
          const base = defaults.trustCards[index] ?? defaults.trustCards[0];
          return { ...base, title: section.title || base.title, text: section.text || base.text };
        })
      : defaults.trustCards,
    faqs: faqSections.length
      ? faqSections.map((section, index) => {
          const base = defaults.faqs[index] ?? defaults.faqs[0];
          return { question: section.title || base.question, answer: section.text || base.answer };
        })
      : defaults.faqs,
  };
};

const buildPreviewWhatsappLink = (base: string, message: string) => `${base}?text=${encodeURIComponent(message)}`;

const seoTitleFallback = 'Nis Boutique Catering';
const seoDescriptionFallback = 'תיאור קצר שיופיע במנועי חיפוש ובשיתוף קישורים.';

const getSeoStatus = (value: string, min: number, max: number) => {
  if (!value.trim()) {
    return { label: 'חסר', tone: 'warning' } as const;
  }

  if (value.length < min) {
    return { label: 'קצר מדי', tone: 'warning' } as const;
  }

  if (value.length > max) {
    return { label: 'ארוך מדי', tone: 'warning' } as const;
  }

  return { label: 'תקין', tone: 'good' } as const;
};

const ContactPreview = ({
  content,
  device,
  mediaById,
}: {
  readonly content: ContentSnapshot;
  readonly device: PreviewDevice;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
}) => <ActualContactPreview content={content} mediaById={mediaById} device={device} />;

const MetadataSeoPreview = ({ content, device }: { readonly content: ContentSnapshot; readonly device: PreviewDevice }) => {
  const title = content.settings.seoTitle || seoTitleFallback;
  const description = content.settings.seoDescription || seoDescriptionFallback;
  const titleStatus = getSeoStatus(content.settings.seoTitle ?? '', 20, 60);
  const descriptionStatus = getSeoStatus(content.settings.seoDescription ?? '', 70, 160);
  const cleanUrl = publicSiteOrigin.replace('https://', '');

  return (
    <div className={device === 'mobile' ? 'preview-frame is-mobile' : 'preview-frame is-desktop'}>
      <PreviewBrowserBar device={device} />
      <div className="site-section-preview site-section-preview-frame metadata-site-preview">
        <div className="metadata-preview-heading">
          <p className="kicker">מטה דאטה ו-SEO</p>
          <h3>כך האתר נראה כשמשתפים אותו או מוצאים אותו בגוגל.</h3>
          <p>הכותרת והתיאור צריכים להיות ברורים, קצרים ומוכנים ללקוח. הסטטוס כאן עוזר לזהות בעיות לפני פרסום.</p>
        </div>
        <div className="metadata-preview-grid">
          <article className="metadata-search-card" aria-label="תצוגת חיפוש Google">
            <div className="metadata-card-heading">
              <Search aria-hidden="true" />
              <span>Google</span>
            </div>
            <span className="metadata-url">{cleanUrl}</span>
            <h4>{title}</h4>
            <p>{description}</p>
          </article>
          <article className="metadata-share-card" aria-label="תצוגת שיתוף קישור">
            <div className="metadata-share-image">
              <img src={`${publicSiteOrigin}/brand/nis-logo.svg`} alt="" />
            </div>
            <div>
              <span>{cleanUrl}</span>
              <h4>{title}</h4>
              <p>{description}</p>
            </div>
          </article>
          <article className="metadata-health-card" aria-label="בדיקת שדות SEO">
            <div className="metadata-card-heading">
              <Eye aria-hidden="true" />
              <span>בדיקת שדות</span>
            </div>
            <div className="metadata-health-row">
              <strong>כותרת SEO</strong>
              <span>{title.length} תווים</span>
              <mark className={`is-${titleStatus.tone}`}>{titleStatus.tone === 'good' ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}{titleStatus.label}</mark>
            </div>
            <div className="metadata-health-row">
              <strong>תיאור SEO</strong>
              <span>{description.length} תווים</span>
              <mark className={`is-${descriptionStatus.tone}`}>{descriptionStatus.tone === 'good' ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}{descriptionStatus.label}</mark>
            </div>
            <div className="metadata-version-row">
              <span>גרסת תוכן</span>
              <strong>{content.settings.siteVersion || content.version}</strong>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};

const LoginGate = ({
  authState,
  isBusy,
  status,
  onLogin,
  googleConfigured,
}: {
  readonly authState: AuthState;
  readonly isBusy: boolean;
  readonly status: string;
  readonly onLogin: () => void;
  readonly googleConfigured: boolean;
}) => (
  <main className="login-shell">
    <section className="login-panel" aria-labelledby="login-title">
      <div className="brand-block login-brand">
        <img className="studio-logo login-logo" src={`${publicSiteOrigin}/brand/nis-logo.svg`} alt="Nis Boutique Catering" />
        <div>
          <p className="kicker">מערכת ניהול פרטית</p>
          <h1 id="login-title">Nis Studio</h1>
        </div>
      </div>
      <div className="login-copy">
        <h2>כניסה למורשים בלבד</h2>
        <p>הסטודיו מנהל את התוכן והתמונות של האתר. רק משתמשים שאושרו מראש יכולים לצפות או לערוך אותו.</p>
      </div>
      <div className={authState === 'denied' ? 'login-status is-error' : 'login-status'}>
        {authState === 'denied' ? <ShieldAlert aria-hidden="true" /> : <Lock aria-hidden="true" />}
        <span>{status}</span>
      </div>
      <button className="publish-button login-button" onClick={onLogin} disabled={isBusy || !googleConfigured || authState === 'loading'}>
        <LogIn aria-hidden="true" />
        {authState === 'loading' ? 'מתחברים...' : 'כניסה עם Google'}
      </button>
      {!googleConfigured && <p className="config-warning">חסרה הגדרת Google ולכן אי אפשר להתחבר כרגע.</p>}
      <a className="creator-credit login-credit" href={creatorUrl} target="_blank" rel="noreferrer">
        נבנה באהבה על ידי EvyatarHazan.com
      </a>
    </section>
  </main>
);

const StatusPanel = ({ publishState, status, hasErrors }: { readonly publishState: PublishState; readonly status: string; readonly hasErrors: boolean }) => {
  const icon = hasErrors || publishState === 'error'
    ? <ShieldAlert aria-hidden="true" />
    : publishState === 'live'
      ? <MonitorCheck aria-hidden="true" />
      : publishState === 'checking' || publishState === 'publishing'
        ? <Cloud aria-hidden="true" />
        : <CheckCircle2 aria-hidden="true" />;
  return (
    <div className={hasErrors ? 'status-line is-error' : `status-line is-${publishState}`}>
      {icon}
      <span>{status}</span>
    </div>
  );
};

const EditingWorkflow = ({
  activeView,
  publishState,
  hasErrors,
  hasPublishUrl,
}: {
  readonly activeView: ActiveView;
  readonly publishState: PublishState;
  readonly hasErrors: boolean;
  readonly hasPublishUrl: boolean;
}) => (
  <section className="editing-workflow" aria-label="זרימת עבודה">
    {getStudioWorkflowSteps(activeView, publishState, hasErrors, hasPublishUrl).map(({ step, title, text, state }) => (
      <article className={`is-${state}`} key={step}>
        <strong>{step}</strong>
        <div>
          <h3>{title}</h3>
          <p>{text}</p>
        </div>
      </article>
    ))}
  </section>
);

const SectionGroupEditor = ({
  title,
  text,
  group,
  content,
  mediaById,
  sections,
  updateSection,
  addSection,
  duplicateSection,
  archiveSection,
  restoreSection,
  previewDevice,
  onPreviewDeviceChange,
}: {
  readonly title: string;
  readonly text: string;
  readonly group: string;
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly sections: readonly SectionBlockRecord[];
  readonly updateSection: (id: string, patch: Partial<SectionBlockRecord>) => void;
  readonly addSection: (group?: string) => void;
  readonly duplicateSection: (section: SectionBlockRecord) => void;
  readonly archiveSection: (id: string) => void;
  readonly restoreSection: (id: string) => void;
  readonly previewDevice: PreviewDevice;
  readonly onPreviewDeviceChange: (device: PreviewDevice) => void;
}) => {
  const groupSections = sections
    .filter((section) => section.group === group)
    .sort((left, right) => left.order - right.order);

  return (
    <section className="workspace-panel split-editor">
      <div className="editor-column">
        <PanelHeader
          title={title}
          text={text}
          action={
            <button className="compact-button" onClick={() => addSection(group)}>
              <Plus aria-hidden="true" />
              הוסף פריט
            </button>
          }
        />
        <div className="cards-list">
          {groupSections.map((section) => (
            <article className={section.deletedAt ? 'edit-card is-archived' : 'edit-card'} key={section.id}>
              <div className="card-heading">
                <div>
                  <p className="kicker">{sectionGroupLabels[section.group] ?? section.group}</p>
                  <h3>{section.title || 'פריט ללא כותרת'}</h3>
                </div>
                <ItemActions
                  isArchived={Boolean(section.deletedAt)}
                  onDuplicate={() => duplicateSection(section)}
                  onArchive={() => archiveSection(section.id)}
                  onRestore={() => restoreSection(section.id)}
                />
              </div>
              <Toggle checked={section.active && !section.deletedAt} label="מוצג באתר" onChange={(checked) => updateSection(section.id, { active: checked })} />
              <Field
                label={group === 'site-microcopy' ? 'שם פנימי ברור' : group === 'faq' ? 'השאלה שמופיעה באתר' : 'כותרת שמופיעה באתר'}
                help={group === 'site-microcopy' ? 'שם שעוזר להבין איפה הטקסט מופיע. בדרך כלל לא מוצג באתר.' : group === 'site-copy' ? 'זו הכותרת הגדולה של האזור באתר.' : 'זו הכותרת שהלקוח יראה באזור הזה.'}
              >
                <TextInput value={section.title ?? ''} onChange={(value) => updateSection(section.id, { title: value || undefined })} />
              </Field>
              <Field
                label={group === 'site-microcopy' ? 'הטקסט שמופיע באתר' : group === 'faq' ? 'התשובה' : 'טקסט מתחת לכותרת'}
                help={group === 'site-microcopy' ? 'זה הטקסט הקצר שהלקוח יראה בכפתור, בטופס או בהודעת וואטסאפ.' : group === 'site-copy' ? 'הפתיח או פסקת ההסבר של האזור. אפשר להשאיר ריק אם באזור אין פסקה.' : 'טקסט קצר וברור, בלי ניסוחים טכניים.'}
              >
                <textarea value={section.text ?? ''} onChange={(event) => updateSection(section.id, { text: event.target.value || undefined })} />
              </Field>
              <Field
                label={group === 'site-copy' ? 'תווית קטנה ועוד פסקאות' : group === 'site-microcopy' ? 'אפשרויות לרשימות קצרות' : 'נקודות נוספות'}
                help={group === 'site-copy' ? 'הנקודה הראשונה היא התווית שמעל הכותרת. נקודה שנייה יכולה להכיל עוד פסקאות, מופרדות עם |.' : group === 'site-microcopy' ? 'משמש לשדות בחירה כמו סוג הזמנה או אופן קבלה. מפרידים אפשרויות עם |.' : 'אם צריך רשימה קצרה, מפרידים נקודות עם |'}
              >
                <TextInput value={joinPipeList(section.items)} onChange={(value) => updateSection(section.id, { items: splitPipeList(value) })} />
              </Field>
              <details className="technical-details">
                <summary>פרטים מתקדמים</summary>
                <div className="inline-grid">
                  <NumberInput value={section.order} onChange={(value) => updateSection(section.id, { order: value })} />
                  <TextInput value={section.id} onChange={(value) => updateSection(section.id, { id: value })} />
                </div>
              </details>
            </article>
          ))}
          {groupSections.length === 0 && (
            <div className="empty-state">
              <FileText aria-hidden="true" />
              <strong>עדיין אין פריטים באזור הזה</strong>
              <span>לחצו “הוסף פריט” כדי להתחיל לנהל אותו מהסטודיו.</span>
            </div>
          )}
        </div>
      </div>
      <div className="preview-column">
        <PreviewHeader
          title="תצוגה מקדימה כמו באתר"
          text="אפשר לעבור בין מחשב למובייל ולבדוק איך הטקסטים ייראו אחרי פרסום."
          device={previewDevice}
          onDeviceChange={onPreviewDeviceChange}
        />
        <SectionGroupSitePreview group={group} title={title} content={content} mediaById={mediaById} sections={groupSections} allSections={sections} device={previewDevice} />
      </div>
    </section>
  );
};

const SectionGroupSitePreview = ({
  group,
  title,
  content,
  mediaById,
  sections,
  allSections,
  device,
}: {
  readonly group: string;
  readonly title: string;
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly sections: readonly SectionBlockRecord[];
  readonly allSections: readonly SectionBlockRecord[];
  readonly device: PreviewDevice;
}) => {
  const activeSections = sections.filter((section) => section.active && !section.deletedAt);
  const fallbackCopy = sectionPreviewCopy[group] ?? {
    eyebrow: sectionGroupLabels[group] ?? title,
    title,
    text: 'כך האזור הזה יופיע באתר אחרי פרסום.',
  };
  const managedCopy = allSections.find((section) => section.group === 'site-copy' && section.id === `copy-${group}` && section.active && !section.deletedAt);
  const copy = {
    eyebrow: managedCopy?.items[0] || fallbackCopy.eyebrow,
    title: managedCopy?.title || fallbackCopy.title,
    text: managedCopy?.text || fallbackCopy.text,
  };

  const actualSection = (() => {
    const exactGroup = exactPreviewSectionGroupIds.find((item) => item === group);
    if (!exactGroup) {
      return null;
    }

    const sectionByGroup: Record<typeof exactPreviewSectionGroupIds[number], ReactNode> = {
      editorial: <EditorialSection />,
      audience: <AudienceSection />,
      boutique: <BoutiqueSection />,
      signature: <SignatureSection />,
      process: <ProcessSection />,
      story: <StorySection />,
      samples: <SamplesSection />,
      coordination: <CoordinationSection />,
      trust: <TrustSection />,
      faq: <FaqSection />,
    };

    return sectionByGroup[exactGroup];
  })();

  if (actualSection) {
    return <ActualSiteSectionFrame content={content} mediaById={mediaById} device={device}>{actualSection}</ActualSiteSectionFrame>;
  }

  return (
    <div className={device === 'mobile' ? 'preview-frame is-mobile' : 'preview-frame is-desktop'}>
      <PreviewBrowserBar device={device} />
      <div className={`site-section-preview site-section-preview-frame section-group-preview section-group-preview-${group}`}>
        <SectionPreviewBody group={group} sections={activeSections} copy={copy} />
      </div>
    </div>
  );
};

const SectionPreviewBody = ({
  group,
  sections,
  copy,
}: {
  readonly group: string;
  readonly sections: readonly SectionBlockRecord[];
  readonly copy: { readonly eyebrow: string; readonly title: string; readonly text: string };
}) => {
  if (sections.length === 0) {
    return (
      <>
        <p className="kicker">{copy.eyebrow}</p>
        <h3>{copy.title}</h3>
        <p>{copy.text}</p>
        <div className="empty-state">
          <FileText aria-hidden="true" />
          <strong>אין פריטים פעילים באזור הזה</strong>
          <span>הדליקו פריט אחד לפחות כדי שיופיע באתר.</span>
        </div>
      </>
    );
  }

  if (group === 'process') {
    return (
      <>
        <p className="kicker">{copy.eyebrow}</p>
        <h3>{copy.title}</h3>
        <p>{copy.text}</p>
        <div className="preview-process-list">
          {sections.map((section, index) => (
            <article key={section.id}>
              <span>{index + 1}</span>
              <CheckCircle2 aria-hidden="true" />
              <h3>{section.title}</h3>
              <p>{section.text}</p>
            </article>
          ))}
        </div>
      </>
    );
  }

  if (group === 'faq') {
    return (
      <div className="preview-faq-site-grid">
        <div className="preview-faq-copy">
          <p className="kicker">{copy.eyebrow}</p>
          <h3>{copy.title}</h3>
          {copy.text && <p>{copy.text}</p>}
          <div className="preview-faq-meta" aria-label="סיכום שאלות">
            <span>{sections.length} שאלות פעילות</span>
            <span>מוצג כאקורדיון באתר</span>
          </div>
        </div>
        <div className="preview-faq-list">
          {sections.map((section, index) => (
            <details key={section.id} open={index === 0}>
              <summary>{section.title}</summary>
              <p>{section.text}</p>
            </details>
          ))}
        </div>
      </div>
    );
  }

  if (group === 'site-microcopy') {
    return (
      <>
        <p className="kicker">{copy.eyebrow}</p>
        <h3>{copy.title}</h3>
        <p>{copy.text}</p>
        <div className="preview-content-grid">
          {sections.slice(0, 8).map((section) => (
            <article key={section.id}>
              <Tag aria-hidden="true" />
              <h3>{section.title}</h3>
              <p>{section.text || section.items.join(' | ')}</p>
            </article>
          ))}
        </div>
      </>
    );
  }

  if (group === 'trust') {
    return (
      <div className="preview-trust-site">
        <div className="preview-trust-heading">
          <p className="kicker">{copy.eyebrow}</p>
          <h3>{copy.title}</h3>
          {copy.text && <p>{copy.text}</p>}
          <div className="preview-trust-summary" aria-label="סיכום אמון">
            <span>{sections.length} כרטיסי אמון פעילים</span>
            <span>מופיע לפני שאלות ויצירת קשר</span>
          </div>
        </div>
        <div className="preview-trust-grid">
          {sections.map((section, index) => (
            <article key={section.id}>
              {index % 2 === 0 ? <ShieldCheck aria-hidden="true" /> : <HeartHandshake aria-hidden="true" />}
              <h3>{section.title}</h3>
              <p>{section.text}</p>
              {section.items.length > 0 && (
                <div className="preview-mini-tags">
                  {section.items.slice(0, 3).map((item) => <span key={item}>{item}</span>)}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="kicker">{copy.eyebrow}</p>
      <h3>{copy.title}</h3>
      <p>{copy.text}</p>
      <div className="preview-content-grid">
        {sections.map((section) => (
          <article key={section.id}>
            <Sparkles aria-hidden="true" />
            <h3>{section.title}</h3>
            <p>{section.text}</p>
            {section.items.length > 0 && (
              <div className="preview-mini-tags">
                {section.items.slice(0, 3).map((item) => <span key={item}>{item}</span>)}
              </div>
            )}
          </article>
        ))}
      </div>
    </>
  );
};

const sectionPreviewCopy: Readonly<Record<string, { readonly eyebrow: string; readonly title: string; readonly text: string }>> = {
  audience: {
    eyebrow: 'למי זה מתאים',
    title: 'מבינים מהר אם Nis מתאימה לאירוח שלכם.',
    text: 'כרטיסים קצרים שעוזרים ללקוח לזהות את עצמו לפני פנייה.',
  },
  editorial: {
    eyebrow: 'מה מזמינים אצלנו',
    title: 'שלוש כניסות ברורות לעולם של Nis.',
    text: 'פתיח קצר לקטגוריות המרכזיות באתר.',
  },
  'site-copy': {
    eyebrow: 'טקסטי מעטפת',
    title: 'הכותרות והפתיחים שמחזיקים את כל האתר.',
    text: 'כל כרטיס כאן משפיע על אזור אחר באתר: תווית קטנה, כותרת ראשית וטקסט הסבר.',
  },
  'site-microcopy': {
    eyebrow: 'טקסטים קטנים',
    title: 'הכפתורים, הטופס והודעות הוואטסאפ בלי קוד.',
    text: 'כאן עורכים מילים קצרות שמופיעות בלחיצות, בטופס ובפעולות יצירת קשר.',
  },
  manifesto: {
    eyebrow: 'השפה של Nis',
    title: 'בוטיק, ביתיות ותשומת לב לפרטים.',
    text: 'האזור שמסביר את התחושה והאופי לפני שמגיעים להזמנה.',
  },
  boutique: {
    eyebrow: 'למה זה בוטיק',
    title: 'כל הזמנה מקבלת יחס אישי ושפה נקייה.',
    text: 'נקודות הערך שהופכות את השירות למדויק יותר ממדף קבוע.',
  },
  signature: {
    eyebrow: 'רגעי בוטיק',
    title: 'פרטים קטנים שמרגישים על השולחן.',
    text: 'טקסטים שמלווים את התמונות ומחזקים את החוויה.',
  },
  process: {
    eyebrow: 'איך זה עובד',
    title: 'ארבעה צעדים קצרים מהרעיון ועד אוכל שמוכן להגשה.',
    text: 'כך הלקוח יבין את הדרך מהפנייה הראשונה ועד הסיכום.',
  },
  story: {
    eyebrow: 'הסיפור של המותג',
    title: 'Nis נולדה מתוך אהבה לאירוח יפה ואוכל ביתי מדויק.',
    text: 'תחנות קצרות שמסבירות מאיפה המותג בא ומה הוא מביא לשולחן.',
  },
  samples: {
    eyebrow: 'כיוונים להזמנה',
    title: 'כיווני תפריט שעוזרים להתחיל שיחה.',
    text: 'כל כרטיס נותן ללקוח רעיון ברור למה אפשר להזמין.',
  },
  coordination: {
    eyebrow: 'תיאום וזמינות',
    title: 'פרטים מעשיים שמורידים חיכוך לפני פנייה.',
    text: 'מידע קצר שמסביר זמינות, אזור פעילות ואיך סוגרים פרטים.',
  },
  trust: {
    eyebrow: 'מה מרגיע לפני שסוגרים',
    title: 'פחות סימני שאלה, יותר תחושה שיש עם מי לדבר.',
    text: 'כרטיסי אמון שמופיעים לקראת סוף האתר ומחזקים את הפנייה.',
  },
  faq: {
    eyebrow: 'שאלות נפוצות',
    title: 'התשובות שמקלות על הפנייה הראשונה.',
    text: 'שאלות ותשובות כפי שהן יופיעו באתר.',
  },
};

const PublishPanel = ({
  content,
  hasErrors,
  status,
  publishState,
  publishProgress,
  hasPublishUrl,
  onSaveDraft,
  onPublish,
  disabled,
}: {
  readonly content: ContentSnapshot;
  readonly hasErrors: boolean;
  readonly status: string;
  readonly publishState: PublishState;
  readonly publishProgress: PublishProgress | null;
  readonly hasPublishUrl: boolean;
  readonly onSaveDraft: () => void;
  readonly onPublish: () => void;
  readonly disabled: boolean;
}) => {
  const statusIsError = hasErrors || publishState === 'error' || !hasPublishUrl;
  const targetVersion = publishProgress?.targetVersion ?? content.settings.siteVersion ?? content.version;
  const liveUrl = publishProgress?.liveUrl ?? publicSiteOrigin;
  const checkedAt = publishProgress?.checkedAt ? formatPublishTime(publishProgress.checkedAt) : null;
  const bundleFile = publishProgress?.lastBundleUrl ? getBundleFileName(publishProgress.lastBundleUrl) : null;

  return (
    <section className="workspace-panel publish-panel-detail">
      <PanelHeader title="פרסום ושינויים" text="כאן עושים בדיקה אחרונה. שמירה לבד לא משנה את האתר; עדכון אתר מפרסם את הכל." />
      <div className="publish-flow">
        {getPublishSteps(publishState, hasErrors, hasPublishUrl).map(({ step, title, text, state }) => (
          <article className={`is-${state}`} key={step}>
            <strong>{step}</strong>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </article>
        ))}
      </div>
      <div className={statusIsError ? 'publish-summary is-error' : 'publish-summary'}>
        <ShieldAlert aria-hidden="true" />
        <div>
          <span>{!hasPublishUrl ? 'חסר חיבור פרסום מאובטח. צריך להגדיר את כתובת הפרסום של Apps Script בסביבת הסטודיו.' : status}</span>
          <div className="publish-status-details" aria-label="פרטי פרסום">
            <span>גרסה לפרסום: {targetVersion}</span>
            <a href={liveUrl} target="_blank" rel="noreferrer">אתר חי: {liveUrl.replace('https://', '')}</a>
            {publishProgress?.attempt && <span>בדיקה: {publishProgress.attempt}/{publishProgress.totalAttempts}</span>}
            {checkedAt && <span>נבדק לאחרונה: {checkedAt}</span>}
            {bundleFile && <span>קובץ אתר שנבדק: {bundleFile}</span>}
          </div>
        </div>
      </div>
      <div className="overview-strip">
        <Metric label="שירותים לא בארכיון" value={String(content.services.filter((item) => !item.deletedAt).length)} />
        <Metric label="שאלות FAQ פעילות" value={String(content.sections.filter((item) => item.group === 'faq' && item.active && !item.deletedAt).length)} />
        <Metric label="תמונות פעילות" value={String(content.gallery.filter((item) => item.active && !item.deletedAt).length)} />
        <Metric label="גרסה לפרסום" value={targetVersion} />
      </div>
      <OwnerVerificationPanel
        publishState={publishState}
        hasErrors={hasErrors}
        hasPublishUrl={hasPublishUrl}
        liveUrl={liveUrl}
      />
      <div className="topbar-actions">
        <button className="ghost-button" onClick={onSaveDraft} disabled={disabled}>
          <Save aria-hidden="true" />
          שמור כטיוטה
        </button>
        <button className="publish-button" onClick={onPublish} disabled={disabled || !hasPublishUrl}>
          <Rocket aria-hidden="true" />
          עדכן אתר
        </button>
        <a className="ghost-link" href={publicSiteOrigin} target="_blank" rel="noreferrer">פתיחת האתר החי</a>
      </div>
    </section>
  );
};

const OwnerVerificationPanel = ({
  publishState,
  hasErrors,
  hasPublishUrl,
  liveUrl,
}: {
  readonly publishState: PublishState;
  readonly hasErrors: boolean;
  readonly hasPublishUrl: boolean;
  readonly liveUrl: string;
}) => (
  <section className="owner-verification-panel" aria-label="בדיקות בעלים בפרודקשיין">
    <div className="owner-verification-heading">
      <div>
        <p className="kicker">בדיקות בעלים בפרודקשיין</p>
        <h3>מה לבדוק אחרי Login ולפני שסוגרים משימה</h3>
        <p>הסטודיו יכול לזהות סטטוס שמירה ופרסום. בדיקת התחברות אמיתית ושינוי תוכן בפועל עדיין צריכים להתבצע מחשבון Google מורשה.</p>
      </div>
      <a className="ghost-link" href={liveUrl} target="_blank" rel="noreferrer">
        <ExternalLink aria-hidden="true" />
        אתר חי
      </a>
    </div>
    <div className="owner-checklist">
      {getOwnerVerificationChecklist(publishState, hasErrors, hasPublishUrl).map((item) => (
        <article className={`is-${item.state}`} key={item.title}>
          {item.state === 'done' ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
          <div>
            <h4>{item.title}</h4>
            <p>{item.text}</p>
          </div>
        </article>
      ))}
    </div>
  </section>
);

const ItemActions = ({
  isArchived,
  onDuplicate,
  onArchive,
  onRestore,
}: {
  readonly isArchived: boolean;
  readonly onDuplicate?: () => void;
  readonly onArchive: () => void;
  readonly onRestore: () => void;
}) => (
  <div className="item-actions">
    {isArchived ? (
      <button type="button" className="icon-button" onClick={onRestore} aria-label="שחזור מהארכיון">
        <RotateCcw aria-hidden="true" />
      </button>
    ) : (
      <>
        {onDuplicate && (
          <button type="button" className="icon-button" onClick={onDuplicate} aria-label="שכפול">
            <Copy aria-hidden="true" />
          </button>
        )}
        <button type="button" className="icon-button danger" onClick={onArchive} aria-label="העברה לארכיון">
          <Trash2 aria-hidden="true" />
        </button>
      </>
    )}
  </div>
);

const DrivePreviewImage = ({ media, accessToken }: { readonly media?: ImageAssetRecord; readonly accessToken: string }) => {
  const [preview, setPreview] = useState<{ readonly fileId: string; readonly objectUrl: string; readonly failed: boolean } | null>(null);
  const [failedFallbackSrc, setFailedFallbackSrc] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const fallbackSrc = media?.src ? publicAssetSrcFor(media.src) : '';

  useEffect(() => {
    if (!media?.driveFileId) {
      return undefined;
    }

    const controller = new AbortController();
    let nextObjectUrl = '';

    fetch(getDriveFileDownloadUrl(media.driveFileId), {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Drive preview failed');
        }
        return response.blob();
      })
      .then((blob) => {
        nextObjectUrl = URL.createObjectURL(blob);
        setPreview({ fileId: media.driveFileId ?? '', objectUrl: nextObjectUrl, failed: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setPreview({ fileId: media.driveFileId ?? '', objectUrl: '', failed: true });
        }
      });

    return () => {
      controller.abort();
      if (nextObjectUrl) {
        URL.revokeObjectURL(nextObjectUrl);
      }
    };
  }, [accessToken, media?.driveFileId, retryKey]);

  const drivePreview = media?.driveFileId && preview?.fileId === media.driveFileId ? preview : null;
  const fallbackFailed = Boolean(fallbackSrc && failedFallbackSrc === fallbackSrc);
  const src = drivePreview?.objectUrl || (fallbackFailed ? '' : fallbackSrc);
  const failed = Boolean(drivePreview?.failed && (!fallbackSrc || fallbackFailed));
  const isLoadingDrive = Boolean(media?.driveFileId && !drivePreview);
  const isShowingDrive = Boolean(drivePreview?.objectUrl);
  const isShowingFallbackAfterDriveFailure = Boolean(drivePreview?.failed && src && !isShowingDrive);
  const driveFileUrl = media?.driveFileId ? getDriveFileViewUrl(media.driveFileId) : null;
  const sourceIdLabel = media?.driveFileId ? shortSourceId(media.driveFileId) : media?.src ? 'קובץ אתר' : 'אין מקור';
  const statusLabel = isShowingDrive
    ? 'מקור בדרייב'
    : isShowingFallbackAfterDriveFailure
      ? 'Drive לא נטען - מוצג מהאתר'
      : media?.driveFileId
        ? 'טוען מדרייב'
        : 'תצוגה מהאתר';

  return (
    <div className="media-preview">
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => {
            if (drivePreview?.objectUrl && fallbackSrc) {
              setPreview(media?.driveFileId ? { fileId: media.driveFileId, objectUrl: '', failed: true } : null);
              return;
            }
            setFailedFallbackSrc(fallbackSrc);
            setPreview(media?.driveFileId ? { fileId: media.driveFileId, objectUrl: '', failed: true } : null);
          }}
        />
      ) : (
        <div className="empty-preview">
          {isLoadingDrive ? <RefreshCw aria-hidden="true" /> : <Eye aria-hidden="true" />}
          <span>
            {media
              ? isLoadingDrive
                ? 'טוען תצוגה מקדימה ישירות מדרייב...'
                : 'אין תצוגה מקדימה. בחרו מקור מדרייב או פרסמו את התמונה לאתר.'
              : 'לא נבחרה תמונה'}
          </span>
        </div>
      )}
      {media && (
        <div className="preview-source-bar">
          <span className={isShowingDrive ? 'source-pill is-drive' : isShowingFallbackAfterDriveFailure ? 'source-pill is-warning' : 'source-pill'}>
            {statusLabel}
          </span>
          <span className={media.driveFileId ? 'source-pill is-source-id' : 'source-pill'}>{sourceIdLabel}</span>
          {driveFileUrl && (
            <a className="preview-drive-link" href={driveFileUrl} target="_blank" rel="noreferrer" title="פתיחת קובץ המקור ב-Google Drive">
              <ExternalLink aria-hidden="true" />
              Drive
            </a>
          )}
          {drivePreview?.failed && media.driveFileId && (
            <button
              type="button"
              className="preview-retry-button"
              onClick={() => {
                setPreview(null);
                setRetryKey((current) => current + 1);
              }}
            >
              <RefreshCw aria-hidden="true" />
              נסה שוב
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const PanelHeader = ({ title, text, action }: { readonly title: string; readonly text: string; readonly action?: ReactNode }) => (
  <div className="panel-header">
    <div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
    {action}
  </div>
);

const Field = ({ label, help, children }: { readonly label: string; readonly help: string; readonly children: ReactNode }) => (
  <label className="field-block">
    <span>{label}</span>
    <small>{help}</small>
    {children}
  </label>
);

const Toggle = ({ checked, label, onChange }: { readonly checked: boolean; readonly label: string; readonly onChange: (checked: boolean) => void }) => (
  <label className="toggle-control">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    <span>{label}</span>
  </label>
);

const Metric = ({ label, value }: { readonly label: string; readonly value: string }) => (
  <article>
    <span>{label}</span>
    <strong>{value}</strong>
  </article>
);

const MediaQuickPicker = ({
  label,
  mediaItems,
  selectedMediaId,
  content,
  onSelect,
}: {
  readonly label: string;
  readonly mediaItems: readonly ImageAssetRecord[];
  readonly selectedMediaId: string;
  readonly content: ContentSnapshot;
  readonly onSelect: (mediaId: string) => void;
}) => (
  <div className="media-quick-picker" aria-label={label}>
    <div className="media-quick-picker-heading">
      <strong>{label}</strong>
      <span>לחיצה אחת מחליפה את התמונה באזור הזה.</span>
    </div>
    <div className="media-choice-list">
      {mediaItems.map((media) => {
        const selected = media.id === selectedMediaId;
        const src = media.src ? publicAssetSrcFor(media.src) : '';
        return (
          <button
            type="button"
            className={selected ? 'media-choice is-selected' : 'media-choice'}
            key={media.id}
            onClick={() => onSelect(media.id)}
            aria-pressed={selected}
            title={mediaLabel(media, content)}
          >
            {src ? <img src={src} alt="" loading="lazy" /> : <span className="media-choice-empty">אין תמונה</span>}
            <span>{mediaLabel(media, content)}</span>
          </button>
        );
      })}
    </div>
  </div>
);

const MediaUsageList = ({ mediaId, content }: { readonly mediaId: string; readonly content: ContentSnapshot }) => {
  const usages = getMediaUsage(mediaId, content);

  if (usages.length === 0) {
    return <span className="usage-empty">עדיין לא מחובר לשום אזור באתר</span>;
  }

  return (
    <div className="usage-chips" aria-label="מפת שימושים לתמונה">
      {usages.map((usage) => (
        <span className={usage.active ? 'usage-chip is-active' : 'usage-chip'} key={`${usage.kind}-${usage.title}`}>
          {usageKindLabel(usage.kind)}: {usage.title}
          {!usage.active ? ' (כבוי)' : ''}
        </span>
      ))}
    </div>
  );
};

const MediaSelectionUsageNotice = ({
  mediaId,
  content,
  currentUsage,
}: {
  readonly mediaId: string;
  readonly content: ContentSnapshot;
  readonly currentUsage: Pick<MediaUsageEntry, 'kind' | 'id'>;
}) => {
  const otherUsages = getMediaUsage(mediaId, content).filter((usage) => usage.kind !== currentUsage.kind || usage.id !== currentUsage.id);
  const activeOtherUsages = otherUsages.filter((usage) => usage.active);

  return (
    <div className={activeOtherUsages.length > 0 ? 'media-selection-usage has-risk' : 'media-selection-usage'}>
      <strong>התמונה הזאת מחוברת גם ל...</strong>
      {otherUsages.length > 0 ? (
        <div className="usage-chips" aria-label="שימושים נוספים לתמונה">
          {otherUsages.map((usage) => (
            <span className={usage.active ? 'usage-chip is-active' : 'usage-chip'} key={`${usage.kind}-${usage.id}`}>
              {usageKindLabel(usage.kind)}: {usage.title}
              {!usage.active ? ' (כבוי)' : ''}
            </span>
          ))}
        </div>
      ) : (
        <span className="usage-empty">אין שימוש נוסף לתמונה הזאת כרגע.</span>
      )}
      {activeOtherUsages.length > 0 && (
        <span className="selection-risk-text">
          <AlertTriangle aria-hidden="true" />
          החלפה או שינוי מקור ישפיעו גם על המקומות הפעילים שמסומנים כאן.
        </span>
      )}
    </div>
  );
};

const MediaRiskNotice = ({ mediaId, content }: { readonly mediaId: string; readonly content: ContentSnapshot }) => {
  const activeUsages = getMediaUsage(mediaId, content).filter((usage) => usage.active);

  if (activeUsages.length === 0) {
    return null;
  }

  return (
    <div className="media-risk-notice" role="note">
      <AlertTriangle aria-hidden="true" />
      <span>לפני ארכוב או החלפה: התמונה מוצגת עכשיו באתר. שינוי ישפיע על {activeUsages.length} מקום/ות.</span>
    </div>
  );
};

const TextInput = ({ value, onChange, placeholder }: { readonly value: string; readonly onChange: (value: string) => void; readonly placeholder?: string }) => (
  <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
);

const NumberInput = ({ value, onChange }: { readonly value: number; readonly onChange: (value: number) => void }) => (
  <input type="number" value={value} min={0} onChange={(event) => onChange(Number(event.target.value))} />
);

const validationErrorText = (
  validation: ReturnType<typeof contentSnapshotSchema.safeParse>,
  referenceIssues: readonly string[],
) => {
  if (!validation.success) {
    const issue = validation.error.issues[0];
    return issue ? formatValidationIssue(issue) : 'יש שדות שצריך לתקן.';
  }
  return referenceIssues[0] ?? 'יש שדות שצריך לתקן.';
};

// Exported for validation-message coverage.
// eslint-disable-next-line react-refresh/only-export-components
export const formatValidationIssue = (issue: { readonly path: readonly PropertyKey[]; readonly message: string }) => {
  const path = issue.path.length > 0 ? issue.path.map(String).join('.') : 'התוכן הכללי';
  const message = issue.message === 'Invalid input' ? 'ערך לא תקין' : issue.message;
  return `שדה לא תקין: ${path} - ${message}`;
};

// Exported for the UX coverage test that keeps the editing flow understandable.
// eslint-disable-next-line react-refresh/only-export-components
export const getStudioWorkflowSteps = (
  activeView: ActiveView,
  publishState: PublishState,
  hasErrors: boolean,
  hasPublishUrl: boolean,
): readonly StudioWorkflowStep[] => {
  if (hasErrors) {
    return [
      { step: '1', title: 'עריכה', text: 'יש שדה שצריך לתקן', state: 'error' },
      { step: '2', title: 'תצוגה מקדימה', text: 'אפשר לבדוק מה השתנה', state: activeView === 'site-map' ? 'pending' : 'active' },
      { step: '3', title: 'שמירת טיוטה', text: 'חסום עד שהתוכן תקין', state: 'blocked' },
      { step: '4', title: 'עדכון האתר', text: 'חסום עד שאין שגיאות', state: 'blocked' },
    ];
  }

  const isEditingView = activeView !== 'site-map' && activeView !== 'publish';
  const isPublishView = activeView === 'publish' || publishState === 'publishing' || publishState === 'checking' || publishState === 'published' || publishState === 'live';
  const isSaved = publishState === 'draft' || publishState === 'publishing' || publishState === 'checking' || publishState === 'published' || publishState === 'live';
  const saveIsActive = publishState === 'saving';
  const publishIsActive = publishState === 'publishing' || publishState === 'checking' || publishState === 'published';

  return [
    {
      step: '1',
      title: 'עריכה',
      text: isEditingView ? 'כותבים ומשנים את האזור הנוכחי' : 'בחרו אזור לעריכה',
      state: isEditingView ? 'active' : isSaved || isPublishView ? 'done' : 'pending',
    },
    {
      step: '2',
      title: 'תצוגה מקדימה',
      text: isEditingView ? 'בדקו מחשב ומובייל לפני שמירה' : 'נפתחת בתוך כל מסך עריכה',
      state: isEditingView ? 'active' : isSaved || isPublishView ? 'done' : 'pending',
    },
    {
      step: '3',
      title: 'שמירת טיוטה',
      text: saveIsActive ? 'שומר עכשיו ל-Google Sheets' : isSaved ? 'הטיוטה נשמרה' : 'שומר ל-Sheets בלי לשנות את האתר',
      state: saveIsActive ? 'active' : isSaved ? 'done' : 'pending',
    },
    {
      step: '4',
      title: 'עדכון האתר',
      text: !hasPublishUrl ? 'חסר חיבור פרסום מאובטח' : publishState === 'live' ? 'האתר החי עודכן' : publishIsActive ? 'הענן בונה ובודק גרסה חיה' : 'מפרסם רק אחרי שמירה ובדיקה',
      state: !hasPublishUrl ? 'blocked' : publishState === 'live' ? 'done' : publishIsActive ? 'active' : isPublishView ? 'active' : 'pending',
    },
  ];
};

// Exported for the owner verification coverage test.
// eslint-disable-next-line react-refresh/only-export-components
export const getOwnerVerificationChecklist = (
  publishState: PublishState,
  hasErrors: boolean,
  hasPublishUrl: boolean,
): readonly OwnerVerificationItem[] => {
  const hasSavedDraft = publishState === 'draft' || publishState === 'publishing' || publishState === 'checking' || publishState === 'published' || publishState === 'live';
  const isPublishing = publishState === 'publishing' || publishState === 'checking' || publishState === 'published';
  const isLive = publishState === 'live';

  if (hasErrors) {
    return [
      { title: 'Login מורשה', text: 'המסך הזה מופיע רק אחרי כניסה מורשית לסטודיו.', state: 'done' },
      { title: 'שמירה אמיתית ל-Sheets', text: 'חסום עד שמתקנים את שגיאת התוכן שמופיעה למעלה.', state: 'blocked' },
      { title: 'פרסום אמיתי', text: 'חסום עד שהתוכן תקין ואפשר לשמור.', state: 'blocked' },
      { title: 'בדיקת האתר החי', text: 'תתבצע אחרי פרסום מוצלח.', state: 'pending' },
      { title: 'Refresh ושחזור Session', text: 'אחרי Login, לרענן את הדף ולוודא שנשארים מחוברים.', state: 'pending' },
    ];
  }

  if (!hasPublishUrl) {
    return [
      { title: 'Login מורשה', text: 'המסך הזה מופיע רק אחרי כניסה מורשית לסטודיו.', state: 'done' },
      { title: 'שמירה אמיתית ל-Sheets', text: hasSavedDraft ? 'טיוטה נשמרה ל-Sheets.' : 'לחצו שמור כטיוטה אחרי שינוי קטן ומכוון.', state: hasSavedDraft ? 'done' : 'pending' },
      { title: 'פרסום אמיתי', text: 'חסר חיבור פרסום מאובטח, לכן אי אפשר להפעיל עדכון אתר.', state: 'blocked' },
      { title: 'בדיקת האתר החי', text: 'מחכה לחיבור פרסום.', state: 'pending' },
      { title: 'Refresh ושחזור Session', text: 'אחרי Login, לרענן את הדף ולוודא שנשארים מחוברים.', state: 'pending' },
    ];
  }

  return [
    { title: 'Login מורשה', text: 'המסך הזה מופיע רק אחרי כניסה מורשית לסטודיו.', state: 'done' },
    { title: 'שמירה אמיתית ל-Sheets', text: hasSavedDraft ? 'טיוטה נשמרה ל-Sheets.' : 'לחצו שמור כטיוטה אחרי שינוי קטן ומכוון.', state: hasSavedDraft ? 'done' : 'pending' },
    {
      title: 'פרסום אמיתי',
      text: isLive ? 'הפרסום הסתיים והסטודיו זיהה את הגרסה באתר החי.' : isPublishing ? 'הפרסום נשלח והסטודיו עוקב אחרי האתר החי.' : 'לחצו עדכן אתר רק אחרי שמירה ובדיקת preview.',
      state: isLive ? 'done' : isPublishing ? 'active' : 'pending',
    },
    {
      title: 'בדיקת האתר החי',
      text: isLive ? 'לפתוח את האתר ולוודא שהשינוי נראה גם ללקוח.' : isPublishing ? 'מחכה שהאתר החי יגיש את הגרסה החדשה.' : 'ייפתח אחרי פרסום אמיתי.',
      state: isLive ? 'done' : isPublishing ? 'active' : 'pending',
    },
    { title: 'Refresh ושחזור Session', text: 'אחרי Login, לרענן את הדף ולוודא שנשארים מחוברים.', state: 'pending' },
  ];
};

const getPublishSteps = (
  publishState: PublishState,
  hasErrors: boolean,
  hasPublishUrl: boolean,
): readonly { readonly step: string; readonly title: string; readonly text: string; readonly state: PublishStepState }[] => {
  if (hasErrors) {
    return [
      { step: '1', title: 'בדיקת שגיאות', text: 'צריך לתקן לפני פרסום', state: 'error' },
      { step: '2', title: 'שמירה', text: 'מחכה לתיקון', state: 'blocked' },
      { step: '3', title: 'שליחה לפרסום', text: 'חסום עד שהתוכן תקין', state: 'blocked' },
      { step: '4', title: 'בנייה בענן', text: 'עוד לא התחילה', state: 'pending' },
      { step: '5', title: 'האתר החי', text: 'עוד לא עודכן', state: 'pending' },
    ];
  }

  if (!hasPublishUrl) {
    return [
      { step: '1', title: 'בדיקת שגיאות', text: 'התוכן תקין לפרסום', state: 'done' },
      { step: '2', title: 'שמירה ב-Sheets', text: 'אפשר לשמור טיוטה', state: publishState === 'saving' ? 'active' : 'pending' },
      { step: '3', title: 'שליחה לפרסום', text: 'חסר חיבור פרסום מאובטח', state: 'blocked' },
      { step: '4', title: 'Cloudflare בונה', text: 'מחכה לחיבור פרסום', state: 'pending' },
      { step: '5', title: 'האתר החי', text: 'עוד לא עודכן', state: 'pending' },
    ];
  }

  const done = (states: readonly PublishState[]) => states.includes(publishState);
  const active = (state: PublishState) => publishState === state;

  return [
    { step: '1', title: 'בדיקת שגיאות', text: 'התוכן תקין לפרסום', state: 'done' },
    {
      step: '2',
      title: 'שמירה ב-Sheets',
      text: active('saving') ? 'שומר עכשיו' : done(['draft', 'publishing', 'checking', 'published', 'live']) ? 'נשמר' : 'מוכן לשמירה',
      state: active('saving') ? 'active' : done(['draft', 'publishing', 'checking', 'published', 'live']) ? 'done' : 'pending',
    },
    {
      step: '3',
      title: 'שליחה לפרסום',
      text: active('publishing') ? 'שולח לשרת הפרסום' : done(['checking', 'published', 'live']) ? 'נשלח' : 'יחכה ללחיצה',
      state: active('publishing') ? 'active' : done(['checking', 'published', 'live']) ? 'done' : 'pending',
    },
    {
      step: '4',
      title: 'Cloudflare בונה',
      text: done(['published']) ? 'נשלח ומחכה לבנייה' : active('checking') ? 'בודק אם הגרסה כבר עלתה' : done(['live']) ? 'הסתיים' : 'יתחיל אחרי שליחה',
      state: done(['published']) || active('checking') ? 'active' : done(['live']) ? 'done' : 'pending',
    },
    {
      step: '5',
      title: 'האתר החי',
      text: active('live') ? 'הגרסה החדשה באוויר' : 'מחכה לגרסה החדשה',
      state: active('live') ? 'done' : 'pending',
    },
  ];
};

const formatPublishTime = (isoDate: string) =>
  new Intl.DateTimeFormat('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(isoDate));

const getBundleFileName = (bundleUrl: string) => {
  try {
    return new URL(bundleUrl).pathname.split('/').at(-1) ?? bundleUrl;
  } catch {
    return bundleUrl;
  }
};

const getDriveFileViewUrl = (fileId: string) => `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`;

const shortSourceId = (sourceId: string) => {
  if (sourceId.length <= 12) {
    return sourceId;
  }
  return `${sourceId.slice(0, 6)}...${sourceId.slice(-4)}`;
};

const wait = (milliseconds: number) => new Promise((resolve) => {
  window.setTimeout(resolve, milliseconds);
});

const fetchPublicText = async (url: string) => {
  const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}nis_check=${Date.now()}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Could not read ${url}`);
  }
  return response.text();
};

const findBundleUrl = (html: string) => {
  const match = html.match(/<script[^>]+src="([^"]*assets\/index-[^"]+\.js)"/);
  return match ? new URL(match[1] ?? '', publicSiteOrigin).href : null;
};

const isLiveSiteVersion = async (version: string): Promise<LiveVersionCheckResult> => {
  const html = await fetchPublicText(`${publicSiteOrigin}/`);
  const bundleUrl = findBundleUrl(html);
  if (!bundleUrl) {
    return { live: false };
  }

  const bundle = await fetchPublicText(bundleUrl);
  return {
    live: bundle.includes(version) || bundle.includes(JSON.stringify(version)),
    bundleUrl,
  };
};

const waitForLiveSiteVersion = async (
  version: string,
  onProgress: (progress: {
    readonly attempt: number;
    readonly totalAttempts: number;
    readonly checkedAt: string;
    readonly bundleUrl?: string;
    readonly message: string;
  }) => void,
) => {
  for (let attempt = 1; attempt <= liveVersionPollAttempts; attempt += 1) {
    const checkedAt = new Date().toISOString();
    const result = await isLiveSiteVersion(version);
    if (result.live) {
      onProgress({
        attempt,
        totalAttempts: liveVersionPollAttempts,
        checkedAt,
        bundleUrl: result.bundleUrl,
        message: `האתר החי כבר מגיש את גרסת ${version}.`,
      });
      return {
        attempt,
        totalAttempts: liveVersionPollAttempts,
        checkedAt,
        bundleUrl: result.bundleUrl,
      };
    }

    if (attempt < liveVersionPollAttempts) {
      onProgress({
        attempt,
        totalAttempts: liveVersionPollAttempts,
        checkedAt,
        bundleUrl: result.bundleUrl,
        message: `Cloudflare עדיין בונה או מפיץ את גרסת ${version}. בדיקה ${attempt}/${liveVersionPollAttempts}; נבדוק שוב בעוד ${Math.round(liveVersionPollDelayMs / 1000)} שניות.`,
      });
      await wait(liveVersionPollDelayMs);
    }
  }

  throw new Error(`הפרסום נשלח, אבל אחרי ${liveVersionPollAttempts} בדיקות במשך בערך ${Math.round((liveVersionPollAttempts * liveVersionPollDelayMs) / 60000)} דקות הסטודיו עדיין לא רואה את גרסת ${version} באתר החי. לרוב זה אומר ש-Cloudflare עדיין בונה, או שהפרסום נכשל בשרת הפרסום.`);
};

const getMediaUsage = (mediaId: string, content: ContentSnapshot): readonly MediaUsageEntry[] => {
  const heroMedia = content.sections.find((section) => section.id === 'hero-media' && !section.deletedAt);
  const heroUsage = heroMedia
    ? heroMediaSlots
      .filter((_, index) => heroMediaIdAt(heroMedia, index) === mediaId)
      .map((slot): MediaUsageEntry => ({ kind: 'hero', id: slot.key, title: slot.label, active: heroMedia.active }))
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

const usageKindLabel = (kind: MediaUsageKind) => {
  if (kind === 'gallery') return 'גלריה';
  if (kind === 'service') return 'שירות';
  if (kind === 'manifesto') return 'השפה של Nis';
  return 'מסך פתיחה';
};

const getGalleryItemForMedia = (mediaId: string, content: ContentSnapshot) => (
  content.gallery.find((item) => item.mediaId === mediaId && !item.deletedAt) ?? null
);

const formatMediaUsage = (usages: readonly MediaUsageEntry[]) => usages
  .map((usage) => `- ${usageKindLabel(usage.kind)}: ${usage.title}`)
  .join('\n');

const makeGalleryItem = (content: ContentSnapshot, mediaId?: string): GalleryItemRecord => {
  const media = mediaId ? content.media.find((item) => item.id === mediaId) : undefined;
  const title = media ? mediaLabel(media, content) : 'תמונה חדשה';

  return {
    id: `gallery-${content.gallery.length + 1}`,
    title,
    alt: media ? `תיאור נגיש עבור ${title}` : 'תיאור נגיש לתמונה חדשה',
    category: 'trays',
    order: content.gallery.length + 1,
    active: Boolean(media),
    tall: false,
    mediaId: media?.id ?? content.media.find((item) => !item.deletedAt)?.id ?? '',
  };
};

const mediaLabel = (media: ImageAssetRecord, content: ContentSnapshot) => {
  const firstGallery = content.gallery.find((item) => item.mediaId === media.id && !item.deletedAt);
  const firstService = content.services.find((service) => service.mediaId === media.id && !service.deletedAt);
  return firstGallery?.title ?? firstService?.title ?? media.id;
};

const mediaStatus = (media: ImageAssetRecord, content: ContentSnapshot) => {
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

const areaStatus = (area: ActiveView, content: ContentSnapshot) => {
  if (area === 'hero') {
    const hero = content.sections.find((section) => section.id === 'hero' || section.group === 'hero');
    return hero?.active && !hero.deletedAt ? 'פעיל באתר' : 'כבוי או חסר';
  }
  if (['intro-band', 'experience-lab', 'real-media', 'booking-basics', 'seo'].includes(area)) {
    const copySection = getManagedCopySection(content, area);
    return copySection?.active ? 'פעיל באתר' : 'כבוי או חסר';
  }
  if (area === 'services') {
    return `${content.services.filter((service) => service.active && !service.deletedAt).length} שירותים פעילים`;
  }
  if (area === 'gallery') {
    return `${content.gallery.filter((item) => item.active && !item.deletedAt).length} תמונות פעילות`;
  }
  if (area === 'media') {
    return `${content.media.filter((media) => !media.deletedAt).length} תמונות בספרייה`;
  }
  if (area === 'contact') {
    return content.settings.phoneDisplay ? `וואטסאפ ${content.settings.phoneDisplay}` : 'חסר טלפון';
  }
  if (area === 'publish') {
    return 'מוכן לבדיקה ופרסום';
  }
  const group = area;
  const activeCount = content.sections.filter((section) => section.group === group && section.active && !section.deletedAt).length;
  return activeCount > 0 ? `${activeCount} פריטים פעילים` : 'עדיין לא מנוהל מהסטודיו';
};
