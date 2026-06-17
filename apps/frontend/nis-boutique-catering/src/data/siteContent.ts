import {
  ArrowLeft,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChefHat,
  Clock,
  ClipboardList,
  Gift,
  HeartHandshake,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Play,
  Send,
  Sparkles,
  Utensils,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { contentSnapshot } from '../generated/siteContent.generated';

export const phoneDisplay = '050-3502615';
export const phoneHref = 'tel:+972503502615';
export const email = 'nisboutiquecatering@gmail.com';
export const whatsappBase = 'https://wa.me/972503502615';
export const siteVersion = 'v0.1.1';

export const sectionIds = ['top', 'experiences', 'gallery', 'process', 'contact'] as const;

export interface ImageAsset {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly sizes?: string;
  readonly responsive?: boolean;
}

export const brandMedia = {
  logo: {
    src: '/brand/nis-logo.svg',
    width: 1060,
    height: 610,
  },
  socialCard: {
    src: '/brand/nis-logo-card.jpg',
    width: 945,
    height: 630,
  },
} as const satisfies Record<string, ImageAsset>;

export const foodMedia = {
  saladCupsClose: {
    src: '/media/food/nis-salad-cups-close.jpeg',
    width: 1080,
    height: 1920,
    sizes: '(max-width: 720px) 100vw, 50vw',
    responsive: true,
  },
  saladCupsBranded: {
    src: '/media/food/nis-salad-cups-branded.jpeg',
    width: 1080,
    height: 1920,
    sizes: '(max-width: 720px) 100vw, 50vw',
    responsive: true,
  },
  mezzeTrayClose: {
    src: '/media/food/events/mezze-tray-close.webp',
    width: 1500,
    height: 2000,
    sizes: '(max-width: 720px) 100vw, 33vw',
    responsive: true,
  },
  hostingTableOverview: {
    src: '/media/food/events/quiche-tart-clean.webp',
    width: 721,
    height: 1280,
    sizes: '(max-width: 720px) 100vw, 50vw',
    responsive: true,
  },
  tableSettingBlueGold: {
    src: '/media/food/events/table-setting-blue-gold.webp',
    width: 1500,
    height: 2000,
    sizes: '(max-width: 720px) 100vw, 33vw',
    responsive: true,
  },
  coffeeStation: {
    src: '/media/food/events/coffee-station.webp',
    width: 2000,
    height: 1500,
    sizes: '(max-width: 720px) 100vw, 33vw',
    responsive: true,
  },
  eventBuffetSaladRolls: {
    src: '/media/food/events/event-buffet-salad-rolls.webp',
    width: 1200,
    height: 1600,
    sizes: '(max-width: 720px) 100vw, 33vw',
    responsive: true,
  },
  dipsTrayClose: {
    src: '/media/food/events/dips-tray-close.webp',
    width: 1500,
    height: 2000,
    sizes: '(max-width: 720px) 100vw, 33vw',
    responsive: true,
  },
  salmonSkewersLemon: {
    src: '/media/food/events/salmon-skewers-lemon.webp',
    width: 1500,
    height: 2000,
    sizes: '(max-width: 720px) 100vw, 45vw',
    responsive: true,
  },
  vegetableFocaccia: {
    src: '/media/food/events/vegetable-focaccia.webp',
    width: 2000,
    height: 1500,
    sizes: '(max-width: 720px) 100vw, 33vw',
    responsive: true,
  },
  miniSandwiches: {
    src: '/media/food/events/mini-burger-trays.webp',
    width: 899,
    height: 1599,
    sizes: '(max-width: 720px) 100vw, 33vw',
    responsive: true,
  },
  roastedVegetables: {
    src: '/media/food/events/roasted-vegetables.webp',
    width: 1500,
    height: 2000,
    sizes: '(max-width: 720px) 100vw, 33vw',
    responsive: true,
  },
  salmonSkewersClose: {
    src: '/media/food/events/salmon-skewers-close.webp',
    width: 1500,
    height: 2000,
    sizes: '(max-width: 720px) 100vw, 33vw',
    responsive: true,
  },
  purpleCabbageSalad: {
    src: '/media/food/events/purple-cabbage-salad.webp',
    width: 1500,
    height: 2000,
    sizes: '(max-width: 720px) 100vw, 33vw',
    responsive: true,
  },
  coffeeServiceClose: {
    src: '/media/food/events/coffee-service-close.webp',
    width: 1500,
    height: 2000,
    sizes: '(max-width: 720px) 100vw, 33vw',
    responsive: true,
  },
  capreseSaladBowl: {
    src: '/media/food/events/caprese-salad-bowl.webp',
    width: 1500,
    height: 2000,
    sizes: '(max-width: 720px) 100vw, 33vw',
    responsive: true,
  },
  roastedZucchiniSalad: {
    src: '/media/food/events/roasted-zucchini-salad.webp',
    width: 1500,
    height: 2000,
    sizes: '(max-width: 720px) 100vw, 33vw',
    responsive: true,
  },
} as const;

export const videoMedia = {
  saladCupsPrep: '/media/food/nis-salad-cups-prep.mp4',
  eventVideo: '/media/food/events/nis-event-table-video.mp4',
} as const;

export interface NavItem {
  readonly label: string;
  readonly href: string;
}

export interface Service {
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly bestFor: string;
  readonly promise: string;
  readonly details: readonly string[];
  readonly cta: string;
  readonly image: ImageAsset;
  readonly icon: LucideIcon;
}

export interface SimpleCard {
  readonly title: string;
  readonly text: string;
  readonly icon: LucideIcon;
}

export interface EditorialCard extends SimpleCard {
  readonly label: string;
  readonly image: ImageAsset;
}

export interface StoryMoment {
  readonly title: string;
  readonly text: string;
}

export interface MenuGroup {
  readonly title: string;
  readonly intro: string;
  readonly items: readonly string[];
}

export type GalleryCategory = 'all' | 'tables' | 'trays' | 'salads' | 'coffee' | 'fish';

export interface GalleryImage {
  readonly title: string;
  readonly alt: string;
  readonly image: ImageAsset;
  readonly category: GalleryCategory;
  readonly tall?: boolean;
}

export const navItems: readonly NavItem[] = [
  { label: 'מה מזמינים', href: '#experiences' },
  { label: 'גלריה', href: '#gallery' },
  { label: 'איך זה עובד', href: '#process' },
  { label: 'יצירת קשר', href: '#contact' },
];

export const galleryCategories: readonly Readonly<{ id: GalleryCategory; label: string }>[] = [
  { id: 'all', label: 'הכל' },
  { id: 'tables', label: 'שולחנות' },
  { id: 'trays', label: 'מגשים' },
  { id: 'salads', label: 'סלטים' },
  { id: 'fish', label: 'דגים' },
  { id: 'coffee', label: 'קפה' },
];

export const services: readonly Service[] = [
  {
    title: 'ניס בטעם של שבת',
    subtitle: 'להכניס את השבת ברוגע, להתענג על הטעם.',
    description:
      'תפריט שבת עשיר שמגיע מוכן, מסודר וברור להגשה, עם טעם ביתי וגימור בוטיקי שמוריד עומס לפני שבת.',
    bestFor: 'משפחות, זוגות ומארחים שרוצים שבת רגועה בלי לוותר על שולחן עשיר.',
    promise: 'מגיע מוכן, מסודר וברור להגשה, עם התאמה לכמות הסועדים ולאופי השבת.',
    details: ['סלטים', 'דגים', 'עיקריות', 'תוספות', 'חלות', 'קינוחים', 'מנות בהתאמה אישית'],
    cta: 'להזמנת תפריט שבת',
    image: foodMedia.salmonSkewersLemon,
    icon: ChefHat,
  },
  {
    title: 'ניס בכיס',
    subtitle: 'אירוח קטן, רושם גדול.',
    description:
      'מגשי אירוח ופינגר פוד לאירועים קטנים, הרמות כוסית, ישיבות ואירוח משפחתי שרוצה להיראות מוקפד מהרגע הראשון.',
    bestFor: 'מפגשים משפחתיים, אירועים קטנים, הרמות כוסית ואירוח עסקי מוקפד.',
    promise: 'מגשים שנפתחים יפה, נראים חגיגיים על השולחן ונוחים לאכילה בעמידה או סביב שולחן.',
    details: ['אירועים קטנים', 'בראנצ׳ים', 'מפגשים משפחתיים', 'אירוח עסקי', 'שולחנות חגיגיים'],
    cta: 'דברו איתנו על מגשי אירוח',
    image: foodMedia.hostingTableOverview,
    icon: Utensils,
  },
  {
    title: 'Travel Nis',
    subtitle: 'פינוק בוטיק שלוקחים איתכם.',
    description:
      'מארזי דרך ופיקניק מוקפדים, ארוזים יפה ונוח, עם אוכל טרי ומפנק לטיולים, נסיעות וימי כיף.',
    bestFor: 'נסיעות משפחתיות, ימי כיף, פיקניקים, טיולים ורגעים שמתחילים כבר בדרך.',
    promise: 'אוכל ארוז חכם, יפה ונוח לנשיאה, כדי שהדרך עצמה תרגיש כמו חלק מהחוויה.',
    details: ['פיקניק זוגי', 'טיול משפחתי', 'יום הולדת בטבע', 'נסיעות ארוכות', 'ימי חופש'],
    cta: 'להזמנת מארז דרך',
    image: foodMedia.miniSandwiches,
    icon: Package,
  },
];

export const editorialCards: readonly EditorialCard[] = [
  {
    label: 'שבתות',
    title: 'אוכל ביתי מוקפד לשבת שנכנסת ברוגע',
    text: 'תפריטי שבת עשירים, מסודרים ויפים להגשה, כדי שהבית ירגיש מלא בלי שכל העומס יישב עליכם.',
    icon: ChefHat,
    image: foodMedia.salmonSkewersLemon,
  },
  {
    label: 'אירועים קטנים',
    title: 'שולחן שנפתח יפה ומייצר רושם כבר בדקה הראשונה',
    text: 'מגשי אירוח, פינגר פוד ושולחנות קטנים עם הגשה אסתטית שמתאימה למשפחה, מפגש או אירוח עסקי.',
    icon: Sparkles,
    image: foodMedia.hostingTableOverview,
  },
  {
    label: 'מארזים ודרך',
    title: 'Travel Nis לפינוקים שלוקחים אתכם הלאה',
    text: 'מארזים נוחים, חכמים ויפים לנסיעות, טיולים וימי כיף, כך שהחוויה מתחילה כבר בדרך.',
    icon: Gift,
    image: foodMedia.miniSandwiches,
  },
];

export const audienceCards: readonly SimpleCard[] = [
  {
    title: 'למשפחות שמארחות שבת',
    text: 'למי שרוצה שולחן מכובד, מלא ויפה בלי לעמוד שעות במטבח ובלי להיכנס ללחץ לפני שבת.',
    icon: Users,
  },
  {
    title: 'לאירועים קטנים ומוקפדים',
    text: 'לזוגות, משפחות ומארחים שמתכננים שמחה קטנה, ברית, שבע ברכות או מפגש משפחתי עם נראות טובה ושקט תפעולי.',
    icon: HeartHandshake,
  },
  {
    title: 'למארזים, דרך ומתנה',
    text: 'למי שרוצה לשלוח או לקחת משהו יפה, טעים ומכובד לדרך, לשבת, לאורחים או ליום מיוחד.',
    icon: Gift,
  },
];

export const boutiqueReasons: readonly SimpleCard[] = [
  {
    title: 'התאמה בשיחה קצרה',
    text: 'סוג האירוח, מספר הסועדים והתאריך הופכים מהר לכיוון ברור שאפשר להתקדם איתו.',
    icon: ClipboardList,
  },
  {
    title: 'נראות שמוכנה לשולחן',
    text: 'מגשים, מארזים וסידור שמרגישים יפים כבר בפתיחה, בלי עבודה מיותרת מצד המארח.',
    icon: Sparkles,
  },
  {
    title: 'יחס אישי ולא תעשייתי',
    text: 'אין מסלול גנרי. יש תיאום, הקשבה ותשומת לב לפרטים שחשובים לאירוח שלכם.',
    icon: HeartHandshake,
  },
  {
    title: 'טעם ביתי בגימור בוטיק',
    text: 'החיבור בין אוכל חם ומוכר לבין אריזה, צבעים וסידור שמרגישים חגיגיים יותר.',
    icon: Package,
  },
];

export const manifestoMoments: readonly Readonly<{
  label: string;
  title: string;
  text: string;
  image: ImageAsset;
}>[] = [
  {
    label: '01',
    title: 'שולחן שנראה מסודר עוד לפני שנוגעים בו',
    text: 'ההגשה, הצבעים והקצב של השולחן הם חלק מהחוויה, לא רק הרקע של האוכל.',
    image: foodMedia.hostingTableOverview,
  },
  {
    label: '02',
    title: 'אוכל שמרגיש ביתי, אבל לא יומיומי',
    text: 'הטעם נשאר חם ומוכר, אבל ההופעה, האריזה והדיוק נותנים תחושת occasion.',
    image: foodMedia.dipsTrayClose,
  },
  {
    label: '03',
    title: 'התאמה אישית במקום פס ייצור',
    text: 'החוויה נבנית סביב האירוח שלכם, לא סביב קטלוג אחיד שצריך להסתדר איתו.',
    image: foodMedia.tableSettingBlueGold,
  },
];

export const processSteps: readonly SimpleCard[] = [
  {
    title: 'שולחים הודעה בוואטסאפ',
    text: 'אפשר ללחוץ על וואטסאפ או לשלוח את הטופס המסודר בתחתית האתר.',
    icon: MessageCircle,
  },
  {
    title: 'מחדדים סוג אירוח וכמות',
    text: 'בוחרים שבת, מגשי אירוח או Travel Nis, ומוסיפים תאריך, כמות וכיוון כללי.',
    icon: CalendarDays,
  },
  {
    title: 'מקבלים הצעה או תפריט מותאם',
    text: 'מקבלים כיוון שמתאים לאירוח, למספר הסועדים ולרמת ההגשה הרצויה.',
    icon: ClipboardList,
  },
  {
    title: 'סוגרים פרטים ומקבלים מוכן להגשה',
    text: 'מסכמים תאריך, אופן קבלה והתאמות, ואז מקבלים אוכל מסודר ונוח להגשה.',
    icon: CheckCircle2,
  },
];

export const menuGroups: readonly MenuGroup[] = [
  {
    title: 'תפריט שבת לדוגמה',
    intro: 'כיוון לשולחן שבת שמרגיש מלא, מכובד ונוח להגשה.',
    items: ['מבחר סלטים לשולחן', 'דגים לשבת', 'עיקריות חמות', 'תוספות וסירים משפחתיים', 'חלות וקינוחים'],
  },
  {
    title: 'מגשי אירוח ופינגר פוד',
    intro: 'פתרון לאירוח קטן שרוצה להרגיש מוקפד ולא גנרי.',
    items: ['מגש מלוח מעוצב', 'מיני קישים ומאפים אישיים', 'כריכונים וביסים קטנים', 'בראנץ׳ בוטיק למשפחה', 'קינוחים אישיים'],
  },
  {
    title: 'Travel Nis לדרך',
    intro: 'מארזים יפים ונוחים לרגעים מיוחדים שמתחילים כבר ביציאה מהבית.',
    items: ['ערכת פיקניק זוגית', 'ערכת דרך משפחתית', 'מארז נסיעה מפנק לילדים', 'מארז יום כיף', 'פתרון מותאם לטיול או יציאה'],
  },
];

export const storyMoments: readonly StoryMoment[] = [
  {
    title: 'מהרובע היהודי',
    text: 'שנים של סמטאות אבן, בתים פתוחים וריח של שבת בנו אצל יהודית שפה של אירוח שיש בו נשמה, סדר וחום.',
  },
  {
    title: 'אל המטבח של Nis',
    text: 'הזיכרון הזה הופך למטבח מוקפד: חומרי גלם טריים, טעמים מדויקים, אריזה יפה ותחושה שמישהו חשב עליכם באמת.',
  },
  {
    title: 'עד השולחן שלכם',
    text: 'המטרה פשוטה: שתוכלו לארח ברוגע, לפתוח את המארז או המגש, ולהרגיש שהאוכל כבר מספר את הסיפור הנכון.',
  },
];

export const coordinationCards: readonly SimpleCard[] = [
  {
    title: 'אזור פעילות זמני',
    text: 'ביתר עילית כבסיס פעילות. איסוף ומשלוחים בסביבה נבדקים בכל פנייה לפי תאריך ומיקום.',
    icon: MapPin,
  },
  {
    title: 'זמן פנייה מומלץ',
    text: 'לשבתות, חגים ואירועים כדאי לפנות כמה שיותר מוקדם כדי להשאיר מקום להתאמה אישית.',
    icon: CalendarDays,
  },
  {
    title: 'הצעת מחיר',
    text: 'אין מחירים באתר כרגע. מקבלים הצעה מותאמת אחרי הבנת סוג האירוח והכמות.',
    icon: Users,
  },
  {
    title: 'אישור תפריט',
    text: 'אחרי שיחה קצרה מסכמים כיוון, התאמות, תאריך ואופן קבלה לפני סגירת ההזמנה.',
    icon: ClipboardList,
  },
];

const fallbackGalleryImages: readonly GalleryImage[] = [
  {
    title: 'שולחן אירוח מוכן',
    alt: 'שולחן אירוח מסודר עם מגשי ירקות, סלטים, כריכונים וכלי הגשה',
    image: foodMedia.hostingTableOverview,
    category: 'tables',
    tall: true,
  },
  {
    title: 'בופה אירוח חגיגי',
    alt: 'שולחן בופה עם סלטים אישיים, רולים, מאפים ומנות אירוח מוגשות על סטנדים',
    image: foodMedia.eventBuffetSaladRolls,
    category: 'tables',
    tall: true,
  },
  {
    title: 'שיפודי סלמון בלימון',
    alt: 'מגש שיפודי סלמון עם פרוסות לימון על מצע ירוק',
    image: foodMedia.salmonSkewersLemon,
    category: 'fish',
    tall: true,
  },
  {
    title: 'פוקצ׳ה ירקות צבעונית',
    alt: 'פוקצ׳ה חתוכה עם ירקות קלויים וגבינה',
    image: foodMedia.vegetableFocaccia,
    category: 'trays',
  },
  {
    title: 'מיני לחמניות אישיות',
    alt: 'מגשים שחורים עם מיני לחמניות אישיות, שומשום, ירקות וסיכות במבוק',
    image: foodMedia.miniSandwiches,
    category: 'trays',
    tall: true,
  },
  {
    title: 'סלט קפרזה אישי',
    alt: 'קערת סלט עם עגבניות שרי, מוצרלה, רוטב ירוק ושקית בוטנים',
    image: foodMedia.capreseSaladBowl,
    category: 'salads',
    tall: true,
  },
  {
    title: 'ירקות קלויים צבעוניים',
    alt: 'מגש ירקות קלויים עם פלפלים, ברוקולי, פטריות, בצל וחצילים',
    image: foodMedia.roastedVegetables,
    category: 'trays',
    tall: true,
  },
  {
    title: 'מטבלים למרכז השולחן',
    alt: 'מגש מטבלים עם זיתים, סלט טונה, מטבל לבן ומטבל כתום',
    image: foodMedia.dipsTrayClose,
    category: 'trays',
  },
  {
    title: 'מגש גבינות ומטבלים',
    alt: 'מגש מחולק עם זיתים, קוביות גבינה, מטבל עגבניות וחמאה',
    image: foodMedia.mezzeTrayClose,
    category: 'trays',
    tall: true,
  },
  {
    title: 'סלט כרוב סגול',
    alt: 'קערת סלט כרוב סגול עם בצל ירוק, רוטב ושקית אגוזים',
    image: foodMedia.purpleCabbageSalad,
    category: 'salads',
    tall: true,
  },
  {
    title: 'סלט זוקיני ופטריות',
    alt: 'קערת סלט עם זוקיני קלוי, פטריות, גבינה ורוטב',
    image: foodMedia.roastedZucchiniSalad,
    category: 'salads',
    tall: true,
  },
  {
    title: 'שיפודי סלמון מקרוב',
    alt: 'תקריב של שיפודי סלמון עם עשבי תיבול ולימון',
    image: foodMedia.salmonSkewersClose,
    category: 'fish',
    tall: true,
  },
  {
    title: 'עמדת קפה ותה',
    alt: 'עמדת קפה עם מיחם, חלב, כוסות, סכו"ם וסוכר',
    image: foodMedia.coffeeStation,
    category: 'coffee',
  },
  {
    title: 'ערכת קפה מוקפדת',
    alt: 'קופסת תיונים, סוכר וסכו"ם לצד מיחם לשירות קפה',
    image: foodMedia.coffeeServiceClose,
    category: 'coffee',
    tall: true,
  },
  {
    title: 'שולחן ערוך באירוע',
    alt: 'שולחן ערוך עם מפה זהובה, צלחות כחולות ומפיות תכלת',
    image: foodMedia.tableSettingBlueGold,
    category: 'tables',
    tall: true,
  },
];

const generatedMediaById = new Map(contentSnapshot.media.map((asset) => [asset.id, asset]));

const generatedGalleryImages = contentSnapshot.gallery
  .filter((item) => item.active)
  .sort((left, right) => left.order - right.order)
  .map((item): GalleryImage | undefined => {
    const image = generatedMediaById.get(item.mediaId);

    if (!image) {
      return undefined;
    }

    return {
      title: item.title,
      alt: item.alt,
      image,
      category: item.category as GalleryCategory,
      tall: item.tall,
    };
  })
  .filter((item): item is GalleryImage => Boolean(item));

export const galleryImages: readonly GalleryImage[] =
  generatedGalleryImages.length > 0 ? generatedGalleryImages : fallbackGalleryImages;

export const heroStats: readonly Readonly<{ value: string; label: string }>[] = [
  { value: 'שבתות', label: 'אוכל ביתי מוקפד, מוכן להגשה' },
  { value: 'אירוח קטן', label: 'מגשים ושולחנות שנראים כמו בוטיק' },
  { value: 'Travel Nis', label: 'מארזים חכמים לדרך ולרגעים מיוחדים' },
];

export const heroSceneNotes: readonly Readonly<{ title: string; text: string }>[] = [
  {
    title: 'אירוח מוכן להגשה',
    text: 'כל מגש מגיע מסודר כך שהשולחן נראה נכון כבר מהרגע הראשון.',
  },
  {
    title: 'שיחה קצרה, התאמה אישית',
    text: 'מספר סועדים, סוג האירוח והאווירה שאתם רוצים יוצרים יחד את הכיוון.',
  },
];

export const heroMarquee: readonly string[] = [
  'שולחן שנפתח יפה',
  'אוכל ביתי מוקפד',
  'מגשי אירוח אלגנטיים',
  'Travel Nis',
  'ביתר עילית',
  'אריזה שנראית כמו מותג',
];

export const signatureMoments: readonly Readonly<{ title: string; text: string; image: ImageAsset }>[] = [
  {
    title: 'שולחן שנפתח יפה',
    text: 'מגשים, צבעים וכלי הגשה שמרגישים מוכנים לאורחים כבר מהרגע הראשון.',
    image: foodMedia.hostingTableOverview,
  },
  {
    title: 'ביסים קטנים, רושם גדול',
    text: 'פינגר פוד, כריכונים ומנות אישיות שנוחים להגשה, לצילום ולאכילה.',
    image: foodMedia.miniSandwiches,
  },
  {
    title: 'פרטים שמרגישים בוטיק',
    text: 'קפה, עריכה, אריזה ותיאום קטן שמסדרים את כל החוויה סביבכם.',
    image: foodMedia.coffeeServiceClose,
  },
];

export const facts: readonly string[] = [
  'אזור פעילות זמני: ביתר עילית והסביבה, בתיאום מול הלקוח.',
  'להזמנות שבת ואירועים מומלץ לפנות מוקדם ככל האפשר.',
  'לא מוצגים מחירים באתר; כל הזמנה מקבלת הצעה מותאמת לאחר שיחה קצרה.',
  'אפשר לדבר על העדפות, רגישויות והתאמות תפריט לפי הצורך.',
];

export const seoTopics: readonly string[] = [
  'קייטרינג בוטיק בביתר עילית',
  'תפריט שבת מוכן ומסודר',
  'מגשי אירוח לאירועים קטנים',
  'פינגר פוד והרמות כוסית',
  'מארזי פיקניק ומארזי דרך',
  'אירוח משפחתי בהתאמה אישית',
];

export const trustCards: readonly SimpleCard[] = [
  {
    title: 'אסתטיקה שמגיעה מוכנה',
    text: 'המנות נארזות ומסודרות כך שהשולחן נראה מוקפד בלי עבודה מיותרת מצדכם.',
    icon: Sparkles,
  },
  {
    title: 'התאמה לפני סגירה',
    text: 'לפני שמתקדמים עוברים יחד על סוג האירוח, מספר הסועדים והעדפות חשובות.',
    icon: ClipboardList,
  },
  {
    title: 'שיחה אישית, לא תפריט גנרי',
    text: 'כל פנייה מקבלת מענה לפי התאריך, המיקום והחוויה שאתם רוצים ליצור.',
    icon: HeartHandshake,
  },
];

export const faqs: readonly Readonly<{ question: string; answer: string }>[] = [
  {
    question: 'כמה זמן מראש צריך להזמין?',
    answer: 'מומלץ לפנות כמה שיותר מוקדם, במיוחד לפני שבתות, חגים ואירועים עם מספר סועדים גדול.',
  },
  {
    question: 'האם יש משלוחים?',
    answer: 'העסק פועל מביתר עילית. משלוח או איסוף בסביבה נבדקים מול הלקוח לפי מיקום, תאריך וסוג הזמנה.',
  },
  {
    question: 'האם אפשר להרכיב תפריט אישי?',
    answer: 'כן. כל הזמנה נבנית אחרי שיחה קצרה כדי להתאים את התפריט לאירוח, לסועדים ולסגנון המבוקש.',
  },
  {
    question: 'האם אפשר להתחשב ברגישויות או בהעדפות?',
    answer: 'כן. מעלים רגישויות, אלרגיות או העדפות בתחילת השיחה, ובודקים יחד מה אפשר להתאים בפועל.',
  },
  {
    question: 'האם אפשר להזמין לאירועים עסקיים?',
    answer: 'כן. Nis בכיס מתאימה גם להרמות כוסית, ישיבות, אירוח עסקי ושולחנות קטנים ומוקפדים.',
  },
  {
    question: 'האם יש מינימום הזמנה?',
    answer: 'מינימום הזמנה ייקבע בשיחה לפי סוג השירות, התאריך והיקף האירוח.',
  },
];

export const iconSet = {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Play,
  Send,
} as const;
