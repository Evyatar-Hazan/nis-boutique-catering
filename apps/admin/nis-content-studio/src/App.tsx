import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type CSSProperties, type ReactNode } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  AlertTriangle,
  ChefHat,
  CheckCircle2,
  Cloud,
  Copy,
  Eye,
  FileText,
  HeartHandshake,
  HelpCircle,
  Home,
  ImagePlus,
  Images,
  ListChecks,
  Lock,
  LogIn,
  MessageCircle,
  MonitorCheck,
  PanelRightClose,
  PanelRightOpen,
  Phone,
  Plus,
  Package,
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
  Utensils,
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

type ActiveView =
  | 'site-map'
  | 'hero'
  | 'contact'
  | 'editorial'
  | 'manifesto'
  | 'services'
  | 'site-copy'
  | 'site-microcopy'
  | 'audience'
  | 'boutique'
  | 'signature'
  | 'process'
  | 'story'
  | 'samples'
  | 'coordination'
  | 'gallery'
  | 'trust'
  | 'faq'
  | 'media'
  | 'publish';
type AuthState = 'signed-out' | 'loading' | 'authorized' | 'denied';
type PublishState = 'clean' | 'draft' | 'saving' | 'publishing' | 'checking' | 'published' | 'live' | 'error';
type PreviewDevice = 'desktop' | 'mobile';
type MediaUsageKind = 'gallery' | 'service';
type PublishStepState = 'done' | 'active' | 'pending' | 'blocked' | 'error';
type GalleryPreviewCategory = GalleryItemRecord['category'] | 'all';

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
const heroBackgroundImage = '/media/food/events/quiche-tart-clean.webp';
const heroPrimaryImage = '/media/food/events/salmon-skewers-lemon.webp';
const heroSideImage = '/media/food/events/dips-tray-close.webp';
const heroTallImage = '/media/food/events/table-setting-blue-gold.webp';

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
  facts: 'נתונים',
  'hero-notes': 'נקודות Hero',
  'hero-marquee': 'טקסט רץ Hero',
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

const managedSectionDefaults: readonly SectionBlockRecord[] = [
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
  makeCopySection('details', 'שומרים על ציפיות ברורות כבר מהשיחה הראשונה.', undefined, 'פרטים שחשוב לדעת', 15),
  makeCopySection('booking-basics', 'כל מה שצריך לדעת כדי לשלוח פנייה בלי להתלבט.', 'מספיק לדעת מה סוג האירוח, בערך כמה סועדים ומה התאריך הרצוי. משם אפשר לדייק יחד את התפריט, ההגשה ואופן הקבלה.', 'לפני שפונים', 16),
  makeCopySection('seo', 'קייטרינג בוטיק מביתר עילית לשבת, אירוח קטן ומארזים לדרך.', 'Nis נותנת מענה למי שמחפש קייטרינג בוטיק בביתר עילית והסביבה: תפריט שבת מוכן, מגשי אירוח לאירועים קטנים, פינגר פוד, בראנץ׳ משפחתי ומארזי פיקניק או דרך. כל פנייה מתחילה בשיחה קצרה כדי להבין את סוג האירוח, כמות הסועדים, התאריך והתחושה שרוצים ליצור.', 'מה אפשר להזמין', 17),
  makeCopySection('trust', 'פחות סימני שאלה, יותר תחושה שיש עם מי לדבר.', undefined, 'מה מרגיע לפני שסוגרים', 18),
  makeCopySection('faq', 'התשובות שמקלות על הפנייה הראשונה.', undefined, 'שאלות נפוצות', 19),
  makeCopySection('contact', 'אהבתם את הסגנון? שלחו פנייה מסודרת לוואטסאפ.', 'הטופס נשאר קצר ומעשי: סוג הזמנה, תאריך, כמות והערה. אחרי השליחה נפתחת הודעת וואטסאפ מוכנה, כדי שיהיה קל להמשיך לשיחה אישית.', 'יצירת קשר', 20, 'שיחה קצרה, התאמה אישית, ואז סיכום ברור של תאריך, כמות וסגנון אירוח.'),
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
  makeSection('facts', 'facts', 'פרטים שחשוב לדעת', undefined, ['אזור פעילות: ביתר עילית והסביבה, בתיאום לפי תאריך ומיקום.', 'להזמנות שבת ואירועים מומלץ לפנות מוקדם ככל האפשר.', 'כל הזמנה מקבלת הצעה מותאמת אחרי שיחה קצרה והבנת הצורך.', 'אפשר לדבר על העדפות, רגישויות והתאמות תפריט לפי הצורך.'], 1),
  makeSection('editorial-shabbat', 'editorial', 'אוכל ביתי מוקפד לשבת שנכנסת ברוגע', 'תפריטי שבת עשירים, מסודרים ויפים להגשה, כדי שהבית ירגיש מלא בלי שכל העומס יישב עליכם.', ['שבתות', 'ChefHat'], 1),
  makeSection('editorial-events', 'editorial', 'שולחן שנפתח יפה ומייצר רושם כבר בדקה הראשונה', 'מגשי אירוח, פינגר פוד ושולחנות קטנים עם הגשה אסתטית שמתאימה למשפחה, מפגש או אירוח עסקי.', ['אירועים קטנים', 'Sparkles'], 2),
  makeSection('editorial-travel', 'editorial', 'Travel Nis לפינוקים שלוקחים אתכם הלאה', 'מארזים נוחים, חכמים ויפים לנסיעות, טיולים וימי כיף, כך שהחוויה מתחילה כבר בדרך.', ['מארזים ודרך', 'Gift'], 3),
  makeSection('manifesto-table', 'manifesto', 'שולחן שנראה מסודר עוד לפני שנוגעים בו', 'ההגשה, הצבעים והקצב של השולחן הם חלק מהחוויה, לא רק הרקע של האוכל.', ['01'], 1),
  makeSection('manifesto-home', 'manifesto', 'אוכל שמרגיש ביתי, אבל לא יומיומי', 'הטעם נשאר חם ומוכר, אבל ההופעה, האריזה והדיוק נותנים תחושת occasion.', ['02'], 2),
  makeSection('manifesto-custom', 'manifesto', 'התאמה אישית במקום פס ייצור', 'החוויה נבנית סביב האירוח שלכם, לא סביב קטלוג אחיד שצריך להסתדר איתו.', ['03'], 3),
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
  makeSection('hero-note-ready', 'hero-notes', 'אירוח מוכן להגשה', 'כל מגש מגיע מסודר כך שהשולחן נראה נכון כבר מהרגע הראשון.', [], 1),
  makeSection('hero-note-custom', 'hero-notes', 'שיחה קצרה, התאמה אישית', 'מספר סועדים, סוג האירוח והאווירה שאתם רוצים יוצרים יחד את הכיוון.', [], 2),
  makeSection('hero-marquee', 'hero-marquee', 'טקסט רץ במסך הפתיחה', undefined, ['שולחן שנפתח יפה', 'אוכל ביתי מוקפד', 'מגשי אירוח אלגנטיים', 'Travel Nis', 'ביתר עילית', 'אריזה שנראית כמו מותג'], 1),
];

