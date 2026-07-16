import { lazy, Suspense, useEffect, useMemo, useState, type ChangeEvent, type DragEvent, type ReactNode } from 'react';
import {
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  Copy,
  Eye,
  ExternalLink,
  FileText,
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
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Users,
  Wand2,
} from 'lucide-react';
import {
  contentSnapshotSchema,
  formatMediaUsageList,
  galleryCategoryIds,
  getActiveMediaUsages,
  getMediaLabel,
  getManagedCopySection,
  getMediaStatus,
  getMediaUsage,
  getMediaUsageKindLabel,
  getPreviewMicrocopy,
  joinPipeList,
  patchSectionItem,
  validateContentReferences,
  splitPipeList,
  type ContentSnapshot,
  type GalleryItemRecord,
  type ImageAssetRecord,
  type SectionBlockRecord,
  type ServiceRecord,
} from '@monorepo/content-schema';
import { isGoogleConfigured, studioConfig } from './config';
import {
  addGalleryItemToSnapshot,
  addSectionToSnapshot,
  addServiceToSnapshot,
  archiveGalleryItemInSnapshot,
  archiveSectionInSnapshot,
  archiveServiceInSnapshot,
  duplicateGalleryItemInSnapshot,
  duplicateSectionInSnapshot,
  duplicateServiceInSnapshot,
  getGalleryItemForMedia,
  moveGalleryItemInSnapshot,
  normalizeCmsMetadataInSnapshot,
  normalizeMediaId,
  restoreGalleryItemInSnapshot,
  restoreSectionInSnapshot,
  restoreServiceInSnapshot,
  updateGalleryInSnapshot,
  updateSectionInSnapshot,
  updateServiceInSnapshot,
} from './contentMutations';
import { MediaQuickPicker, MediaSelectionUsageNotice } from './mediaSelectionComponents';
import {
  EditingWorkflow,
  PublishPanel,
  StatusPanel,
} from './publishWorkflow';
import type { ActiveView } from './publishWorkflowHelpers';
import {
  getDriveFileViewUrl,
  shortSourceId,
  validationErrorText,
} from './studioHelpers';
import {
  heroMediaIdAt,
  heroMediaSlots,
  patchHeroMediaId,
} from './heroMediaHelpers';
import { cmsSrcFor, publicAssetSrcFor, publicSiteOrigin } from './assetUrlHelpers';
import { getAreaStatus } from './areaStatusHelpers';
import { getViewForUsage } from './previewNavigationHelpers';
import {
  getDriveFileDownloadUrl,
  openDrivePicker,
  readContentFromSheets,
  readStudioAdminsFromSheets,
  saveStudioAdminsToSheets,
  uploadImageToDrive,
} from './googleApi';
import {
} from '@monorepo/site-preview';
import { exactPreviewSectionGroupIds } from './previewParityContract';
import { Field } from './components/editor/Field';
import { sectionGroupWorkspaceDefinitions } from './components/editor/sections/sectionGroupWorkspaceDefinitions';
import { PanelHeader } from './components/editor/PanelHeader';
import { PreviewHeader } from './components/editor/PreviewHeader';
import { StudioSidebar } from './components/editor/StudioSidebar';
import { StudioTopbar } from './components/editor/StudioTopbar';
import type { MediaUsageKind, PreviewDevice } from './components/editor/types';
import { TextInput } from './components/editor/TextInput';
import { Toggle } from './components/editor/Toggle';
import { useStudioAuthSession, type AuthState } from './hooks/useStudioAuthSession';
import { useStudioMediaLibrary, type MediaLibraryFilter } from './hooks/useStudioMediaLibrary';
import { useStudioPublishFlow } from './hooks/useStudioPublishFlow';
import { getConfiguredStudioAdmins, isAllowedStudioAdmin, type StudioAdminRecord } from './studioAdmins';

type SectionEditorItemActionsArgs = {
  readonly section: SectionBlockRecord;
  readonly onDuplicate: () => void;
  readonly onArchive: () => void;
  readonly onRestore: () => void;
};

type ArchivableItemActionsArgs = {
  readonly isArchived: boolean;
  readonly onDuplicate?: () => void;
  readonly onArchive: () => void;
  readonly onRestore: () => void;
};

type DevicePreviewBlockArgs = {
  readonly text: string;
  readonly children: ReactNode;
  readonly wrapInColumn?: boolean;
};

type SectionGroupPreviewArgs = {
  readonly group: string;
  readonly title: string;
  readonly content: ContentSnapshot;
  readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
  readonly sections: readonly SectionBlockRecord[];
  readonly allSections: readonly SectionBlockRecord[];
  readonly device: PreviewDevice;
};

type SiteAreaDefinition = {
  readonly id: ActiveView;
  readonly title: string;
  readonly location: string;
  readonly help: string;
  readonly icon: ReactNode;
  readonly editorView?: ActiveView;
};

const HeroEditor = lazy(async () => ({ default: (await import('./components/editor/sections/HeroEditor')).HeroEditor }));
const CopyOnlySectionEditor = lazy(async () => ({ default: (await import('./components/editor/sections/CopyOnlySectionEditor')).CopyOnlySectionEditor }));
const ManifestoEditor = lazy(async () => ({ default: (await import('./components/editor/sections/ManifestoEditor')).ManifestoEditor }));
const SectionGroupWorkspace = lazy(async () => ({ default: (await import('./components/editor/sections/SectionGroupWorkspace')).SectionGroupWorkspace }));
const SiteMapWorkspace = lazy(async () => ({ default: (await import('./components/editor/sections/SiteMapWorkspace')).SiteMapWorkspace }));
const ServicesWorkspace = lazy(async () => ({ default: (await import('./components/editor/sections/ServicesWorkspace')).ServicesWorkspace }));
const ImageUploadDropzone = lazy(async () => ({ default: (await import('./components/editor/sections/MediaLibrary')).ImageUploadDropzone }));
const ImagesLibraryToolbar = lazy(async () => ({ default: (await import('./components/editor/sections/MediaLibrary')).ImagesLibraryToolbar }));
const ImagesGrid = lazy(async () => ({ default: (await import('./components/editor/sections/MediaLibrary')).ImagesGrid }));
const ImageDetailsPanel = lazy(async () => ({ default: (await import('./components/editor/sections/MediaLibrary')).ImageDetailsPanel }));
const AdminsWorkspace = lazy(async () => ({ default: (await import('./components/editor/sections/AdminsWorkspace')).AdminsWorkspace }));
const HeroSitePreview = lazy(async () => ({ default: (await import('./preview/SitePreviewBlocks')).HeroSitePreview }));
const IntroBandPreview = lazy(async () => ({ default: (await import('./preview/SitePreviewBlocks')).IntroBandPreview }));
const ExactCopySectionPreview = lazy(async () => ({ default: (await import('./preview/SitePreviewBlocks')).ExactCopySectionPreview }));
const CopyOnlySectionPreview = lazy(async () => ({ default: (await import('./preview/SitePreviewBlocks')).CopyOnlySectionPreview }));
const ManifestoSitePreview = lazy(async () => ({ default: (await import('./preview/SitePreviewBlocks')).ManifestoSitePreview }));
const ServicesPreview = lazy(async () => ({ default: (await import('./preview/SitePreviewBlocks')).ServicesPreview }));
const GallerySitePreview = lazy(async () => ({ default: (await import('./preview/SitePreviewBlocks')).GallerySitePreview }));
const ContactPreview = lazy(async () => ({ default: (await import('./preview/SitePreviewBlocks')).ContactPreview }));
const MetadataSeoPreview = lazy(async () => ({ default: (await import('./preview/SitePreviewBlocks')).MetadataSeoPreview }));
const SectionGroupSitePreview = lazy(async () => ({ default: (await import('./preview/SitePreviewBlocks')).SectionGroupSitePreview }));

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
const creatorUrl = 'https://EvyatarHazan.com';
const tokenRefreshWindowMs = 60_000;
const liveVersionPollDelayMs = 15_000;
const liveVersionPollAttempts = 12;
const manifestoMediaFallbacks = ['hosting-table-overview', 'dips-tray-close', 'table-setting-blue-gold'] as const;

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

