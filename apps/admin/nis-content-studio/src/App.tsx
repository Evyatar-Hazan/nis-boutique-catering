import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Cloud,
  Copy,
  Eye,
  FileText,
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

type ActiveView =
  | 'site-map'
  | 'hero'
  | 'contact'
  | 'editorial'
  | 'manifesto'
  | 'services'
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
type PublishState = 'clean' | 'draft' | 'saving' | 'publishing' | 'published' | 'error';

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
    void runTask('מעדכנים את האתר', async () => {
      await saveDraft();
      setPublishState('publishing');
      setStatus('הטיוטה נשמרה. מפעילים בנייה ופרסום ב-Cloudflare.');
      const accessToken = await getFreshAccessToken();
      await triggerPublish(accessToken);
      setPublishState('published');
      setStatus('הפרסום נשלח. Cloudflare בונה את האתר; בדקות הקרובות השינוי יופיע באתר החי.');
    });
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
  const archiveMedia = (id: string) => updateMedia(id, { deletedAt: archiveDate() });
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

  const addGalleryItem = () => {
    updateContent((current) => ({
      ...current,
      gallery: [
        ...current.gallery,
        {
          id: `gallery-${current.gallery.length + 1}`,
          title: 'תמונה חדשה',
          alt: 'תיאור נגיש לתמונה חדשה',
          category: 'trays',
          order: current.gallery.length + 1,
          active: false,
          tall: false,
          mediaId: current.media[0]?.id ?? '',
        },
      ],
    }));
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
              <ContactPreview content={content} />
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
              <ServicesPreview content={content} mediaById={mediaById} accessToken={session.accessToken} />
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
                  <button className="compact-button" onClick={addGalleryItem}>
                    <ImagePlus aria-hidden="true" />
                    הוספת תמונה לגלריה
                  </button>
                </div>
              }
            />
            <GallerySitePreview content={content} mediaById={mediaById} accessToken={session.accessToken} />
            <label className="search-box">
              <Search aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="חיפוש לפי שם, תיאור או קטגוריה" />
            </label>
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
                    <div className="toggle-row">
                      <Toggle checked={item.active} label="מוצג באתר" onChange={(checked) => updateGallery(item.id, { active: checked })} />
                      <Toggle checked={item.tall} label="תמונה גבוהה" onChange={(checked) => updateGallery(item.id, { tall: checked })} />
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="subsection-heading">
              <div>
                <p className="kicker">מאגר התמונות</p>
                <h3>כל התמונות בדרייב, גם כאלה שלא מוצגות בגלריה</h3>
                <p>כאן רואים איפה כל תמונה משמשת באתר. כדי להציג תמונה באתר, חברו אותה לפריט גלריה והדליקו “מוצג באתר”.</p>
              </div>
              <label className="compact-button file-button">
                <Upload aria-hidden="true" />
                העלאה ל-Drive
                <input type="file" accept="image/*" onChange={handleUpload} disabled={!canUseGoogle} />
              </label>
            </div>
            <div className="media-grid compact-media-grid">
              {content.media.map((media) => (
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
                    <span>{mediaUsage(media.id, content) || 'עדיין לא מחובר לשום אזור באתר'}</span>
                  </div>
                  <button className="ghost-button" onClick={() => handlePickDriveFile(media.id)} disabled={!canUseGoogle}>החלף מקור מדרייב</button>
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
              ))}
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
              {content.media.map((media) => (
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
                    <span>{mediaUsage(media.id, content) || 'עדיין לא מחובר לשום אזור באתר'}</span>
                  </div>
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
                  <button className="ghost-button" onClick={() => handlePickDriveFile(media.id)} disabled={!canUseGoogle}>בחירה מ-Drive</button>
                  <details className="technical-details">
                    <summary>מקור טכני</summary>
                    <TextInput value={media.src} onChange={(value) => updateMedia(media.id, { src: value })} />
                    <TextInput value={media.driveFileId ?? ''} onChange={(value) => updateMedia(media.id, { driveFileId: value || undefined })} />
                  </details>
                </article>
              ))}
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
  updateSection,
  addSection,
}: {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly accessToken: string;
  readonly updateSection: (id: string, patch: Partial<SectionBlockRecord>) => void;
  readonly addSection: (group?: string) => void;
}) => {
  const hero = content.sections.find((section) => section.id === 'hero') ?? content.sections.find((section) => section.group === 'hero');
  const serviceMedia = content.services[0] ? mediaById.get(content.services[0].mediaId) : undefined;

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
        <p className="kicker">כך זה ירגיש באתר</p>
        <div className="site-preview-hero">
          <p className="kicker">{hero.items[0] ?? 'טקסט עליון קטן'}</p>
          <h3>{hero.title ?? 'כותרת ראשית באתר'}</h3>
          <p>{hero.text ?? 'טקסט הפתיחה יופיע כאן.'}</p>
          <a href={content.settings.whatsappBase} target="_blank" rel="noreferrer">
            <MessageCircle aria-hidden="true" />
            וואטסאפ: {content.settings.phoneDisplay}
          </a>
        </div>
        {serviceMedia && <DrivePreviewImage media={serviceMedia} accessToken={accessToken} />}
      </div>
    </section>
  );
};