const ensureManagedSections = (snapshot: ContentSnapshot): ContentSnapshot => {
  const existingIds = new Set(snapshot.sections.map((section) => section.id));
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
    help: 'כותרת גדולה, משפט הסבר וכפתור וואטסאפ ראשי.',
    icon: <Home aria-hidden="true" />,
  },
  {
    id: 'contact',
    title: 'תפריט עליון ויצירת קשר',
    location: 'כפתורי וואטסאפ, טלפון, אימייל ופרטי קשר',
    help: 'כל שינוי כאן משפיע על דרכי הפנייה באתר.',
    icon: <Phone aria-hidden="true" />,
  },
  {
    id: 'services',
    title: 'מה מזמינים',
    location: 'כרטיסי השירות המרכזיים בעמוד',
    help: 'שבת, אירועים, Travel Nis וכל שירות נוסף שתוסיפו.',
    icon: <Sparkles aria-hidden="true" />,
  },
  {
    id: 'site-copy',
    title: 'טקסטי מעטפת',
    location: 'כותרות ופתיחים של כל אזורי האתר',
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
    id: 'editorial',
    title: 'קטגוריות פתיחה',
    location: 'שלושת הכרטיסים הראשונים שמסבירים מה מזמינים',
    help: 'שבתות, אירועים קטנים ו-Travel Nis לפני אזור השירותים המלא.',
    icon: <FileText aria-hidden="true" />,
  },
  {
    id: 'manifesto',
    title: 'השפה של Nis',
    location: 'אזור שמסביר את תחושת הבוטיק וההגשה',
    help: 'כרטיסים עם מסר רגשי ותמונות, לפני הפירוט המעשי.',
    icon: <Wand2 aria-hidden="true" />,
  },
  {
    id: 'audience',
    title: 'למי זה מתאים',
    location: 'כרטיסי קהל יעד והסברים קצרים',
    help: 'מי אמור להבין מיד שהשירות מתאים לו.',
    icon: <Users aria-hidden="true" />,
  },
  {
    id: 'boutique',
    title: 'למה זה בוטיק',
    location: 'נקודות שמסבירות את הערך והיחס האישי',
    help: 'כרטיסי הסבר קצרים שעוזרים ללקוח להבין למה זה מרגיש מוקפד.',
    icon: <Sparkles aria-hidden="true" />,
  },
  {
    id: 'signature',
    title: 'רגעי בוטיק',
    location: 'כרטיסי תמונה וטקסט שמדגישים פרטים קטנים',
    help: 'שלושה רגעים ויזואליים שמחזקים את תחושת המותג.',
    icon: <Images aria-hidden="true" />,
  },
  {
    id: 'process',
    title: 'איך זה עובד',
    location: 'רשימת השלבים מהפנייה ועד קבלת האוכל',
    help: 'אפשר להוסיף, לכבות ולסדר שלבים.',
    icon: <ListChecks aria-hidden="true" />,
  },
  {
    id: 'story',
    title: 'הסיפור של המותג',
    location: 'אזור הסיפור האישי של Nis',
    help: 'תחנות קצרות שמספרות מאיפה המותג מגיע ומה הוא מביא לשולחן.',
    icon: <Home aria-hidden="true" />,
  },
  {
    id: 'samples',
    title: 'כיוונים להזמנה',
    location: 'דוגמאות תפריט וכיווני שיחה',
    help: 'לא מחירים ולא תפריט קשיח, אלא כיוונים שאפשר לערוך ולהציג.',
    icon: <ListChecks aria-hidden="true" />,
  },
  {
    id: 'coordination',
    title: 'תיאום וזמינות',
    location: 'פרטים שעוזרים ללקוח להבין איך מתקדמים',
    help: 'אזור פעילות, זמן פנייה, הצעת מחיר ואישור תפריט.',
    icon: <Phone aria-hidden="true" />,
  },
  {
    id: 'gallery',
    title: 'תמונות וגלריה',
    location: 'כל התמונות בדרייב ומה מתוכן מוצג באתר',
    help: 'כאן מנהלים גם את מאגר התמונות וגם את הגלריה הציבורית במקום אחד.',
    icon: <Images aria-hidden="true" />,
  },
  {
    id: 'trust',
    title: 'אמון ועובדות',
    location: 'נקודות שמרגיעות לפני פנייה',
    help: 'כרטיסי אמון, עובדות קצרות והבטחות שירות.',
    icon: <ShieldCheck aria-hidden="true" />,
  },
  {
    id: 'faq',
    title: 'שאלות ותשובות',
    location: 'אזור השאלות בתחתית האתר',
    help: 'כל שאלה היא כרטיס שאפשר להוסיף, לכבות או לארכב.',
    icon: <HelpCircle aria-hidden="true" />,
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
    help: 'הירו, שירותים, שאלות, אמון וכל הטקסטים שהלקוח רואה.',
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

  const markDraft = () => {
    if (authState === 'authorized') {
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
      setIsBusy(true);
      setStatus('מעדכנים את האתר...');
      try {
        await saveDraft();
        setPublishState('publishing');
        setStatus('הטיוטה נשמרה. שולחים את הפרסום ל-Cloudflare דרך השרת המאובטח.');
        const accessToken = await getFreshAccessToken();
        await triggerPublish(accessToken);

        setPublishState('checking');
        setStatus(`הפרסום נשלח. Cloudflare בונה עכשיו את גרסת ${targetVersion}; הסטודיו בודק מתי האתר החי מגיש אותה.`);
        setIsBusy(false);
        await waitForLiveSiteVersion(targetVersion, (message) => {
          setPublishState('checking');
          setStatus(message);
        });
        setPublishState('live');
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
            accessToken={session.accessToken}
            previewDevice={previewDevice}
            onPreviewDeviceChange={setPreviewDevice}
            updateSection={updateSection}
            addSection={addSection}
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
              <Field label="גרסת תוכן אוטומטית" help="מתעדכן לבד בכל שינוי. משתמשים בזה כדי לדעת שהפרסום האחרון באמת עלה.">
                <TextInput value={content.settings.siteVersion} onChange={(value) => updateContent((current) => ({ ...current, settings: { ...current.settings, siteVersion: value } }))} />
              </Field>
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
              <ContactPreview content={content} device={previewDevice} />
              <PublishPanel
                content={content}
                hasErrors={hasErrors}
                status={hasErrors ? validationErrorText(validation, referenceIssues) : status}
                publishState={publishState}
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
              <ServicesPreview content={content} mediaById={mediaById} accessToken={session.accessToken} device={previewDevice} />
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
            <GallerySitePreview content={content} mediaById={mediaById} accessToken={session.accessToken} device={previewDevice} />
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

        {activeView === 'audience' && (
          <SectionGroupEditor
            title="למי זה מתאים"
            text="כרטיסים שמסבירים למבקר באתר אם השירות מתאים לו. אם עדיין אין כאלה ב-Sheets, אפשר להוסיף כאן."
            group="audience"
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
          <SectionGroupEditor
            title="השפה של Nis"
            text="האזור שמסביר את תחושת הבוטיק: נראות, ביתיות והתאמה אישית. נקודה ראשונה יכולה להיות מספר כמו 01."
            group="manifesto"
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

        {activeView === 'boutique' && (
          <SectionGroupEditor
            title="למה זה בוטיק"
            text="כרטיסים קצרים שמסבירים את הערך: התאמה, נראות, יחס אישי וטעם ביתי."
            group="boutique"
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

        {activeView === 'trust' && (
          <SectionGroupEditor
            title="אמון ועובדות"
            text="נקודות שמרגיעות לקוח לפני שהוא פונה: זמינות, התאמה אישית, אזור פעילות ועוד."
            group="trust"
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
                    <Field label="שם תמונה בסטודיו" help="שם קצר באנגלית שמזהה את התמונה במערכת.">
                      <TextInput value={media.id} onChange={(value) => renameMedia(media.id, value)} />
                    </Field>
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
                      <summary>מקור טכני</summary>
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
    <PanelHeader title="מפת האתר" text="בחרו אזור באתר. כל כרטיס מסביר איפה השינוי יופיע ומה אפשר לעשות שם." />
    <div className="site-map-grid">
      {areaDefinitions.map((area) => (
        <article className="site-area-card" key={area.id}>
          <div className="site-area-icon">{area.icon}</div>
          <div>
            <p className="kicker">{area.location}</p>
            <h3>{area.title}</h3>
            <p>{area.help}</p>
          </div>
          <AreaMiniPreview area={area.id} content={content} mediaById={mediaById} />
          <div className="area-status-row">
            <span>{areaStatus(area.id, content)}</span>
            <button className="compact-button" onClick={() => onOpen(area.id)}>עריכה</button>
          </div>
        </article>
      ))}
    </div>
  </section>
);

const AreaMiniPreview = ({
  area,
  content,
  mediaById,
}: {
  readonly area: ActiveView;
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
}) => {
  if (area === 'gallery') {
    const item = content.gallery.find((galleryItem) => galleryItem.active && !galleryItem.deletedAt);
    const media = item ? mediaById.get(item.mediaId) : undefined;
    return <div className="area-mini-preview">{media ? <img src={publicAssetSrcFor(media.src)} alt="" /> : <span>עדיין אין תמונה פעילה</span>}</div>;
  }

  if (area === 'services') {
    const service = content.services.find((item) => item.active && !item.deletedAt);
    return (
      <div className="area-mini-preview text-preview">
        <strong>{service?.title ?? 'אין שירות פעיל'}</strong>
        <span>{service?.description ?? 'הוסיפו או הפעילו שירות כדי שיופיע באתר.'}</span>
      </div>
    );
  }

  if (area === 'hero') {
    const hero = content.sections.find((section) => section.id === 'hero' && !section.deletedAt);
    return (
      <div className="area-mini-preview text-preview">
        <strong>{hero?.title ?? 'כותרת מסך פתיחה'}</strong>
        <span>{hero?.text ?? 'הטקסט הראשון שהלקוח רואה באתר.'}</span>
      </div>
    );
  }

  return (
    <div className="area-mini-preview text-preview">
      <strong>{areaStatus(area, content)}</strong>
      <span>לחצו עריכה כדי לראות ולשנות את האזור.</span>
    </div>
  );
};

const HeroEditor = ({
  content,
  mediaById,
  accessToken,
  previewDevice,
  onPreviewDeviceChange,
  updateSection,
  addSection,
}: {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly accessToken: string;
  readonly previewDevice: PreviewDevice;
  readonly onPreviewDeviceChange: (device: PreviewDevice) => void;
  readonly updateSection: (id: string, patch: Partial<SectionBlockRecord>) => void;
  readonly addSection: (group?: string) => void;
}) => {
  const hero = content.sections.find((section) => section.id === 'hero') ?? content.sections.find((section) => section.group === 'hero');

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
        <Field label="כותרת גדולה" help="מופיעה במרכז המסך הראשון. אפשר לרדת שורה עם Enter.">
          <textarea value={hero.title ?? ''} onChange={(event) => updateSection(hero.id, { title: event.target.value || undefined })} />
        </Field>
        <Field label="טקסט מתחת לכותרת" help="משפט שמסביר למה לפנות ומה מקבלים.">
          <textarea value={hero.text ?? ''} onChange={(event) => updateSection(hero.id, { text: event.target.value || undefined })} />
        </Field>
        <Field label="שורות קטנות במסך הפתיחה" help="הפריט הראשון הוא טקסט מעל הכותרת. השני הוא משפט מודגש קצר. מפרידים עם |">
          <TextInput value={joinPipeList(hero.items)} onChange={(value) => updateSection(hero.id, { items: splitPipeList(value) })} />
        </Field>
      </div>
      <div className="preview-column">
        <PreviewHeader
          title="תצוגה מקדימה כמו באתר"
          text="אפשר לעבור בין מחשב למובייל ולראות איך מסך הפתיחה ירגיש ללקוח."
          device={previewDevice}
          onDeviceChange={onPreviewDeviceChange}
        />
        <HeroSitePreview content={content} hero={hero} device={previewDevice} accessToken={accessToken} mediaById={mediaById} />
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
  accessToken,
  mediaById,
}: {
  readonly content: ContentSnapshot;
  readonly hero: SectionBlockRecord;
  readonly device: PreviewDevice;
  readonly accessToken: string;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
}) => {
  const heroNotes = content.sections
    .filter((section) => section.group === 'hero-notes' && section.active && !section.deletedAt)
    .sort((left, right) => left.order - right.order)
    .slice(0, 2);
  const primaryServiceMedia = content.services[0] ? mediaById.get(content.services[0].mediaId) : undefined;
  const title = hero.title ?? 'קייטרינג בוטיק ביתי\nלשבתות ואירועים קטנים';
  const kicker = hero.items[1] ?? 'שבתות, מגשי אירוח ו־Travel Nis, עם אוכל מוקפד, נראות יפה ושיחה קצרה שסוגרת כיוון.';
  const text = hero.text ?? 'רואים את הסגנון, בוחרים את סוג ההזמנה, ומשאירים פנייה מסודרת. Nis כבר תהפוך את זה לתפריט, מגשים או מארז שמתאימים לאירוח שלכם.';

  return (
    <div className={device === 'mobile' ? 'preview-frame is-mobile' : 'preview-frame is-desktop'}>
      <div className="preview-browser-bar">
        <span>{device === 'mobile' ? '390px מובייל' : 'אתר במחשב'}</span>
        <strong>nisboutiquecatering.com</strong>
      </div>
      <section className="hero-site-preview" style={{ '--hero-preview-bg': `url('${publicAssetSrcFor(heroBackgroundImage)}')` } as CSSProperties}>
        <div className="hero-preview-media" aria-hidden="true" />
        <div className="hero-preview-texture" aria-hidden="true" />
        <div className="hero-preview-layout">
          <div className="hero-preview-content">
            <img className="hero-preview-logo" src={publicAssetSrcFor('/brand/nis-logo.svg')} alt="Nis boutique catering" />
            <p className="hero-preview-eyebrow">{hero.items[0] ?? 'מהרובע היהודי לביתר עילית'}</p>
            <h3>
              {title.split('\n').map((line, index) => (
                <span key={`${line}-${index}`}>{line}</span>
              ))}
            </h3>
            <p className="hero-preview-kicker">{kicker}</p>
            <p className="hero-preview-text">{text}</p>
            <div className="hero-preview-actions">
              <span>
                <MessageCircle aria-hidden="true" />
                דברו איתנו בוואטסאפ
              </span>
              <span>
                <Eye aria-hidden="true" />
                ראו איך זה נראה
              </span>
            </div>
            <div className="hero-preview-badges" aria-label="נקודות Hero">
              {['שבתות', 'מגשי אירוח', 'Travel Nis', 'מומלץ לפנות מוקדם'].map((badge) => <span key={badge}>{badge}</span>)}
            </div>
          </div>
          <div className="hero-preview-showcase" aria-label="תמונות Hero">
            <div className="hero-preview-stage">
              {primaryServiceMedia?.driveFileId ? (
                <DrivePreviewImage media={primaryServiceMedia} accessToken={accessToken} />
              ) : (
                <img className="hero-preview-plate primary-plate" src={publicAssetSrcFor(heroPrimaryImage)} alt="" />
              )}
              <div className="hero-preview-caption">
                <strong>שבתות, אירוח קטן ומארזים</strong>
                <span>אותה שפה של טעם, נראות ושקט למארח.</span>
              </div>
            </div>
            <img className="hero-preview-plate side-plate" src={publicAssetSrcFor(heroSideImage)} alt="" />
            <img className="hero-preview-plate tall-plate" src={publicAssetSrcFor(heroTallImage)} alt="" />
            <div className="hero-preview-notes">
              {heroNotes.map((note) => (
                <article key={note.id}>
                  <strong>{note.title}</strong>
                  <span>{note.text}</span>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const ServicesPreview = ({
  content,
  mediaById,
  accessToken,
  device,
}: {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly accessToken: string;
  readonly device: PreviewDevice;
}) => {
  const services = [...content.services]
    .filter((service) => service.active && !service.deletedAt)
    .sort((left, right) => left.order - right.order);
  const servicesCopy = content.sections.find((section) => section.id === 'copy-services' && section.active && !section.deletedAt);
  const eyebrow = servicesCopy?.items[0] ?? 'מה אפשר להזמין';
  const title = servicesCopy?.title ?? 'שלוש אפשרויות ברורות. בוחרים כיוון וממשיכים לפנייה.';
  const text = servicesCopy?.text ?? 'שבת, אירוח קטן או דרך: שלושת השירותים מקבלים משקל שווה, וכל אחד מהם נבנה לפי כמות, תאריך והתחושה שרוצים ליצור.';

  return (
    <div className={device === 'mobile' ? 'preview-frame is-mobile' : 'preview-frame is-desktop'}>
      <PreviewBrowserBar device={device} />
      <div className="site-section-preview site-section-preview-frame services-section-preview">
        <p className="kicker">{eyebrow}</p>
        <h3>{title}</h3>
        {text && <p>{text}</p>}
        <div className="preview-services">
          {services.map((service) => {
            const icon = getServicePreviewIcon(service.icon);
            return (
              <article key={service.id}>
                <DrivePreviewImage media={mediaById.get(service.mediaId)} accessToken={accessToken} />
                <div className="preview-service-body">
                  {icon}
                  <h3>{service.title}</h3>
                  <p className="preview-service-subtitle">{service.subtitle}</p>
                  <p>{service.description}</p>
                  {service.promise && <strong className="preview-service-promise">{service.promise}</strong>}
                  {service.details.length > 0 && (
                    <ul>
                      {service.details.slice(0, 4).map((detail) => <li key={detail}>{detail}</li>)}
                    </ul>
                  )}
                  <span className="preview-text-link">
                    {service.cta}
                    <ArrowLeft aria-hidden="true" />
                  </span>
                </div>
              </article>
            );
          })}
          {services.length === 0 && (
            <div className="empty-state">
              <Sparkles aria-hidden="true" />
              <strong>אין שירותים פעילים</strong>
              <span>הדליקו שירות אחד לפחות כדי שיופיע באתר.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const getServicePreviewIcon = (icon: string) => {
  if (icon === 'ChefHat') {
    return <ChefHat aria-hidden="true" className="preview-card-icon" />;
  }
  if (icon === 'Utensils') {
    return <Utensils aria-hidden="true" className="preview-card-icon" />;
  }
  if (icon === 'Package') {
    return <Package aria-hidden="true" className="preview-card-icon" />;
  }
  return <Sparkles aria-hidden="true" className="preview-card-icon" />;
};

const GallerySitePreview = ({
  content,
  mediaById,
  accessToken,
  device,
}: {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly accessToken: string;
  readonly device: PreviewDevice;
}) => {
  const [activeCategory, setActiveCategory] = useState<GalleryPreviewCategory>('all');
  const activeItems = [...content.gallery]
    .filter((item) => item.active && !item.deletedAt)
    .sort((left, right) => left.order - right.order);
  const visibleItems = (activeCategory === 'all' ? activeItems.slice(0, 6) : activeItems.filter((item) => item.category === activeCategory));
  const galleryCopy = content.sections.find((section) => section.id === 'copy-gallery' && section.active && !section.deletedAt);
  const eyebrow = galleryCopy?.items[0] ?? 'גלריה';
  const title = galleryCopy?.title ?? 'קודם רואים. אחר כך הרבה יותר קל לפנות.';
  const text = galleryCopy?.text ?? 'שולחנות, מגשים, סלטים, קפה ופרטים קטנים שמראים את הסגנון לפני שמתחילים לדבר על תפריט.';
  const previewCategories: readonly { readonly id: GalleryPreviewCategory; readonly label: string; readonly count: number }[] = [
    { id: 'all', label: 'הכול', count: activeItems.length },
    ...editableCategories.map((category) => ({
      id: category,
      label: categoryLabels[category],
      count: activeItems.filter((item) => item.category === category).length,
    })),
  ];

  return (
    <div className={device === 'mobile' ? 'preview-frame is-mobile' : 'preview-frame is-desktop'}>
      <PreviewBrowserBar device={device} />
      <div className="site-section-preview site-section-preview-frame gallery-section-preview">
        <p className="kicker">{eyebrow}</p>
        <h3>{title}</h3>
        {text && <p>{text}</p>}
        <div className="gallery-preview-tabs" aria-label="סינון תצוגת גלריה">
          {previewCategories.map((category) => (
            <button
              type="button"
              className={category.id === activeCategory ? 'gallery-preview-tab is-active' : 'gallery-preview-tab'}
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              aria-pressed={category.id === activeCategory}
            >
              <span>{category.label}</span>
              <small>{category.count}</small>
            </button>
          ))}
        </div>
        <div className="preview-gallery">
          {visibleItems.map((item) => (
            <article className={item.tall ? 'preview-gallery-item is-tall' : 'preview-gallery-item'} key={item.id}>
              <DrivePreviewImage media={mediaById.get(item.mediaId)} accessToken={accessToken} />
              <div className="preview-gallery-caption">
                <strong>{item.title}</strong>
                <span>{categoryLabels[item.category]}</span>
              </div>
            </article>
          ))}
          {visibleItems.length === 0 && (
            <div className="empty-state">
              <Images aria-hidden="true" />
              <strong>{activeItems.length === 0 ? 'אין תמונות פעילות בגלריה' : 'אין תמונות בפילטר הזה'}</strong>
              <span>{activeItems.length === 0 ? 'הדליקו תמונות כדי שיופיעו באתר.' : 'בחרו קטגוריה אחרת או חברו תמונה פעילה לקטגוריה הזאת.'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PreviewBrowserBar = ({ device }: { readonly device: PreviewDevice }) => (
  <div className="preview-browser-bar">
    <span>{device === 'mobile' ? '390px מובייל' : 'אתר במחשב'}</span>
    <strong>nisboutiquecatering.com</strong>
  </div>
);

const ContactPreview = ({ content, device }: { readonly content: ContentSnapshot; readonly device: PreviewDevice }) => (
  <div className={device === 'mobile' ? 'preview-frame is-mobile' : 'preview-frame is-desktop'}>
    <PreviewBrowserBar device={device} />
    <div className="site-section-preview site-section-preview-frame contact-section-preview">
      <div className="contact-preview-copy">
        <p className="kicker">יצירת קשר</p>
        <h3>אהבתם את הסגנון? שלחו פנייה מסודרת לוואטסאפ.</h3>
        <p>הטופס נשאר קצר ומעשי: סוג הזמנה, תאריך, כמות והערה. אחרי השליחה נפתחת הודעת וואטסאפ מוכנה.</p>
        <div className="contact-preview-actions">
          <a className="preview-primary-cta" href={content.settings.whatsappBase} target="_blank" rel="noreferrer">
            <MessageCircle aria-hidden="true" />
            קבלו הצעה מותאמת בוואטסאפ
          </a>
          <a className="preview-secondary-cta" href={content.settings.phoneHref}>
            <Phone aria-hidden="true" />
            {content.settings.phoneDisplay}
          </a>
          <span className="contact-preview-line">{content.settings.email}</span>
        </div>
        <div className="contact-preview-promise">
          <strong>מה קורה אחרי הפנייה?</strong>
          <span>שיחה קצרה, התאמה אישית, ואז סיכום ברור של תאריך, כמות וסגנון אירוח.</span>
        </div>
      </div>
      <div className="metadata-preview-card">
        <p className="kicker">SEO ושיתוף קישור</p>
        <h4>{content.settings.seoTitle || 'Nis Boutique Catering'}</h4>
        <p>{content.settings.seoDescription || 'תיאור קצר שיופיע במנועי חיפוש ובשיתוף קישורים.'}</p>
        <span>{publicSiteOrigin.replace('https://', '')}</span>
        <small>גרסת תוכן: {content.settings.siteVersion}</small>
      </div>
    </div>
  </div>
);

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

const SectionGroupEditor = ({
  title,
  text,
  group,
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
        <SectionGroupSitePreview group={group} title={title} sections={groupSections} allSections={sections} device={previewDevice} />
      </div>
    </section>
  );
};

const SectionGroupSitePreview = ({
  group,
  title,
  sections,
  allSections,
  device,
}: {
  readonly group: string;
  readonly title: string;
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
  const managedCopy = allSections.find((section) => section.group === 'site-copy' && section.id === group && section.active && !section.deletedAt);
  const copy = {
    eyebrow: managedCopy?.items[0] || fallbackCopy.eyebrow,
    title: managedCopy?.title || fallbackCopy.title,
    text: managedCopy?.text || fallbackCopy.text,
  };

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
  onSaveDraft,
  onPublish,
  disabled,
}: {
  readonly content: ContentSnapshot;
  readonly hasErrors: boolean;
  readonly status: string;
  readonly publishState: PublishState;
  readonly onSaveDraft: () => void;
  readonly onPublish: () => void;
  readonly disabled: boolean;
}) => (
  <section className="workspace-panel publish-panel-detail">
    <PanelHeader title="פרסום ושינויים" text="כאן עושים בדיקה אחרונה. שמירה לבד לא משנה את האתר; עדכון אתר מפרסם את הכל." />
    <div className="publish-flow">
      {getPublishSteps(publishState, hasErrors).map(({ step, title, text, state }) => (
        <article className={`is-${state}`} key={step}>
          <strong>{step}</strong>
          <div>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        </article>
      ))}
    </div>
    <div className={hasErrors ? 'publish-summary is-error' : 'publish-summary'}>
      <ShieldAlert aria-hidden="true" />
      <span>{status}</span>
    </div>
    <div className="overview-strip">
      <Metric label="שירותים לא בארכיון" value={String(content.services.filter((item) => !item.deletedAt).length)} />
      <Metric label="שאלות FAQ פעילות" value={String(content.sections.filter((item) => item.group === 'faq' && item.active && !item.deletedAt).length)} />
      <Metric label="תמונות פעילות" value={String(content.gallery.filter((item) => item.active && !item.deletedAt).length)} />
      <Metric label="גרסה לפרסום" value={content.settings.siteVersion || content.version} />
    </div>
    <div className="topbar-actions">
      <button className="ghost-button" onClick={onSaveDraft} disabled={disabled}>
        <Save aria-hidden="true" />
        שמור כטיוטה
      </button>
      <button className="publish-button" onClick={onPublish} disabled={disabled}>
        <Rocket aria-hidden="true" />
        עדכן אתר
      </button>
      <a className="ghost-link" href={publicSiteOrigin} target="_blank" rel="noreferrer">פתיחת האתר החי</a>
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
          {usage.kind === 'gallery' ? 'גלריה' : 'שירות'}: {usage.title}
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
              {usage.kind === 'gallery' ? 'גלריה' : 'שירות'}: {usage.title}
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
    return validation.error.issues[0]?.message ?? 'יש שדות שצריך לתקן.';
  }
  return referenceIssues[0] ?? 'יש שדות שצריך לתקן.';
};

const getPublishSteps = (
  publishState: PublishState,
  hasErrors: boolean,
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
      text: active('checking') ? 'בודק אם הגרסה כבר עלתה' : done(['live']) ? 'הסתיים' : 'יתחיל אחרי שליחה',
      state: active('checking') ? 'active' : done(['live']) ? 'done' : 'pending',
    },
    {
      step: '5',
      title: 'האתר החי',
      text: active('live') ? 'הגרסה החדשה באוויר' : 'מחכה לגרסה החדשה',
      state: active('live') ? 'done' : 'pending',
    },
  ];
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

const isLiveSiteVersion = async (version: string) => {
  const html = await fetchPublicText(`${publicSiteOrigin}/`);
  const bundleUrl = findBundleUrl(html);
  if (!bundleUrl) {
    return false;
  }

  const bundle = await fetchPublicText(bundleUrl);
  return bundle.includes(version) || bundle.includes(JSON.stringify(version));
};

const waitForLiveSiteVersion = async (version: string, onProgress: (message: string) => void) => {
  for (let attempt = 1; attempt <= liveVersionPollAttempts; attempt += 1) {
    if (await isLiveSiteVersion(version)) {
      return;
    }

    if (attempt < liveVersionPollAttempts) {
      onProgress(`Cloudflare עדיין בונה או מפיץ את גרסת ${version}. בדיקה ${attempt}/${liveVersionPollAttempts}; נבדוק שוב בעוד כמה שניות.`);
      await wait(liveVersionPollDelayMs);
    }
  }

  throw new Error(`הפרסום נשלח, אבל הסטודיו עדיין לא רואה את גרסת ${version} באתר החי. לרוב זה אומר ש-Cloudflare עדיין בונה או שהפרסום נכשל בשרת.`);
};

const getMediaUsage = (mediaId: string, content: ContentSnapshot): readonly MediaUsageEntry[] => {
  const galleryUsage = content.gallery
    .filter((item) => item.mediaId === mediaId && !item.deletedAt)
    .map((item): MediaUsageEntry => ({ kind: 'gallery', id: item.id, title: item.title, active: item.active }));
  const serviceUsage = content.services
    .filter((service) => service.mediaId === mediaId && !service.deletedAt)
    .map((service): MediaUsageEntry => ({ kind: 'service', id: service.id, title: service.title, active: service.active }));
  return [...galleryUsage, ...serviceUsage];
};

const getGalleryItemForMedia = (mediaId: string, content: ContentSnapshot) => (
  content.gallery.find((item) => item.mediaId === mediaId && !item.deletedAt) ?? null
);

const formatMediaUsage = (usages: readonly MediaUsageEntry[]) => usages
  .map((usage) => `- ${usage.kind === 'gallery' ? 'גלריה' : 'שירות'}: ${usage.title}`)
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