const PreviewBrowserBar = ({ device }: { readonly device: PreviewDevice }) => (
  <div className="preview-browser-bar">
    <span>{device === 'mobile' ? '390px מובייל' : 'אתר במחשב'}</span>
    <strong>nisboutiquecatering.com</strong>
  </div>
);

const PreviewLoadingState = ({ device }: { readonly device: PreviewDevice }) => (
  <div className={device === 'mobile' ? 'preview-frame is-mobile' : 'preview-frame is-desktop'}>
    <PreviewBrowserBar device={device} />
    <div className="site-section-preview site-section-preview-frame">
      <div className="empty-preview">
        <RefreshCw aria-hidden="true" />
        <span>טוען תצוגה מקדימה...</span>
      </div>
    </div>
  </div>
);

const categoryLabels: Readonly<Record<GalleryItemRecord['category'], string>> = {
  tables: 'שולחנות',
  trays: 'מגשים',
  salads: 'סלטים',
  coffee: 'קפה',
  fish: 'דגים',
};

const mediaLibraryFilterLabels: Readonly<Record<MediaLibraryFilter, string>> = {
  all: 'הכל',
  used: 'בשימוש',
  unused: 'לא בשימוש',
  'missing-drive': 'חסר Drive',
  archived: 'בארכיון',
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
  makeCopySection('audience', 'כשרוצים לארח יפה, טעים ומכובד בלי לסחוב הכול לבד.', 'Nis מתאימה למי שרוצה לזהות את עצמו מהר: שבת רגועה יותר, אירוע קטן שנראה נכון, או מארז יפה שלוקחים לדרך או שולחים הלאה.', 'למי זה מתאים', 4),
  makeCopySection('experience-lab', 'מהרגע שבוחרים כיוון, האירוח מתחיל לקבל צורה.', 'בוחרים את סוג האירוח ומבינים מהר איך זה יכול להיראות אצלכם: מה נפתח על השולחן, מה מתאים לאופי האירוע, ואיך ממשיכים לשיחה קצרה. שלוש הקטגוריות והכיוונים לדוגמה כבר משולבים כאן כדי שיהיה קל להתחיל מאותו מקום.', 'בחרו את החוויה', 5),
  makeCopySection('process', 'ארבעה צעדים קצרים מהרעיון ועד אוכל שמוכן להגשה.', undefined, 'איך זה עובד', 9),
  makeCopySection('story', 'Nis נולדה מתוך אהבה לאירוח יפה, אוכל ביתי מדויק ותשומת לב לפרטים הקטנים.', 'מאחורי Nis עומדת יהודית ניסטנפובר, עם אהבה עמוקה לאירוח, לאוכל מוקפד ולרגעים הקטנים שהופכים ארוחה לחוויה.', 'הסיפור של המותג', 10, 'אחרי שנים של חיים ברובע היהודי, בין סמטאות אבן, בתים מלאי ריח של שבת ושולחנות שנפתחים לאנשים שאוהבים, יהודית מביאה למטבח של Nis חיבור בין ביתיות, אסתטיקה ושירות אישי.|כל הזמנה נבנית מתוך תשומת לב לפרטים הקטנים: חומרי גלם טריים, טעמים מדויקים, אריזה אסתטית ותחושה שמישהו חשב עליכם באמת.'),
  makeCopySection('coordination', 'הפרטים שעוזרים להתקדם בביטחון.', undefined, 'תיאום וזמינות', 12),
  makeCopySection('real-media', 'ככה נראית תשומת לב לפני שהאירוח בכלל פוגש את האורחים.', 'מנות אישיות, אריזה נקייה, מדבקת Nis ופרטים קטנים שמסדרים את החוויה עוד לפני הביס הראשון. התמונות והווידאו כאן הם מהכנות אמיתיות של Nis.', 'וידאו אמיתי', 13),
  makeCopySection('gallery', 'קודם רואים. אחר כך הרבה יותר קל לפנות.', 'שולחנות, מגשים, סלטים, קפה ופרטים קטנים שמראים את הסגנון לפני שמתחילים לדבר על תפריט.', 'גלריה', 14),
  makeCopySection('faq', 'התשובות שמקלות על הפנייה הראשונה.', 'לפני השאלות עצמן, חשוב לדעת שהאירוח מגיע מסודר, מתואם אישית ועם מענה אנושי שמכוון לסוג האירוע, לכמות הסועדים ולהעדפות שלכם.', 'שאלות נפוצות', 19),
  makeCopySection('contact', 'אהבתם את הסגנון? שלחו פנייה מסודרת לוואטסאפ.', 'הטופס נשאר קצר ומעשי: סוג הזמנה, תאריך, כמות והערה. אחרי השליחה נפתחת הודעת וואטסאפ מוכנה, כדי שיהיה קל להמשיך לשיחה אישית.', 'יצירת קשר', 20, 'שיחה קצרה, התאמה אישית, ואז סיכום ברור של תאריך, כמות וסגנון אירוח.'),
  makeMicrocopySection('nav-experiences-label', 'קישור בתפריט: מה מזמינים', 'מה מזמינים', -11),
  makeMicrocopySection('nav-gallery-label', 'קישור בתפריט: גלריה', 'גלריה', -10),
  makeMicrocopySection('nav-process-label', 'קישור בתפריט: איך זה עובד', 'איך זה עובד', -9),
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
  makeSection('manifesto-table', 'manifesto', 'שולחן שנראה מסודר עוד לפני שנוגעים בו', 'ההגשה, הצבעים והקצב של השולחן הם חלק מהחוויה, לא רק הרקע של האוכל.', ['01', 'hosting-table-overview'], 1),
  makeSection('manifesto-home', 'manifesto', 'אוכל שמרגיש ביתי, אבל לא יומיומי', 'הטעם נשאר חם ומוכר, אבל ההופעה, האריזה והדיוק נותנים תחושת occasion.', ['02', 'dips-tray-close'], 2),
  makeSection('manifesto-custom', 'manifesto', 'התאמה אישית במקום פס ייצור', 'החוויה נבנית סביב האירוח שלכם, לא סביב קטלוג אחיד שצריך להסתדר איתו.', ['03', 'table-setting-blue-gold'], 3),
  makeSection('audience-shabbat', 'audience', 'למשפחות שמארחות שבת', 'למי שרוצה שולחן מכובד, מלא ויפה בלי לעמוד שעות במטבח ובלי להיכנס ללחץ לפני שבת.', ['Users'], 1),
  makeSection('audience-events', 'audience', 'לאירועים קטנים ומוקפדים', 'לזוגות, משפחות ומארחים שמתכננים שמחה קטנה, ברית, שבע ברכות או מפגש משפחתי עם נראות טובה ושקט תפעולי.', ['HeartHandshake'], 2),
  makeSection('audience-travel', 'audience', 'למארזים, דרך ומתנה', 'למי שרוצה לשלוח או לקחת משהו יפה, טעים ומכובד לדרך, לשבת, לאורחים או ליום מיוחד.', ['Gift'], 3),
  makeSection('process-whatsapp', 'process', 'שולחים הודעה בוואטסאפ', 'אפשר ללחוץ על וואטסאפ או לשלוח את הטופס המסודר בתחתית האתר.', ['MessageCircle'], 1),
  makeSection('process-details', 'process', 'מחדדים סוג אירוח וכמות', 'בוחרים שבת, מגשי אירוח או Travel Nis, ומוסיפים תאריך, כמות וכיוון כללי.', ['CalendarDays'], 2),
  makeSection('process-offer', 'process', 'מקבלים הצעה או תפריט מותאם', 'מקבלים כיוון שמתאים לאירוח, למספר הסועדים ולרמת ההגשה הרצויה.', ['ClipboardList'], 3),
  makeSection('process-ready', 'process', 'סוגרים פרטים ומקבלים מוכן להגשה', 'מסכמים תאריך, אופן קבלה והתאמות, ואז מקבלים אוכל מסודר ונוח להגשה.', ['CheckCircle2'], 4),
  makeSection('story-rova', 'story', 'מהרובע היהודי', 'שנים של סמטאות אבן, בתים פתוחים וריח של שבת בנו אצל יהודית שפה של אירוח שיש בו נשמה, סדר וחום.', [], 1),
  makeSection('story-kitchen', 'story', 'אל המטבח של Nis', 'הזיכרון הזה הופך למטבח מוקפד: חומרי גלם טריים, טעמים מדויקים, אריזה יפה ותחושה שמישהו חשב עליכם באמת.', [], 2),
  makeSection('story-table', 'story', 'עד השולחן שלכם', 'המטרה פשוטה: שתוכלו לארח ברוגע, לפתוח את המארז או המגש, ולהרגיש שהאוכל כבר מספר את הסיפור הנכון.', [], 3),
  makeSection('coordination-area', 'coordination', 'אזור פעילות', 'ביתר עילית כבסיס פעילות. איסוף ומשלוחים בסביבה מתואמים לפי תאריך, מיקום ואופי ההזמנה.', ['MapPin'], 1),
  makeSection('coordination-time', 'coordination', 'זמן פנייה מומלץ', 'לשבתות, חגים ואירועים כדאי לפנות כמה שיותר מוקדם כדי להשאיר מקום להתאמה אישית.', ['CalendarDays'], 2),
  makeSection('coordination-price', 'coordination', 'הצעת מחיר', 'מקבלים הצעה מותאמת אחרי שמבינים את סוג האירוח, הכמות, התאריך ורמת ההגשה הרצויה.', ['Users'], 3),
  makeSection('coordination-confirm', 'coordination', 'אישור תפריט', 'אחרי שיחה קצרה מסכמים כיוון, התאמות, תאריך ואופן קבלה לפני סגירת ההזמנה.', ['ClipboardList'], 4),
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

const areaDefinitions: readonly SiteAreaDefinition[] = [
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
    location: 'אחרי פתיח הבידול, לפני קהל היעד',
    help: 'כרטיסים עם מסר רגשי ותמונות שמרכזים עכשיו גם את מסרי הבוטיק של המותג.',
    icon: <Wand2 aria-hidden="true" />,
  },
  {
    id: 'audience',
    title: 'למי זה מתאים',
    location: 'אחרי אזור השפה של Nis',
    help: 'מי אמור להבין מיד שהשירות מתאים לו.',
    icon: <Users aria-hidden="true" />,
  },
  {
    id: 'experience-lab',
    title: 'בחרו את החוויה',
    location: 'אחרי קהל היעד ולפני הגלריה',
    help: 'טקסט ההסבר שמלווה את בחירת סוג האירוח באתר, כולל הכיוונים לדוגמה שנבלעו לתוך האזור.',
    icon: <Images aria-hidden="true" />,
  },
  {
    id: 'services',
    title: 'חוויות אירוח',
    location: 'מקור הנתונים המשותף של בחירת החוויה באתר',
    help: 'השירותים כאן מזינים את Experience Lab, גם אחרי שהסקשן הכפול ירד מהעמוד.',
    icon: <Sparkles aria-hidden="true" />,
  },
  {
    id: 'media',
    title: 'גלריה באתר',
    location: 'אחרי כרטיסי השירותים ולפני הווידאו',
    help: 'כאן מנהלים את סדר התמונות, הכותרות והקטגוריות שהלקוח רואה בגלריה הציבורית.',
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
    id: 'coordination',
    title: 'תיאום וזמינות',
    location: 'אחרי סיפור המותג ולפני שאלות ותשובות',
    help: 'אזור פעילות, זמן פנייה, הצעת מחיר ואישור תפריט.',
    icon: <Phone aria-hidden="true" />,
  },
  {
    id: 'faq',
    title: 'שאלות ותשובות',
    location: 'אחרי התיאום ולפני יצירת קשר',
    help: 'כל שאלה היא כרטיס שאפשר להוסיף, לכבות או לארכב, והפתיח כולל עכשיו גם את מסרי האמון שהיו נפרדים.',
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
    label: 'ניהול תמונות',
    help: 'כל התמונות הזמינות, פרטי הקובץ, העלאה ל-Drive ושימושים באתר.',
    icon: <Images aria-hidden="true" />,
  },
  {
    id: 'contact',
    label: 'מטה דאטה ופרסום',
    help: 'טלפון, וואטסאפ, SEO, גרסה וכפתור עדכון אתר.',
    icon: <Tag aria-hidden="true" />,
  },
  {
    id: 'admins',
    label: 'ניהול אדמינים',
    help: 'הוספה, עריכה וכיבוי של משתמשים מורשים בסגנון שוהם.',
    icon: <ShieldCheck aria-hidden="true" />,
  },
];