const ServicesPreview = ({
  content,
  mediaById,
  accessToken,
}: {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly accessToken: string;
}) => {
  const services = [...content.services]
    .filter((service) => service.active && !service.deletedAt)
    .sort((left, right) => left.order - right.order);

  return (
    <div className="site-section-preview">
      <p className="kicker">תצוגה מקדימה באתר</p>
      <h3>מה אפשר להזמין</h3>
      <p>כך כרטיסי השירות יופיעו ללקוח אחרי פרסום.</p>
      <div className="preview-services">
        {services.map((service) => (
          <article key={service.id}>
            <DrivePreviewImage media={mediaById.get(service.mediaId)} accessToken={accessToken} />
            <h3>{service.title}</h3>
            <strong>{service.subtitle}</strong>
            <p>{service.description}</p>
            <span className="preview-chip">{service.cta}</span>
          </article>
        ))}
        {services.length === 0 && (
          <div className="empty-state">
            <Sparkles aria-hidden="true" />
            <strong>אין שירותים פעילים</strong>
            <span>הדליקו שירות אחד לפחות כדי שיופיע באתר.</span>
          </div>
        )}
      </div>
    </div>
  );
};

const GallerySitePreview = ({
  content,
  mediaById,
  accessToken,
}: {
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly accessToken: string;
}) => {
  const activeItems = [...content.gallery]
    .filter((item) => item.active && !item.deletedAt)
    .sort((left, right) => left.order - right.order)
    .slice(0, 6);

  return (
    <div className="site-section-preview">
      <p className="kicker">תצוגה מקדימה באתר</p>
      <h3>גלריה</h3>
      <p>אלה התמונות הראשונות שהלקוח יראה בגלריה. תמונה כבויה נשארת במאגר אבל לא מופיעה באתר.</p>
      <div className="preview-gallery">
        {activeItems.map((item) => (
          <article className={item.tall ? 'is-tall' : undefined} key={item.id}>
            <DrivePreviewImage media={mediaById.get(item.mediaId)} accessToken={accessToken} />
            <h3>{item.title}</h3>
            <span>{categoryLabels[item.category]}</span>
          </article>
        ))}
      </div>
    </div>
  );
};

const ContactPreview = ({ content }: { readonly content: ContentSnapshot }) => (
  <div className="site-section-preview">
    <p className="kicker">תצוגה מקדימה באתר</p>
    <h3>יצירת קשר</h3>
    <p>כך פרטי ההתקשרות והגרסה יופיעו באתר אחרי פרסום.</p>
    <div className="contact-preview-card">
      <a href={content.settings.whatsappBase} target="_blank" rel="noreferrer">
        <MessageCircle aria-hidden="true" />
        וואטסאפ: {content.settings.phoneDisplay}
      </a>
      <a href={content.settings.phoneHref}>
        <Phone aria-hidden="true" />
        טלפון
      </a>
      <span>{content.settings.email}</span>
      <small>גרסה: {content.settings.siteVersion}</small>
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
  const icon = hasErrors ? <ShieldAlert aria-hidden="true" /> : publishState === 'published' ? <MonitorCheck aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />;
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
              <Field label={group === 'faq' ? 'השאלה שמופיעה באתר' : 'כותרת שמופיעה באתר'} help="זו הכותרת שהלקוח יראה באזור הזה.">
                <TextInput value={section.title ?? ''} onChange={(value) => updateSection(section.id, { title: value || undefined })} />
              </Field>
              <Field label={group === 'faq' ? 'התשובה' : 'טקסט מתחת לכותרת'} help="טקסט קצר וברור, בלי ניסוחים טכניים.">
                <textarea value={section.text ?? ''} onChange={(event) => updateSection(section.id, { text: event.target.value || undefined })} />
              </Field>
              <Field label="נקודות נוספות" help="אם צריך רשימה קצרה, מפרידים נקודות עם |">
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
        <p className="kicker">תצוגה מקדימה</p>
        <div className="preview-faq">
          {groupSections.filter((section) => section.active && !section.deletedAt).map((section) => (
            <article key={section.id}>
              <h3>{section.title}</h3>
              <p>{section.text}</p>
              {section.items.length > 0 && <span>{section.items.join(' · ')}</span>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
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
      {[
        ['1', 'בדיקת שגיאות', hasErrors ? 'צריך לתקן לפני פרסום' : 'תקין'],
        ['2', 'שמירה ל-Google Sheets', publishState === 'saving' ? 'נשמר עכשיו' : 'מוכן'],
        ['3', 'הפעלת Cloudflare', publishState === 'publishing' ? 'נשלח לפרסום' : 'יחכה ללחיצה'],
        ['4', 'האתר החי', publishState === 'published' ? 'הפרסום נשלח' : 'יתעדכן אחרי build'],
      ].map(([step, title, text]) => (
        <article key={step}>
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
  }, [accessToken, media?.driveFileId]);

  const drivePreview = media?.driveFileId && preview?.fileId === media.driveFileId ? preview : null;
  const fallbackFailed = Boolean(fallbackSrc && failedFallbackSrc === fallbackSrc);
  const src = drivePreview?.objectUrl || (fallbackFailed ? '' : fallbackSrc);
  const failed = Boolean(drivePreview?.failed && (!fallbackSrc || fallbackFailed));

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
          <Eye aria-hidden="true" />
          <span>{media ? 'אין תצוגה מקדימה. בחרו מקור מדרייב או פרסמו את התמונה לאתר.' : 'לא נבחרה תמונה'}</span>
        </div>
      )}
      {media && (
        <span className={drivePreview?.objectUrl ? 'source-pill is-drive' : 'source-pill'}>
          {drivePreview?.objectUrl ? 'מקור בדרייב' : 'תצוגה מהאתר'}
        </span>
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

const mediaUsage = (mediaId: string, content: ContentSnapshot) => {
  const usage = [
    ...content.gallery.filter((item) => item.mediaId === mediaId && !item.deletedAt).map((item) => `גלריה: ${item.title}`),
    ...content.services.filter((service) => service.mediaId === mediaId && !service.deletedAt).map((service) => `שירות: ${service.title}`),
  ];
  return usage.join(' | ');
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
  if (!mediaUsage(media.id, content)) {
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