const WorkspaceLoadingState = ({ label = 'טוען את האזור...' }: { readonly label?: string }) => (
  <section className="workspace-panel">
    <div className="empty-state">
      <RefreshCw aria-hidden="true" />
      <strong>{label}</strong>
      <span>רק האזור שנבחר נטען עכשיו כדי לשמור על סטודיו מהיר יותר.</span>
    </div>
  </section>
);

export const App = () => {
  const [content, setContent] = useState<ContentSnapshot>(emptyContent);
  const [activeView, setActiveView] = useState<ActiveView>('site-map');
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');
  const [status, setStatus] = useState('התחברו כדי לנהל את התוכן האמיתי של האתר.');
  const [isBusy, setIsBusy] = useState(false);
  const [siteGalleryQuery, setSiteGalleryQuery] = useState('');
  const [isImageDropActive, setIsImageDropActive] = useState(false);
  const [studioAdmins, setStudioAdmins] = useState<readonly StudioAdminRecord[]>(getConfiguredStudioAdmins());

  const mediaById = useMemo(() => new Map(content.media.map((media) => [media.id, media])), [content.media]);
  const validation = useMemo(() => contentSnapshotSchema.safeParse(content), [content]);
  const referenceIssues = useMemo(() => validateContentReferences(content), [content]);
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
        .filter((item) => `${item.title} ${item.alt} ${item.category}`.toLowerCase().includes(siteGalleryQuery.toLowerCase()))
        .sort((left, right) => left.order - right.order),
    [content.gallery, siteGalleryQuery],
  );
  const buildNextContent = (current: ContentSnapshot, updater: (snapshot: ContentSnapshot) => ContentSnapshot) => {
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
  };

  const updateContent = (updater: (current: ContentSnapshot) => ContentSnapshot) => {
    setContent((current) => buildNextContent(current, updater));
    markDraft();
  };

  const {
    authState,
    session,
    getFreshAccessToken,
    handleLogin: performLogin,
    handleLogout: performLogout,
  } = useStudioAuthSession({
    isGoogleConfigured,
    tokenRefreshWindowMs,
    onStatusChange: setStatus,
    onBusyChange: setIsBusy,
    onAuthorized: async (accessToken, email) => {
      const admins = await readStudioAdminsFromSheets(accessToken);
      const allowed = isAllowedStudioAdmin(email, admins);
      if (!allowed) {
        throw new Error('אין למשתמש הזה הרשאה לנהל את האתר.');
      }
      setStudioAdmins(admins);
      setContent(ensureManagedSections(await readContentFromSheets(accessToken)));
      setPublishProgress(null);
      setPublishState('clean');
      setStatus('התוכן נטען מה-Sheets. אפשר לערוך וללחוץ "עדכן אתר" כדי לפרסם.');
    },
  });
  const canUseGoogle = Boolean(session && isGoogleConfigured);
  const {
    publishState,
    publishProgress,
    markDraft,
    resetPublishFlow,
    runTask,
    handleSaveDraft,
    persistDraft,
    handleUpdateSite,
    setPublishState,
    setPublishProgress,
  } = useStudioPublishFlow({
    authState,
    session,
    content,
    hasErrors,
    publicSiteOrigin,
    liveVersionPollAttempts,
    liveVersionPollDelayMs,
    getFreshAccessToken,
    onBusyChange: setIsBusy,
    onStatusChange: setStatus,
  });
  const {
    query,
    setQuery,
    setSelectedMediaId,
    selectedMediaIds,
    mediaFilter,
    setMediaFilter,
    filteredMedia,
    activeSelectedMedia,
    bulkSelectedMedia,
    areAllVisibleSelected,
    updateMedia,
    saveMediaTitle,
    renameMedia,
    archiveMedia,
    restoreMedia,
    toggleSelectedMedia,
    toggleSelectAllVisibleMedia,
    archiveSelectedMedia,
    restoreSelectedMedia,
  } = useStudioMediaLibrary({
    content,
    session,
    buildNextContent,
    updateContent,
    getFreshAccessToken,
    runTask,
    setContent,
    setPublishState,
    setStatus,
  });

  const handleLogin = () =>
    runTask('מתחברים לגוגל', async () => {
      await performLogin();
    });

  const handleRefresh = () => {
    if (!session) {
      return;
    }
    void runTask('מרעננים תוכן מ-Google Sheets', async () => {
      const accessToken = await getFreshAccessToken();
      const [freshAdmins, freshContent] = await Promise.all([
        readStudioAdminsFromSheets(accessToken),
        readContentFromSheets(accessToken),
      ]);
      setStudioAdmins(freshAdmins);
      setContent(ensureManagedSections(freshContent));
      setPublishProgress(null);
      setPublishState('clean');
      setStatus('התוכן רוענן מה-Sheets.');
    });
  };

  const handleLogout = () => {
    performLogout();
    resetPublishFlow();
    setContent(emptyContent);
    setStudioAdmins(getConfiguredStudioAdmins());
  };

  const saveStudioAdmins = (admins: readonly StudioAdminRecord[]) => {
    if (!session) {
      return;
    }

    void runTask('שומרים רשימת אדמינים', async () => {
      const accessToken = await getFreshAccessToken();
      await saveStudioAdminsToSheets(accessToken, admins);
      setStudioAdmins(admins);
      setStatus('רשימת האדמינים נשמרה ב-Google Sheets. ההרשאות ייכנסו לתוקף בכניסה או רענון הבא.');
    });
  };

  const updateGallery = (id: string, patch: Partial<GalleryItemRecord>) => {
    updateContent((current) => updateGalleryInSnapshot(current, id, patch));
  };

  const updateService = (id: string, patch: Partial<ServiceRecord>) => {
    updateContent((current) => updateServiceInSnapshot(current, id, patch));
  };

  const updateSection = (id: string, patch: Partial<SectionBlockRecord>) => {
    updateContent((current) => updateSectionInSnapshot(current, id, patch));
  };

  const archiveGalleryItem = (id: string) => updateContent((current) => archiveGalleryItemInSnapshot(current, id));
  const restoreGalleryItem = (id: string) => updateContent((current) => restoreGalleryItemInSnapshot(current, id));
  const archiveService = (id: string) => updateContent((current) => archiveServiceInSnapshot(current, id));
  const restoreService = (id: string) => updateContent((current) => restoreServiceInSnapshot(current, id));
  const archiveSection = (id: string) => updateContent((current) => archiveSectionInSnapshot(current, id));
  const restoreSection = (id: string) => updateContent((current) => restoreSectionInSnapshot(current, id));

  const moveGalleryItem = (id: string, direction: -1 | 1) => {
    updateContent((current) => moveGalleryItemInSnapshot(current, id, direction));
  };

  const renderArchivableItemActions = ({
    isArchived,
    onDuplicate,
    onArchive,
    onRestore,
  }: ArchivableItemActionsArgs) => (
    <ItemActions
      isArchived={isArchived}
      onDuplicate={onDuplicate}
      onArchive={onArchive}
      onRestore={onRestore}
    />
  );

  const renderSectionEditorItemActions = ({
    section,
    onDuplicate,
    onArchive,
    onRestore,
  }: SectionEditorItemActionsArgs) => renderArchivableItemActions({
    isArchived: Boolean(section.deletedAt),
    onDuplicate,
    onArchive,
    onRestore,
  });

  const renderSectionGroupPreview = ({
    group,
    title,
    content: previewContent,
    mediaById: previewMediaById,
    sections,
    allSections,
    device,
  }: SectionGroupPreviewArgs) => (
    <SectionGroupSitePreview
      group={group}
      title={title}
      content={previewContent}
      mediaById={previewMediaById}
      sections={sections}
      allSections={allSections}
      device={device}
    />
  );

  const renderExactCopySectionPreview = ({
    sectionId,
    content: previewContent,
    mediaById: previewMediaById,
    device,
  }: {
    readonly sectionId: string;
    readonly content: ContentSnapshot;
    readonly mediaById: ReadonlyMap<string, ImageAssetRecord>;
    readonly device: PreviewDevice;
  }) => (
    <Suspense fallback={<PreviewLoadingState device={device} />}>
      <ExactCopySectionPreview
        sectionId={sectionId}
        content={previewContent}
        mediaById={previewMediaById}
        device={device}
      />
    </Suspense>
  );

  const renderDevicePreviewBlock = ({
    text,
    children,
    wrapInColumn = true,
  }: DevicePreviewBlockArgs) => {
    const preview = (
      <>
        <PreviewHeader
          title="תצוגה מקדימה כמו באתר"
          text={text}
          device={previewDevice}
          onDeviceChange={setPreviewDevice}
        />
        {children}
      </>
    );

    return wrapInColumn ? <div className="preview-column">{preview}</div> : preview;
  };

  const normalizeCmsMetadata = () => {
    updateContent((current) => normalizeCmsMetadataInSnapshot(current));
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

      return addGalleryItemToSnapshot(current, getMediaLabel, mediaId);
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
    updateContent((current) => duplicateGalleryItemInSnapshot(current, item));
  };

  const addService = () => {
    updateContent((current) => addServiceToSnapshot(current));
  };

  const duplicateService = (service: ServiceRecord) => {
    updateContent((current) => duplicateServiceInSnapshot(current, service));
  };

  const addSection = (group = 'general') => {
    updateContent((current) => addSectionToSnapshot(current, group));
  };

  const duplicateSection = (section: SectionBlockRecord) => {
    updateContent((current) => duplicateSectionInSnapshot(current, section));
  };

  const uploadMediaFile = (file: File) => {
    if (!session) {
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
            title: file.name.replace(/\.[^.]+$/, ''),
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
      setSelectedMediaId(id);
      setStatus('התמונה עלתה ל-Drive. עכשיו אפשר לשייך אותה לאזור רלוונטי באתר מתוך מסך ניהול האתר.');
    });
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    uploadMediaFile(file);
    event.target.value = '';
  };

  const handleImageDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsImageDropActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }

    uploadMediaFile(file);
  };

  const handlePickDriveFile = (mediaId: string) => {
    if (!session) {
      return;
    }

    const activeUsages = getActiveMediaUsages(mediaId, content);
    if (activeUsages.length > 0) {
      const ok = window.confirm(`התמונה הזאת מוצגת עכשיו באתר ב-${activeUsages.length} מקום/ות:\n${formatMediaUsageList(activeUsages)}\n\nלהחליף את מקור ה-Drive שלה בכל זאת?`);
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

      <StudioSidebar
        publicSiteOrigin={publicSiteOrigin}
        creatorUrl={creatorUrl}
        sessionEmail={session.email}
        activeView={activeView}
        isSidebarHidden={isSidebarHidden}
        sections={studioSections}
        areaDefinitions={areaDefinitions}
        onSetActiveView={setActiveView}
        onLogout={handleLogout}
      />

      <section className="studio-main">
        <StudioTopbar
          activeView={activeView}
          areaDefinitions={areaDefinitions}
          isBusy={isBusy}
          canUseGoogle={canUseGoogle}
          hasErrors={hasErrors}
          hasPublishUrl={Boolean(studioConfig.publishUrl)}
          onSetActiveView={setActiveView}
          onRefresh={handleRefresh}
          onSaveDraft={handleSaveDraft}
          onUpdateSite={handleUpdateSite}
        />

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
          <Metric label="תמונות בספרייה" value={String(visibleMedia.length)} />
          <Metric label="תמונות מחוברות ל-Drive" value={String(driveMediaCount)} />
          <Metric label="תמונות פעילות בגלריה" value={String(activeGalleryCount)} />
          <Metric label="שירותים באתר" value={String(content.services.filter((service) => !service.deletedAt).length)} />
          <Metric label="אדמינים פעילים" value={String(studioAdmins.filter((admin) => admin.active).length)} />
          <Metric label="פריטים בארכיון" value={String(archivedCount)} />
          <Metric label="גרסת תוכן" value={content.settings.siteVersion || content.version} />
        </section>

        {activeView === 'site-map' && (
          <Suspense fallback={<WorkspaceLoadingState label="טוען את מפת האתר..." />}>
            <SiteMapWorkspace
              content={content}
              mediaById={mediaById}
              setActiveView={setActiveView}
              areaDefinitions={areaDefinitions}
              getAreaStatus={getAreaStatus}
              exactPreviewSectionGroupIds={exactPreviewSectionGroupIds}
              sectionGroupLabels={sectionGroupLabels}
              getPreviewMicrocopy={getPreviewMicrocopy}
              renderHeroPreview={({ content: heroContent, hero, device, mediaById: heroMediaById }) => (
                <HeroSitePreview content={heroContent} hero={hero} device={device} mediaById={heroMediaById} />
              )}
              renderIntroBandPreview={({ content: introContent, mediaById: introMediaById, device }) => (
                <IntroBandPreview content={introContent} mediaById={introMediaById} device={device} />
              )}
              renderManifestoPreview={({ content: manifestoContent, mediaById: manifestoMediaById, device }) => (
                <ManifestoSitePreview content={manifestoContent} mediaById={manifestoMediaById} device={device} />
              )}
              renderExperienceLabPreview={({ content: experienceContent, mediaById: experienceMediaById, device }) => (
                renderExactCopySectionPreview({ sectionId: 'experience-lab', content: experienceContent, mediaById: experienceMediaById, device })
              )}
              renderServicesPreview={({ content: servicesContent, mediaById: servicesMediaById, device }) => (
                <ServicesPreview content={servicesContent} mediaById={servicesMediaById} device={device} />
              )}
              renderGalleryPreview={({ content: galleryContent, mediaById: galleryMediaById, device }) => (
                <GallerySitePreview content={galleryContent} mediaById={galleryMediaById} device={device} />
              )}
              renderRealMediaPreview={({ content: realMediaContent, mediaById: realMediaMediaById, device }) => (
                renderExactCopySectionPreview({ sectionId: 'real-media', content: realMediaContent, mediaById: realMediaMediaById, device })
              )}
              renderContactPreview={({ content: contactContent, mediaById: contactMediaById, device }) => (
                <ContactPreview content={contactContent} mediaById={contactMediaById} device={device} />
              )}
              renderSectionGroupPreview={({ group, title, content: groupContent, mediaById: groupMediaById, sections, allSections, device }) => (
                <SectionGroupSitePreview
                  group={group}
                  title={title}
                  content={groupContent}
                  mediaById={groupMediaById}
                  sections={sections}
                  allSections={allSections}
                  device={device}
                />
              )}
              renderBrowserBar={(previewDevice) => <PreviewBrowserBar device={previewDevice} />}
              renderMetadataPreview={({ content: metadataContent, device }) => (
                <MetadataSeoPreview content={metadataContent} device={device} />
              )}
            />
          </Suspense>
        )}

        {activeView === 'hero' && (
          <Suspense fallback={<WorkspaceLoadingState label="טוען את עורך ה-Hero..." />}>
            <HeroEditor
              content={content}
              mediaById={mediaById}
              previewDevice={previewDevice}
              onPreviewDeviceChange={setPreviewDevice}
              updateSection={updateSection}
              addSection={addSection}
              persistHeroStats={() => persistDraft('שומרים נתוני אירוח', 'נתוני האירוח נשמרו ב-Google Sheets. כדי לעדכן את האתר החי לחצו אחר כך על "עדכן אתר".')}
              heroMediaSlots={heroMediaSlots}
              patchSectionItem={patchSectionItem}
              heroMediaIdAt={heroMediaIdAt}
              patchHeroMediaId={patchHeroMediaId}
              mediaLabel={getMediaLabel}
              renderPreview={({ content: previewContent, hero, device, mediaById: previewMediaById }) => (
                <HeroSitePreview content={previewContent} hero={hero} device={device} mediaById={previewMediaById} />
              )}
              renderMediaQuickPicker={({ label, mediaItems, selectedMediaId, content: previewContent, onSelect }) => (
                <MediaQuickPicker
                  label={label}
                  mediaItems={mediaItems}
                  selectedMediaId={selectedMediaId}
                  onSelect={onSelect}
                  getMediaLabel={(media) => getMediaLabel(media, previewContent)}
                  getMediaSrc={(media) => (media.src ? publicAssetSrcFor(media.src) : '')}
                />
              )}
              renderMediaSelectionUsageNotice={({ mediaId, content: previewContent, currentUsage }) => (
                <MediaSelectionUsageNotice
                  otherUsages={getMediaUsage(mediaId, previewContent).filter((usage) => usage.kind !== currentUsage.kind || usage.id !== currentUsage.id)}
                  getUsageKindLabel={getMediaUsageKindLabel}
                />
              )}
              joinPipeList={joinPipeList}
              splitPipeList={splitPipeList}
            />
          </Suspense>
        )}

        {activeView === 'intro-band' && (
          <Suspense fallback={<WorkspaceLoadingState label="טוען את עורך הפתיח..." />}>
            <CopyOnlySectionEditor
              content={content}
              mediaById={mediaById}
              sectionId="intro-band"
              title="רעיון אחד ברור"
              text="זה הפתיח הקצר שאחרי מסך הפתיחה. הוא מיועד להסביר במהירות למי Nis מתאימה ולמה שבתות, אירוח קטן ו-Travel Nis הם אותו עולם."
              previewDevice={previewDevice}
              onPreviewDeviceChange={setPreviewDevice}
              updateSection={updateSection}
              getManagedCopySection={getManagedCopySection}
              patchSectionItem={patchSectionItem}
              joinPipeList={joinPipeList}
              splitPipeList={splitPipeList}
              renderExactPreview={({ sectionId, content: previewContent, mediaById: previewMediaById, device }) => {
                if (sectionId !== 'intro-band') {
                  return null;
                }

                return (
                  <IntroBandPreview content={previewContent} mediaById={previewMediaById} device={device} />
                );
              }}
              renderFallbackPreview={({ section, tagsSection, device }) => (
                <CopyOnlySectionPreview section={section} tagsSection={tagsSection} device={device} />
              )}
            />
          </Suspense>
        )}

        {activeView === 'experience-lab' && (
          <Suspense fallback={<WorkspaceLoadingState label="טוען את עורך Experience Lab..." />}>
            <CopyOnlySectionEditor
              content={content}
              mediaById={mediaById}
              sectionId="experience-lab"
              title="בחרו את החוויה"
              text="הטקסט שמלווה את אזור בחירת החוויה באתר. כאן מסבירים למה לבחור קודם את סוג האירוח ומה קורה אחר כך."
              previewDevice={previewDevice}
              onPreviewDeviceChange={setPreviewDevice}
              updateSection={updateSection}
              getManagedCopySection={getManagedCopySection}
              patchSectionItem={patchSectionItem}
              joinPipeList={joinPipeList}
              splitPipeList={splitPipeList}
              renderExactPreview={({ sectionId, content: previewContent, mediaById: previewMediaById, device }) =>
                renderExactCopySectionPreview({ sectionId, content: previewContent, mediaById: previewMediaById, device })
              }
              renderFallbackPreview={({ section, tagsSection, device }) => (
                <CopyOnlySectionPreview section={section} tagsSection={tagsSection} device={device} />
              )}
            />
          </Suspense>
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
            {renderDevicePreviewBlock({
              text: 'כך אזור יצירת הקשר ופרטי ה-SEO ירגישו ללקוח במחשב או במובייל.',
              children: (
                <Suspense fallback={<PreviewLoadingState device={previewDevice} />}>
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
                    publicSiteOrigin={publicSiteOrigin}
                  />
                </Suspense>
              ),
            })}
          </section>
        )}

        {activeView === 'services' && (
          <Suspense fallback={<WorkspaceLoadingState label="טוען את עורך השירותים..." />}>
            <ServicesWorkspace
              content={content}
              mediaById={mediaById}
              visibleMedia={visibleMedia}
              addService={addService}
              updateService={updateService}
              duplicateService={duplicateService}
              archiveService={archiveService}
              restoreService={restoreService}
              joinPipeList={joinPipeList}
              splitPipeList={splitPipeList}
              getMediaLabel={getMediaLabel}
              getMediaSrc={(media) => (media.src ? publicAssetSrcFor(media.src) : '')}
              getUsageKindLabel={getMediaUsageKindLabel}
              getOtherUsages={(mediaId, serviceId) => getMediaUsage(mediaId, content).filter((usage) => usage.kind !== 'service' || usage.id !== serviceId)}
              renderPreviewImage={(media) => <DrivePreviewImage media={media} accessToken={session.accessToken} />}
              renderItemActions={({ isArchived, onDuplicate, onArchive, onRestore }) => renderArchivableItemActions({
                isArchived,
                onDuplicate,
                onArchive,
                onRestore,
              })}
              renderNumberInput={(value, onChange) => <NumberInput value={value} onChange={onChange} />}
              preview={renderDevicePreviewBlock({
                text: 'אפשר לעבור בין מחשב למובייל ולראות איך בחירת החוויה תרגיש ללקוח באתר החי.',
                children: <ServicesPreview content={content} mediaById={mediaById} device={previewDevice} />,
              })}
            />
          </Suspense>
        )}

        {activeView === 'admins' && (
          <Suspense fallback={<WorkspaceLoadingState label="טוען את מסך האדמינים..." />}>
            <AdminsWorkspace
              admins={studioAdmins}
              currentEmail={session.email}
              isBusy={isBusy}
              onSaveAdmins={saveStudioAdmins}
            />
          </Suspense>
        )}

        {activeView === 'gallery' && (
          <section className="workspace-panel">
            <PanelHeader
              title="ניהול תמונות"
              text="כאן מנהלים את כל התמונות הזמינות: מעלים, בודקים פרטים, מחליפים מקור, ומבינים איפה כל תמונה מופיעה באתר."
              action={
                <button className="compact-button" onClick={normalizeCmsMetadata}>
                  <Wand2 aria-hidden="true" />
                  ניקוי מדיה
                </button>
              }
            />
            <Suspense fallback={<WorkspaceLoadingState label="טוען את ספריית התמונות..." />}>
              <ImageUploadDropzone
                disabled={!canUseGoogle}
                isActive={isImageDropActive}
                onDragStateChange={setIsImageDropActive}
                onDrop={handleImageDrop}
                onUpload={handleUpload}
              />
              <ImagesLibraryToolbar
                query={query}
                onQueryChange={setQuery}
                totalCount={visibleMedia.length}
                filteredCount={filteredMedia.length}
                filter={mediaFilter}
                onFilterChange={setMediaFilter}
                selectedCount={bulkSelectedMedia.length}
                areAllVisibleSelected={areAllVisibleSelected}
                onToggleSelectAll={toggleSelectAllVisibleMedia}
                onArchiveSelected={archiveSelectedMedia}
                onRestoreSelected={restoreSelectedMedia}
                filterLabels={mediaLibraryFilterLabels}
              />
              <div className="images-library-layout">
                <div className="images-grid-scroll-pane">
                  <ImagesGrid
                    items={filteredMedia}
                    selectedMediaId={activeSelectedMedia?.id ?? null}
                    selectedMediaIds={selectedMediaIds}
                    onSelect={setSelectedMediaId}
                    onToggleSelect={toggleSelectedMedia}
                    getMediaLabel={(media) => getMediaLabel(media, content)}
                    renderPreview={(media) => <DrivePreviewImage media={media} accessToken={session.accessToken} showActions={false} />}
                  />
                </div>
                <div className="image-details-scroll-pane">
                  <ImageDetailsPanel
                    key={activeSelectedMedia?.id ?? 'empty-image-details'}
                    media={activeSelectedMedia}
                    content={content}
                    canUseGoogle={canUseGoogle}
                    onRename={renameMedia}
                    onSaveTitle={saveMediaTitle}
                    onUpdate={updateMedia}
                    onPickDriveFile={handlePickDriveFile}
                    onNavigateToSiteMap={() => setActiveView('site-map')}
                    onNavigateToUsage={(kind) => setActiveView(getViewForUsage(kind as MediaUsageKind))}
                    getMediaLabel={(media) => getMediaLabel(media, content)}
                    getMediaStatus={getMediaStatus}
                    getMediaUsages={(mediaId) => getMediaUsage(mediaId, content)}
                    getUsageKindLabel={(kind) => getMediaUsageKindLabel(kind as MediaUsageKind)}
                    renderPreview={(media, showActions) => <DrivePreviewImage media={media} accessToken={session.accessToken} showActions={showActions} />}
                    renderItemActions={(media) => renderArchivableItemActions({
                      isArchived: Boolean(media.deletedAt),
                      onArchive: () => archiveMedia(media.id),
                      onRestore: () => restoreMedia(media.id),
                    })}
                    renderMediaRiskNotice={(mediaId) => <MediaRiskNotice mediaId={mediaId} content={content} />}
                    renderNumberInput={(value, onChange) => <NumberInput value={value} onChange={onChange} />}
                  />
                </div>
              </div>
            </Suspense>
          </section>
        )}

        {activeView === 'real-media' && (
          <Suspense fallback={<WorkspaceLoadingState label="טוען את עורך הווידאו..." />}>
            <CopyOnlySectionEditor
              content={content}
              mediaById={mediaById}
              sectionId="real-media"
              title="וידאו אמיתי"
              text="כותרת וטקסט לאזור הווידאו. אם האזור לא משרת את האתר, אפשר לכבות אותו כאן במקום להשאיר אותו לא ברור."
              previewDevice={previewDevice}
              onPreviewDeviceChange={setPreviewDevice}
              updateSection={updateSection}
              getManagedCopySection={getManagedCopySection}
              patchSectionItem={patchSectionItem}
              joinPipeList={joinPipeList}
              splitPipeList={splitPipeList}
              renderExactPreview={({ sectionId, content: previewContent, mediaById: previewMediaById, device }) =>
                renderExactCopySectionPreview({ sectionId, content: previewContent, mediaById: previewMediaById, device })
              }
              renderFallbackPreview={({ section, tagsSection, device }) => (
                <CopyOnlySectionPreview section={section} tagsSection={tagsSection} device={device} />
              )}
            />
          </Suspense>
        )}

        {sectionGroupWorkspaceDefinitions
          .filter((definition) => definition.view === activeView)
          .map((definition) => (
            <Suspense key={definition.view} fallback={<WorkspaceLoadingState label={`טוען את אזור "${definition.title}"...`} />}>
              <SectionGroupWorkspace
                definition={definition}
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
                sectionGroupLabels={sectionGroupLabels}
                joinPipeList={joinPipeList}
                splitPipeList={splitPipeList}
                renderItemActions={renderSectionEditorItemActions}
                renderPreview={renderSectionGroupPreview}
              />
            </Suspense>
          ))}

        {activeView === 'manifesto' && (
          <Suspense fallback={<WorkspaceLoadingState label="טוען את עורך המניפסט..." />}>
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
              manifestoMediaFallbacks={manifestoMediaFallbacks}
              patchSectionItem={patchSectionItem}
              mediaLabel={getMediaLabel}
              renderPreview={({ content: previewContent, mediaById: previewMediaById, device }) => (
                <ManifestoSitePreview content={previewContent} mediaById={previewMediaById} device={device} />
              )}
              renderItemActions={renderSectionEditorItemActions}
              renderMediaQuickPicker={({ label, mediaItems, selectedMediaId, content: previewContent, onSelect }) => (
                <MediaQuickPicker
                  label={label}
                  mediaItems={mediaItems}
                  selectedMediaId={selectedMediaId}
                  onSelect={onSelect}
                  getMediaLabel={(media) => getMediaLabel(media, previewContent)}
                  getMediaSrc={(media) => (media.src ? publicAssetSrcFor(media.src) : '')}
                />
              )}
              renderMediaSelectionUsageNotice={({ mediaId, content: previewContent, currentUsage }) => (
                <MediaSelectionUsageNotice
                  otherUsages={getMediaUsage(mediaId, previewContent).filter((usage) => usage.kind !== currentUsage.kind || usage.id !== currentUsage.id)}
                  getUsageKindLabel={getMediaUsageKindLabel}
                />
              )}
            />
          </Suspense>
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
            publicSiteOrigin={publicSiteOrigin}
          />
        )}

        {activeView === 'media' && (
          <section className="workspace-panel">
            <PanelHeader
              title="גלריה באתר"
              text="כאן עורכים את מה שהלקוח רואה בגלריה הציבורית: סדר, שם, תיאור, קטגוריה ובחירת התמונה שמחוברת לכל פריט."
              action={
                <button className="compact-button" onClick={() => addGalleryItem()}>
                  <ImagePlus aria-hidden="true" />
                  הוספת פריט לגלריה
                </button>
              }
            />
            {renderDevicePreviewBlock({
              text: 'כך התמונות הראשונות בגלריה יופיעו במחשב או במובייל אחרי פרסום.',
              wrapInColumn: false,
              children: (
                <Suspense fallback={<PreviewLoadingState device={previewDevice} />}>
                  <GallerySitePreview content={content} mediaById={mediaById} device={previewDevice} />
                </Suspense>
              ),
            })}
            <label className="search-box">
              <Search aria-hidden="true" />
              <input value={siteGalleryQuery} onChange={(event) => setSiteGalleryQuery(event.target.value)} placeholder="חיפוש לפי שם, תיאור או קטגוריה" />
            </label>
            <div className="subsection-heading gallery-area-heading is-site-gallery">
              <div>
                <p className="kicker">גלריה ציבורית</p>
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
                        {renderArchivableItemActions({
                          isArchived: Boolean(item.deletedAt),
                          onDuplicate: () => duplicateGalleryItem(item),
                          onArchive: () => archiveGalleryItem(item.id),
                          onRestore: () => restoreGalleryItem(item.id),
                        })}
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
                          {visibleMedia.map((mediaItem) => <option key={mediaItem.id} value={mediaItem.id}>{getMediaLabel(mediaItem, content)}</option>)}
                        </select>
                      </Field>
                    </div>
                    <MediaQuickPicker
                      label="בחירה מהירה לתמונת הגלריה"
                      mediaItems={visibleMedia}
                      selectedMediaId={item.mediaId}
                      onSelect={(mediaId) => updateGallery(item.id, { mediaId })}
                      getMediaLabel={(media) => getMediaLabel(media, content)}
                      getMediaSrc={(media) => (media.src ? publicAssetSrcFor(media.src) : '')}
                    />
                    <MediaSelectionUsageNotice
                      otherUsages={getMediaUsage(item.mediaId, content).filter((usage) => usage.kind !== 'gallery' || usage.id !== item.id)}
                      getUsageKindLabel={getMediaUsageKindLabel}
                    />
                    <div className="toggle-row">
                      <Toggle checked={item.active} label="מוצג באתר" onChange={(checked) => updateGallery(item.id, { active: checked })} />
                      <Toggle checked={item.tall} label="תמונה גבוהה" onChange={(checked) => updateGallery(item.id, { tall: checked })} />
                    </div>
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

const DrivePreviewImage = ({
  media,
  accessToken,
  showActions = true,
}: {
  readonly media?: ImageAssetRecord;
  readonly accessToken: string;
  readonly showActions?: boolean;
}) => {
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
      {media && showActions && (
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

const Metric = ({ label, value }: { readonly label: string; readonly value: string }) => (
  <article>
    <span>{label}</span>
    <strong>{value}</strong>
  </article>
);


const MediaRiskNotice = ({ mediaId, content }: { readonly mediaId: string; readonly content: ContentSnapshot }) => {
  const activeUsages = getActiveMediaUsages(mediaId, content);

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

const NumberInput = ({ value, onChange }: { readonly value: number; readonly onChange: (value: number) => void }) => (
  <input type="number" value={value} min={0} onChange={(event) => onChange(Number(event.target.value))} />
);
