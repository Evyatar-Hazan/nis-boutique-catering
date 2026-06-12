import { type CSSProperties, type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
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
  X,
  type LucideIcon,
} from 'lucide-react';
import './App.css';

const phoneDisplay = '050-3502615';
const phoneHref = 'tel:+972503502615';
const email = 'nisboutiquecatering@gmail.com';
const whatsappBase = 'https://wa.me/972503502615';

const foodMedia = {
  saladCupsClose: '/media/food/nis-salad-cups-close.jpeg',
  saladCupsBranded: '/media/food/nis-salad-cups-branded.jpeg',
  saladCupsPrep: '/media/food/nis-salad-cups-prep.mp4',
  eventVideo: '/media/food/events/nis-event-table-video.mp4',
  mezzeTrayClose: '/media/food/events/mezze-tray-close.webp',
  hostingTableOverview: '/media/food/events/hosting-table-overview.webp',
  tableSettingBlueGold: '/media/food/events/table-setting-blue-gold.webp',
  coffeeStation: '/media/food/events/coffee-station.webp',
  dipsTrayClose: '/media/food/events/dips-tray-close.webp',
  salmonSkewersLemon: '/media/food/events/salmon-skewers-lemon.webp',
  vegetableFocaccia: '/media/food/events/vegetable-focaccia.webp',
  miniSandwiches: '/media/food/events/mini-sandwiches.webp',
  roastedVegetables: '/media/food/events/roasted-vegetables.webp',
  salmonSkewersClose: '/media/food/events/salmon-skewers-close.webp',
  purpleCabbageSalad: '/media/food/events/purple-cabbage-salad.webp',
  coffeeServiceClose: '/media/food/events/coffee-service-close.webp',
  capreseSaladBowl: '/media/food/events/caprese-salad-bowl.webp',
  roastedZucchiniSalad: '/media/food/events/roasted-zucchini-salad.webp',
} as const;

interface NavItem {
  readonly label: string;
  readonly href: string;
}

interface Service {
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly bestFor: string;
  readonly promise: string;
  readonly details: readonly string[];
  readonly cta: string;
  readonly image: string;
  readonly icon: LucideIcon;
}

interface SimpleCard {
  readonly title: string;
  readonly text: string;
  readonly icon: LucideIcon;
}

interface EditorialCard extends SimpleCard {
  readonly label: string;
  readonly image: string;
}

interface StoryMoment {
  readonly title: string;
  readonly text: string;
}

interface MenuGroup {
  readonly title: string;
  readonly intro: string;
  readonly items: readonly string[];
}

interface GalleryImage {
  readonly title: string;
  readonly alt: string;
  readonly src: string;
  readonly category: GalleryCategory;
  readonly tall?: boolean;
}

type GalleryCategory = 'all' | 'tables' | 'trays' | 'salads' | 'coffee' | 'fish';

const navItems: readonly NavItem[] = [
  { label: 'החוויות', href: '#experiences' },
  { label: 'איך זה עובד', href: '#process' },
  { label: 'גלריה', href: '#gallery' },
  { label: 'שאלות', href: '#faq' },
  { label: 'יצירת קשר', href: '#contact' },
];

const galleryCategories: readonly Readonly<{ id: GalleryCategory; label: string }>[] = [
  { id: 'all', label: 'הכל' },
  { id: 'tables', label: 'שולחנות' },
  { id: 'trays', label: 'מגשים' },
  { id: 'salads', label: 'סלטים' },
  { id: 'fish', label: 'דגים' },
  { id: 'coffee', label: 'קפה' },
];

const services: readonly Service[] = [
  {
    title: 'ניס בטעם של שבת',
    subtitle: 'להכניס את השבת ברוגע, להתענג על הטעם.',
    description:
      'תפריט שבת עשיר, חם ומנחם, שמגיע מוכן, מסודר ומלא בטעם של בית עם גימור של קייטרינג בוטיק. מתאים למשפחה שרוצה להיכנס לשבת רגועה, בלי לוותר על שולחן שנראה ומרגיש מוקפד.',
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
      'מגשי אירוח ופינגר פוד מעוצבים לאירועים פרטיים, ימי הולדת, הרמות כוסית, ישיבות ואירוח עסקי. כל מגש נבנה כדי להיות גם טעים, גם אסתטי וגם נוח להגשה.',
    bestFor: 'מפגשים משפחתיים, אירועים קטנים, הרמות כוסית ואירוח עסקי מוקפד.',
    promise: 'מגשים שנפתחים יפה, נראים חגיגיים על השולחן ונוחים לאכילה בעמידה או סביב שולחן.',
    details: ['אירועים קטנים', 'בראנצ׳ים', 'מפגשים משפחתיים', 'אירוח עסקי', 'שולחנות חגיגיים'],
    cta: 'דברו איתנו על מגשי אירוח',
    image: foodMedia.hostingTableOverview,
    icon: Utensils,
  },
  {
    title: 'Travel nis',
    subtitle: 'פינוק בוטיק שלוקחים איתכם.',
    description:
      'מארזי דרך ופיקניק מוקפדים, ארוזים יפה ונוח, עם אוכל טרי ומפנק לטיולים, נסיעות, ימי כיף ורגעים שרוצים להפוך למיוחדים.',
    bestFor: 'נסיעות משפחתיות, ימי כיף, פיקניקים, טיולים ורגעים שמתחילים כבר בדרך.',
    promise: 'אוכל ארוז חכם, יפה ונוח לנשיאה, כדי שהדרך עצמה תרגיש כמו חלק מהחוויה.',
    details: ['פיקניק זוגי', 'טיול משפחתי', 'יום הולדת בטבע', 'נסיעות ארוכות', 'ימי חופש'],
    cta: 'להזמנת מארז דרך',
    image: foodMedia.miniSandwiches,
    icon: Package,
  },
];

const editorialCards: readonly EditorialCard[] = [
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
    title: 'Travel nis לפינוקים שלוקחים אתכם הלאה',
    text: 'מארזים נוחים, חכמים ויפים לנסיעות, טיולים וימי כיף, כך שהחוויה מתחילה כבר בדרך.',
    icon: Gift,
    image: foodMedia.miniSandwiches,
  },
];

const boutiqueReasons: readonly SimpleCard[] = [
  {
    title: 'התאמה לפני סגירה',
    text: 'כל הזמנה מתחילה בשיחה קצרה על סוג האירוח, מספר הסועדים והתחושה שרוצים ליצור.',
    icon: ClipboardList,
  },
  {
    title: 'הגשה שנראית נקייה ומכובדת',
    text: 'לא רק אוכל טעים, אלא שולחן שנפתח יפה ומרגיש מסודר כבר בלי להתעסק עם כל פרט.',
    icon: Sparkles,
  },
  {
    title: 'אריזה שממשיכה את המותג',
    text: 'מגשים, מארזים ופרטים קטנים שמחזיקים את תחושת הבוטיק גם בדרך וגם בהגשה.',
    icon: Package,
  },
  {
    title: 'שירות אישי מתחילתו ועד סופו',
    text: 'אתם לא נופלים על תפריט קבוע. אנחנו בונים יחד פתרון שמתאים לאירוח הספציפי שלכם.',
    icon: HeartHandshake,
  },
];

const manifestoMoments: readonly Readonly<{ label: string; title: string; text: string; image: string }>[] = [
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

const processSteps: readonly SimpleCard[] = [
  {
    title: 'יוצרים קשר',
    text: 'שולחים הודעה קצרה עם התאריך, סוג האירוח והכיוון הכללי.',
    icon: MessageCircle,
  },
  {
    title: 'מחדדים את התמונה',
    text: 'מבינים יחד אם מדובר בשבת, אירוע קטן או מארזים, וכמה אנשים אתם רוצים לארח.',
    icon: CalendarDays,
  },
  {
    title: 'מרכיבים התאמה אישית',
    text: 'בונים כיוון של תפריט, הגשה ופרטים קטנים שמחברים בין הטעם לבין המראה.',
    icon: ClipboardList,
  },
  {
    title: 'מקבלים מוכן להגשה',
    text: 'האוכל מגיע מסודר, אסתטי ונוח להגשה, כדי שתוכלו לארח בכבוד ובלי לחץ.',
    icon: CheckCircle2,
  },
];

const menuGroups: readonly MenuGroup[] = [
  {
    title: 'תפריט שבת לדוגמה',
    intro: 'כיוון לשולחן שבת שמרגיש מלא, מכובד ונוח להגשה.',
    items: [
      'מבחר סלטים לשולחן',
      'דגים לשבת',
      'עיקריות חמות',
      'תוספות וסירים משפחתיים',
      'חלות וקינוחים',
    ],
  },
  {
    title: 'מגשי אירוח ופינגר פוד',
    intro: 'פתרון לאירוח קטן שרוצה להרגיש מוקפד ולא גנרי.',
    items: [
      'מגש מלוח מעוצב',
      'מיני קישים ומאפים אישיים',
      'כריכונים וביסים קטנים',
      'בראנץ׳ בוטיק למשפחה',
      'קינוחים אישיים',
    ],
  },
  {
    title: 'Travel nis לדרך',
    intro: 'מארזים יפים ונוחים לרגעים מיוחדים שמתחילים כבר ביציאה מהבית.',
    items: [
      'ערכת פיקניק זוגית',
      'ערכת דרך משפחתית',
      'מארז נסיעה מפנק לילדים',
      'מארז יום כיף',
      'פתרון מותאם לטיול או יציאה',
    ],
  },
];

const storyMoments: readonly StoryMoment[] = [
  {
    title: 'מהרובע היהודי',
    text: 'שנים של סמטאות אבן, בתים פתוחים וריח של שבת בנו אצל יהודית שפה של אירוח שיש בו נשמה, סדר וחום.',
  },
  {
    title: 'אל המטבח של nis',
    text: 'הזיכרון הזה הופך למטבח מוקפד: חומרי גלם טריים, טעמים מדויקים, אריזה יפה ותחושה שמישהו חשב עליכם באמת.',
  },
  {
    title: 'עד השולחן שלכם',
    text: 'המטרה פשוטה: שתוכלו לארח ברוגע, לפתוח את המארז או המגש, ולהרגיש שהאוכל כבר מספר את הסיפור הנכון.',
  },
];

const coordinationCards: readonly SimpleCard[] = [
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
    title: 'מינימום הזמנה',
    text: 'כרגע מוגדר בשיחה לפי סוג השירות, מספר הסועדים והיקף ההכנה.',
    icon: Users,
  },
  {
    title: 'אישור תפריט',
    text: 'אחרי שיחה קצרה מסכמים כיוון, התאמות, תאריך ואופן קבלה לפני סגירת ההזמנה.',
    icon: ClipboardList,
  },
];

const galleryImages: readonly GalleryImage[] = [
  {
    title: 'שולחן אירוח מוכן',
    alt: 'שולחן אירוח מסודר עם מגשי ירקות, סלטים, כריכונים וכלי הגשה',
    src: foodMedia.hostingTableOverview,
    category: 'tables',
    tall: true,
  },
  {
    title: 'שיפודי סלמון בלימון',
    alt: 'מגש שיפודי סלמון עם פרוסות לימון על מצע ירוק',
    src: foodMedia.salmonSkewersLemon,
    category: 'fish',
    tall: true,
  },
  {
    title: 'פוקצ׳ה ירקות צבעונית',
    alt: 'פוקצ׳ה חתוכה עם ירקות קלויים וגבינה',
    src: foodMedia.vegetableFocaccia,
    category: 'trays',
  },
  {
    title: 'כריכונים אישיים',
    alt: 'מגש כריכונים עגולים עם חסה וסיכות במבוק',
    src: foodMedia.miniSandwiches,
    category: 'trays',
  },
  {
    title: 'סלט קפרזה אישי',
    alt: 'קערת סלט עם עגבניות שרי, מוצרלה, רוטב ירוק ושקית בוטנים',
    src: foodMedia.capreseSaladBowl,
    category: 'salads',
    tall: true,
  },
  {
    title: 'ירקות קלויים צבעוניים',
    alt: 'מגש ירקות קלויים עם פלפלים, ברוקולי, פטריות, בצל וחצילים',
    src: foodMedia.roastedVegetables,
    category: 'trays',
    tall: true,
  },
  {
    title: 'מטבלים למרכז השולחן',
    alt: 'מגש מטבלים עם זיתים, סלט טונה, מטבל לבן ומטבל כתום',
    src: foodMedia.dipsTrayClose,
    category: 'trays',
  },
  {
    title: 'מגש גבינות ומטבלים',
    alt: 'מגש מחולק עם זיתים, קוביות גבינה, מטבל עגבניות וחמאה',
    src: foodMedia.mezzeTrayClose,
    category: 'trays',
    tall: true,
  },
  {
    title: 'סלט כרוב סגול',
    alt: 'קערת סלט כרוב סגול עם בצל ירוק, רוטב ושקית אגוזים',
    src: foodMedia.purpleCabbageSalad,
    category: 'salads',
    tall: true,
  },
  {
    title: 'סלט זוקיני ופטריות',
    alt: 'קערת סלט עם זוקיני קלוי, פטריות, גבינה ורוטב',
    src: foodMedia.roastedZucchiniSalad,
    category: 'salads',
    tall: true,
  },
  {
    title: 'שיפודי סלמון מקרוב',
    alt: 'תקריב של שיפודי סלמון עם עשבי תיבול ולימון',
    src: foodMedia.salmonSkewersClose,
    category: 'fish',
    tall: true,
  },
  {
    title: 'עמדת קפה ותה',
    alt: 'עמדת קפה עם מיחם, חלב, כוסות, סכו"ם וסוכר',
    src: foodMedia.coffeeStation,
    category: 'coffee',
  },
  {
    title: 'ערכת קפה מוקפדת',
    alt: 'קופסת תיונים, סוכר וסכו"ם לצד מיחם לשירות קפה',
    src: foodMedia.coffeeServiceClose,
    category: 'coffee',
    tall: true,
  },
  {
    title: 'שולחן ערוך באירוע',
    alt: 'שולחן ערוך עם מפה זהובה, צלחות כחולות ומפיות תכלת',
    src: foodMedia.tableSettingBlueGold,
    category: 'tables',
    tall: true,
  },
];

const heroStats: readonly Readonly<{ value: string; label: string }>[] = [
  { value: 'שבתות', label: 'אוכל ביתי מוקפד, מוכן להגשה' },
  { value: 'אירוח קטן', label: 'מגשים ושולחנות שנראים כמו בוטיק' },
  { value: 'Travel nis', label: 'מארזים חכמים לדרך ולרגעים מיוחדים' },
];

const heroSceneNotes: readonly Readonly<{ title: string; text: string }>[] = [
  {
    title: 'אירוח מוכן להגשה',
    text: 'כל מגש מגיע מסודר כך שהשולחן נראה נכון כבר מהרגע הראשון.',
  },
  {
    title: 'שיחה קצרה, התאמה אישית',
    text: 'מספר סועדים, סוג האירוח והאווירה שאתם רוצים יוצרים יחד את הכיוון.',
  },
];

const heroMarquee: readonly string[] = [
  'שולחן שנפתח יפה',
  'אוכל ביתי מוקפד',
  'מגשי אירוח אלגנטיים',
  'Travel nis',
  'ביתר עילית',
  'אריזה שנראית כמו מותג',
];

const signatureMoments: readonly Readonly<{ title: string; text: string; image: string }>[]= [
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

const facts: readonly string[] = [
  'אזור פעילות זמני: ביתר עילית והסביבה, בתיאום מול הלקוח.',
  'להזמנות שבת ואירועים מומלץ לפנות מוקדם ככל האפשר.',
  'לא מוצגים מחירים באתר; כל הזמנה מקבלת הצעה מותאמת לאחר שיחה קצרה.',
  'אפשר לדבר על העדפות והתאמות תפריט לפי הצורך.',
];

const seoTopics: readonly string[] = [
  'קייטרינג בוטיק בביתר עילית',
  'תפריט שבת מוכן ומסודר',
  'מגשי אירוח לאירועים קטנים',
  'פינגר פוד והרמות כוסית',
  'מארזי פיקניק ומארזי דרך',
  'אירוח משפחתי בהתאמה אישית',
];

const trustCards: readonly SimpleCard[] = [
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

const faqs: readonly Readonly<{ question: string; answer: string }>[] = [
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
    question: 'האם יש מנות מותאמות לפי העדפות?',
    answer: 'אפשר לשוחח על העדפות והתאמות לפי הצורך, ובהמשך השיחה יובהר מה ניתן לבצע בפועל.',
  },
  {
    question: 'האם אפשר להזמין לאירועים עסקיים?',
    answer: 'כן. nis בכיס מתאימה גם להרמות כוסית, ישיבות, אירוח עסקי ושולחנות קטנים ומוקפדים.',
  },
  {
    question: 'האם יש מינימום הזמנה?',
    answer: 'מינימום הזמנה ייקבע בשיחה לפי סוג השירות, התאריך והיקף האירוח.',
  },
];

const buildWhatsappLink = (message: string): string => `${whatsappBase}?text=${encodeURIComponent(message)}`;
const buildInquiryWhatsappLink = (topic: string): string =>
  buildWhatsappLink(`שלום nis, אשמח לשמוע פרטים על ${topic}.`);

function App() {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [activeGalleryCategory, setActiveGalleryCategory] = useState<GalleryCategory>('all');
  const [leadSource, setLeadSource] = useState('ניס בטעם של שבת');
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeExperienceIndex, setActiveExperienceIndex] = useState(0);
  const [activeNavSection, setActiveNavSection] = useState('#top');
  const topbarWhatsapp = buildWhatsappLink('שלום nis, אשמח ליצור קשר.');
  const heroWhatsapp = buildInquiryWhatsappLink('קייטרינג בוטיק לאירוח');
  const contactWhatsapp = buildWhatsappLink('שלום nis, אשמח ליצור קשר לגבי הזמנה.');
  const footerWhatsapp = buildWhatsappLink('שלום nis, אשמח לקבל פרטים.');
  const floatingWhatsapp = buildWhatsappLink('שלום nis, אשמח לקבל פרטים דרך האתר.');
  const filteredGalleryImages = useMemo(
    () =>
      activeGalleryCategory === 'all'
        ? galleryImages
        : galleryImages.filter((image) => image.category === activeGalleryCategory),
    [activeGalleryCategory],
  );
  const selectedImage =
    selectedImageIndex === null ? null : filteredGalleryImages[selectedImageIndex] ?? null;
  const activeExperience = services[activeExperienceIndex] ?? services[0];

  const openGalleryImage = (index: number) => setSelectedImageIndex(index);

  const showAdjacentImage = useCallback((direction: 1 | -1) => {
    setSelectedImageIndex((currentIndex) => {
      if (currentIndex === null || filteredGalleryImages.length === 0) {
        return currentIndex;
      }

      return (currentIndex + direction + filteredGalleryImages.length) % filteredGalleryImages.length;
    });
  }, [filteredGalleryImages.length]);

  useEffect(() => {
    const revealElements = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));

    if (!('IntersectionObserver' in window)) {
      revealElements.forEach((element) => element.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
    );

    revealElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      const sectionSequence = ['top', 'experiences', 'process', 'gallery', 'faq', 'contact']
        .map((id) => document.getElementById(id))
        .filter((section): section is HTMLElement => section instanceof HTMLElement);
      const currentSection = sectionSequence
        .slice()
        .reverse()
        .find((section) => window.scrollY >= section.offsetTop - 180);

      setIsScrolled(window.scrollY > 24);
      setScrollProgress(Math.min(1, Math.max(0, progress)));
      setActiveNavSection(currentSection ? `#${currentSection.id}` : '#top');
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const x = `${(event.clientX / window.innerWidth) * 100}%`;
      const y = `${(event.clientY / window.innerHeight) * 100}%`;

      document.documentElement.style.setProperty('--pointer-x', x);
      document.documentElement.style.setProperty('--pointer-y', y);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveExperienceIndex((current) => (current + 1) % services.length);
    }, 4800);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!selectedImage) {
      return undefined;
    }

    document.body.classList.add('is-lightbox-open');

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedImageIndex(null);
      }

      if (event.key === 'ArrowLeft') {
        showAdjacentImage(1);
      }

      if (event.key === 'ArrowRight') {
        showAdjacentImage(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('is-lightbox-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedImage, showAdjacentImage]);

  const handleContactSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const lines = [
      `שם: ${formData.get('name') ?? ''}`,
      `טלפון: ${formData.get('phone') ?? ''}`,
      `מייל: ${formData.get('email') ?? ''}`,
      `עניין: ${formData.get('interest') ?? ''}`,
      `תאריך רצוי: ${formData.get('date') ?? ''}`,
      `מספר סועדים: ${formData.get('guests') ?? ''}`,
      `אופן קבלה מועדף: ${formData.get('delivery') ?? ''}`,
      `הודעה: ${formData.get('message') ?? ''}`,
    ];
    window.location.href = buildWhatsappLink(`שלום nis,\n${lines.join('\n')}`);
  };

  return (
    <div
      className="site-shell"
      style={{ '--scroll-progress': scrollProgress } as CSSProperties}
    >
      <a className="skip-link" href="#main">
        דלג לתוכן המרכזי
      </a>
      <div className="scroll-progress" aria-hidden="true" />

      <header className={isScrolled ? 'topbar is-scrolled' : 'topbar'} aria-label="ניווט ראשי">
        <a className="brand" href="#top" aria-label="nis, Boutique Catering">
          <img
            className="brand-logo"
            src="/brand/nis-logo.svg"
            alt="nis - Boutique Catering"
          />
        </a>
        <nav className="nav-links">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={activeNavSection === item.href ? 'is-active' : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <a className="topbar-cta" href={topbarWhatsapp} data-event="topbar_whatsapp">
          <MessageCircle aria-hidden="true" size={18} />
          וואטסאפ
        </a>
      </header>

      <main id="main">
        <section id="top" className="hero" aria-labelledby="hero-title">
          <div className="hero-media" aria-hidden="true" />
          <video
            className="hero-video"
            aria-hidden="true"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster={foodMedia.hostingTableOverview}
          >
            <source src={foodMedia.eventVideo} type="video/mp4" />
          </video>
          <div className="hero-texture" aria-hidden="true" />
          <div className="hero-layout">
            <div className="hero-content reveal is-visible">
              <p className="eyebrow">מהרובע היהודי לביתר עילית</p>
              <p className="hero-brand-subtitle">nis Boutique Catering</p>
              <h1 id="hero-title">
                קייטרינג בוטיק ביתי
                <br />
                לשבתות ואירועים קטנים
              </h1>
              <p className="hero-kicker">אוכל ביתי מוקפד, בהגשה של בוטיק, לאירוח קטן שמרגיש גדול.</p>
              <p className="hero-text">
                nis מחברת בין אוכל ביתי מוקפד לבין שפה של בוטיק: שבתות עשירות,
                אירוח קטן שמרגיש מכובד, ומארזים יפים לדרך. הכול נבנה סביב סוג
                האירוח שלכם, עם התאמה אישית ותחושה שהכול כבר מסודר.
              </p>
              <div className="hero-actions" aria-label="פעולות ראשיות">
                <a className="button primary" href={heroWhatsapp} data-event="hero_whatsapp">
                  <MessageCircle aria-hidden="true" />
                  קבלו תפריט מותאם בוואטסאפ
                </a>
                <a className="button secondary" href="#experiences">
                  <Camera aria-hidden="true" />
                  צפו באפשרויות הזמנה
                </a>
              </div>
              <p className="microcopy">שיחה קצרה, התאמה אישית, והכוונה ברורה לפי האירוח, הכמות והתאריך.</p>
              <div className="hero-badges" aria-label="נקודות אמון">
                <span>
                  <ChefHat aria-hidden="true" size={16} />
                  שבתות
                </span>
                <span>
                  <Utensils aria-hidden="true" size={16} />
                  מגשי אירוח
                </span>
                <span>
                  <Package aria-hidden="true" size={16} />
                  Travel nis
                </span>
                <span>
                  <Clock aria-hidden="true" size={16} />
                  מומלץ לפנות מוקדם
                </span>
              </div>
              <dl className="hero-proof" aria-label="סוגי הזמנות מרכזיים">
                {heroStats.map((stat) => (
                  <div key={stat.label}>
                    <dt>{stat.value}</dt>
                    <dd>{stat.label}</dd>
                  </div>
                ))}
              </dl>
              <div className="motion-rail" aria-hidden="true">
                {heroMarquee.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
            <div className="hero-showcase reveal is-visible" aria-label="תמונות אירוח של nis">
              <div className="hero-stage-frame">
                <img className="hero-plate primary-plate" src={foodMedia.salmonSkewersLemon} alt="שיפודי סלמון עם לימון" />
                <div className="hero-stage-caption">
                  <strong>שבתות, אירוח קטן ומארזים</strong>
                  <span>אותה שפה של טעם, נראות ושקט למארח.</span>
                </div>
              </div>
              <img className="hero-plate side-plate" src={foodMedia.dipsTrayClose} alt="מגש מטבלים צבעוני" />
              <img className="hero-plate tall-plate" src={foodMedia.tableSettingBlueGold} alt="שולחן ערוך לאירוח" />
              <div className="hero-scene-notes" aria-hidden="true">
                {heroSceneNotes.map((note) => (
                  <article key={note.title} className="hero-scene-note">
                    <strong>{note.title}</strong>
                    <span>{note.text}</span>
                  </article>
                ))}
              </div>
              <div className="hero-mini-proof" aria-hidden="true">
                <span>שבתות</span>
                <span>מגשי אירוח</span>
                <span>Travel nis</span>
              </div>
              <a className="video-chip" href="#gallery">
                <Play aria-hidden="true" size={18} />
                רגעים אמיתיים מהאירוח
              </a>
            </div>
          </div>
        </section>

        <section className="section intro-band reveal" aria-label="בידול">
          <div className="container intro-grid">
            <div>
              <p className="eyebrow">רעיון אחד ברור</p>
              <h2>אוכל ביתי מוקפד, בהגשה של בוטיק, לאירוח קטן שמרגיש גדול.</h2>
            </div>
            <p>
              במקום לנסות להיות הכול, nis בנויה סביב שלוש חוויות ברורות:
              שבתות, אירועים קטנים ומארזים לדרך. החוט שמחבר ביניהן הוא אותו
              חוט: אוכל שמרגיש חם וביתי, נראות נקייה ומכובדת, ושירות אישי שלא
              משאיר אתכם לבד עם הפרטים.
            </p>
          </div>
        </section>

        <section className="section manifesto-section" aria-labelledby="manifesto-title">
          <div className="container manifesto-layout">
            <div className="manifesto-copy reveal">
              <p className="eyebrow">השפה של nis</p>
              <h2 id="manifesto-title">
                לא עוד מגש.
                <br />
                חוויית אירוח שנראית
                <br />
                כמו מחשבה.
              </h2>
              <p>
                כש־nis נראית נכון, זה מרגיש מיד אחרת: יותר שקט למארח, יותר
                כבוד לשולחן, ויותר תחושה שמישהו החזיק את כל הפרטים יחד.
              </p>
            </div>
            <div className="manifesto-stack">
              {manifestoMoments.map((moment, index) => (
                <article
                  className="manifesto-card reveal"
                  key={moment.title}
                  style={{ '--delay': `${index * 80}ms` } as CSSProperties}
                >
                  <img src={moment.image} alt="" loading="lazy" />
                  <div className="manifesto-card-copy">
                    <span>{moment.label}</span>
                    <h3>{moment.title}</h3>
                    <p>{moment.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section editorial-section" aria-labelledby="editorial-title">
          <div className="container">
            <div className="section-heading reveal">
              <p className="eyebrow">מה מזמינים אצלנו</p>
              <h2 id="editorial-title">שלוש קטגוריות ברורות. שפה אחת של אירוח.</h2>
            </div>
            <div className="editorial-grid">
              {editorialCards.map((card, index) => {
                const Icon = card.icon;

                return (
                  <article
                    className="editorial-card reveal"
                    key={card.title}
                    style={{ '--delay': `${index * 70}ms` } as CSSProperties}
                  >
                    <img src={card.image} alt="" loading="lazy" />
                    <div className="editorial-copy">
                      <span>{card.label}</span>
                      <Icon aria-hidden="true" className="card-icon" />
                      <h3>{card.title}</h3>
                      <p>{card.text}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section experience-lab-section" aria-labelledby="experience-lab-title">
          <div className="container experience-lab">
            <div className="experience-copy reveal">
              <p className="eyebrow">בחרו את החוויה</p>
              <h2 id="experience-lab-title">מהרגע שבוחרים כיוון, כל האתר מתחיל להרגיש יותר מדויק.</h2>
              <p>
                במקום לקרוא רשימה יבשה, בוחרים את סוג האירוח ורואים מיד איך nis
                מדמיינת אותו: מה נפתח על השולחן, מה מקבלים, ואיך זה מרגיש בפועל.
              </p>
              <div className="experience-switcher" role="tablist" aria-label="בחירת חוויית אירוח">
                {services.map((service, index) => {
                  const Icon = service.icon;
                  const isActive = index === activeExperienceIndex;

                  return (
                    <button
                      aria-selected={isActive}
                      className={isActive ? 'experience-pill is-active' : 'experience-pill'}
                      key={service.title}
                      onClick={() => setActiveExperienceIndex(index)}
                      onFocus={() => setActiveExperienceIndex(index)}
                      onMouseEnter={() => setActiveExperienceIndex(index)}
                      role="tab"
                      type="button"
                    >
                      <Icon aria-hidden="true" size={18} />
                      <span>{service.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="experience-stage reveal" aria-live="polite">
              <div className="experience-frame">
                <img
                  key={activeExperience.image}
                  src={activeExperience.image}
                  alt=""
                  loading="lazy"
                />
                <div className="experience-overlay">
                  <span>0{activeExperienceIndex + 1}</span>
                  <h3>{activeExperience.title}</h3>
                  <p>{activeExperience.promise}</p>
                  <a href={buildInquiryWhatsappLink(activeExperience.title)}>
                    לפתוח שיחה על החוויה הזו
                    <ArrowLeft aria-hidden="true" size={16} />
                  </a>
                </div>
              </div>
              <div className="experience-meter" aria-hidden="true">
                <span style={{ '--meter-index': activeExperienceIndex } as CSSProperties} />
              </div>
            </div>
          </div>
        </section>

        <section className="section signature-section" aria-labelledby="signature-title">
          <div className="container">
            <div className="section-heading reveal">
              <p className="eyebrow">למה זה בוטיק</p>
              <h2 id="signature-title">בוטיק זו לא מילה. זו הדרך שבה כל פרט מרגיש נכון יותר.</h2>
            </div>
            <div className="signature-grid">
              {signatureMoments.map((moment, index) => (
                <article
                  className="signature-card reveal"
                  key={moment.title}
                  style={{ '--delay': `${index * 80}ms` } as CSSProperties}
                >
                  <img src={moment.image} alt="" loading="lazy" />
                  <div>
                    <span>0{index + 1}</span>
                    <h3>{moment.title}</h3>
                    <p>{moment.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section boutique-section" aria-labelledby="boutique-title">
          <div className="container boutique-layout">
            <div className="boutique-copy reveal">
              <p className="eyebrow">למה לבחור בנו</p>
              <h2 id="boutique-title">אירוח טוב לא צריך להרגיש תעשייתי. הוא צריך להרגיש אישי, חם ומכובד.</h2>
              <p>
                מאחורי nis עומדת מחשבה על כל רגע שהאורחים פוגשים: מהמראה של
                השולחן, דרך האריזה, ועד תחושת השקט של מי שמארח. בדיוק שם
                המילה Boutique מקבלת הוכחה אמיתית.
              </p>
            </div>
            <div className="boutique-grid">
              {boutiqueReasons.map((reason, index) => {
                const Icon = reason.icon;
                return (
                  <article
                    className="boutique-card reveal"
                    key={reason.title}
                    style={{ '--delay': `${index * 65}ms` } as CSSProperties}
                  >
                    <Icon aria-hidden="true" className="card-icon" />
                    <h3>{reason.title}</h3>
                    <p>{reason.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="experiences" className="section" aria-labelledby="experiences-title">
          <div className="container">
            <div className="section-heading reveal">
              <p className="eyebrow">שלוש החוויות של nis</p>
              <h2 id="experiences-title">כל אירוח מקבל את הקצב, הטעם והאריזה שלו.</h2>
            </div>
            <div className="service-grid">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <article className="service-card reveal" key={service.title}>
                    <img src={service.image} alt="" loading="lazy" />
                    <div className="service-body">
                      <Icon aria-hidden="true" className="card-icon" />
                      <h3>{service.title}</h3>
                      <p className="service-subtitle">{service.subtitle}</p>
                      <p>{service.description}</p>
                      <div className="service-proof">
                        <p>
                          <strong>למי זה מתאים:</strong> {service.bestFor}
                        </p>
                        <p>
                          <strong>מה מקבלים:</strong> {service.promise}
                        </p>
                      </div>
                      <ul>
                        {service.details.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                      <a
                        href={buildInquiryWhatsappLink(service.title)}
                        className="text-link"
                      >
                        {service.cta}
                        <ArrowLeft aria-hidden="true" size={16} />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="process" className="section" aria-labelledby="process-title">
          <div className="container">
            <div className="section-heading reveal">
              <p className="eyebrow">איך זה עובד</p>
              <h2 id="process-title">המסלול ברור: רואים אוכל, מבינים התאמה, ואז פונים בלי היסוס.</h2>
            </div>
            <div className="process-list">
              {processSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <article className="process-step reveal" key={step.title}>
                    <span className="step-number">{index + 1}</span>
                    <Icon aria-hidden="true" className="card-icon" />
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section story-section" aria-labelledby="story-title">
          <div className="container story-grid">
            <div className="story-copy reveal">
              <p className="eyebrow">הסיפור של המותג</p>
              <h2 id="story-title">nis נולדה מתוך אהבה לאירוח יפה, אוכל ביתי מדויק ותשומת לב לפרטים הקטנים.</h2>
              <p>
                מאחורי nis עומדת יהודית ניסטנפובר, עם אהבה עמוקה לאירוח, לאוכל
                מוקפד ולרגעים הקטנים שהופכים ארוחה לחוויה.
              </p>
              <p>
                אחרי שנים של חיים ברובע היהודי, בין סמטאות אבן, בתים מלאי ריח
                של שבת ושולחנות שנפתחים לאנשים שאוהבים, יהודית מביאה למטבח של
                nis חיבור בין ביתיות, אסתטיקה ושירות אישי.
              </p>
              <p>
                כל הזמנה נבנית מתוך תשומת לב לפרטים הקטנים: חומרי גלם טריים,
                טעמים מדויקים, אריזה אסתטית ותחושה שמישהו חשב עליכם באמת.
              </p>
              <div className="story-moments" aria-label="הדרך של nis">
                {storyMoments.map((moment) => (
                  <article key={moment.title}>
                    <h3>{moment.title}</h3>
                    <p>{moment.text}</p>
                  </article>
                ))}
              </div>
            </div>
            <img
              className="reveal"
              src={foodMedia.tableSettingBlueGold}
              alt="שולחן אירוח ערוך ומוכן לאורחים"
              loading="lazy"
            />
          </div>
        </section>

        <section id="samples" className="section soft-section" aria-labelledby="samples-title">
          <div className="container">
            <div className="section-heading sample-heading reveal">
              <p className="eyebrow">כיוונים שאפשר להתחיל מהם</p>
              <h2 id="samples-title">לא תפריט סגור. כן תחושת כיוון ברורה יותר לשיחה.</h2>
              <p>
                הדוגמאות כאן נועדו לפתוח כיוון ולהפוך את ההזמנה למוחשית יותר.
                כל הזמנה מותאמת אישית, והצעת מחיר ניתנת אחרי שיחה קצרה לפי סוג
                האירוח, מספר הסועדים והתאריך.
              </p>
            </div>
            <div className="menu-grid">
              {menuGroups.map((group) => (
                <article className="menu-card reveal" key={group.title}>
                  <h3>{group.title}</h3>
                  <p>{group.intro}</p>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item}>
                        <CheckCircle2 aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section coordination-section" aria-labelledby="coordination-title">
          <div className="container">
            <div className="section-heading reveal">
              <p className="eyebrow">תיאום וזמינות</p>
              <h2 id="coordination-title">פרטים זמניים שמאפשרים להתקדם כבר עכשיו.</h2>
            </div>
            <div className="compact-grid">
              {coordinationCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article className="compact-card reveal" key={card.title}>
                    <Icon aria-hidden="true" className="card-icon" />
                    <h3>{card.title}</h3>
                    <p>{card.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section real-media-section" aria-labelledby="real-media-title">
          <div className="container real-media-grid">
            <div className="reveal">
              <p className="eyebrow">וידאו אמיתי</p>
              <h2 id="real-media-title">ככה נראית תשומת לב לפני שהאירוח בכלל פוגש את האורחים.</h2>
              <p>
                מנות אישיות, אריזה נקייה, מדבקת nis ופרטים קטנים שמסדרים את
                החוויה עוד לפני הביס הראשון. התמונות והווידאו כאן הם מהכנות
                אמיתיות של nis.
              </p>
            </div>
            <video
              className="reveal"
              controls
              muted
              playsInline
              preload="metadata"
              poster={foodMedia.hostingTableOverview}
            >
              <source src={foodMedia.eventVideo} type="video/mp4" />
            </video>
          </div>
        </section>

        <section id="gallery" className="section" aria-labelledby="gallery-title">
          <div className="container">
            <div className="section-heading gallery-heading reveal">
              <p className="eyebrow">גלריה</p>
              <h2 id="gallery-title">אם זו חוויית בוטיק, היא צריכה להוכיח את עצמה בתמונה הראשונה.</h2>
              <p>
                גלריה אמיתית מהאירוח: שולחנות, מגשים, סלטים, קפה ופרטים קטנים
                שמראים איך nis נראית כשהיא מגיעה לשולחן.
              </p>
            </div>
            <div className="gallery-tabs reveal" aria-label="סינון גלריה לפי סוג">
              {galleryCategories.map((category) => (
                <button
                  className={category.id === activeGalleryCategory ? 'gallery-tab is-active' : 'gallery-tab'}
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setActiveGalleryCategory(category.id);
                    setSelectedImageIndex(null);
                  }}
                  aria-pressed={category.id === activeGalleryCategory}
                >
                  {category.label}
                </button>
              ))}
            </div>
            <div className="gallery-grid" aria-live="polite">
              {filteredGalleryImages.map((image, index) => (
                <button
                  className={image.tall ? 'gallery-item tall reveal' : 'gallery-item reveal'}
                  key={image.title}
                  style={{ '--delay': `${(index % 6) * 55}ms` } as CSSProperties}
                  type="button"
                  onClick={() => openGalleryImage(index)}
                  aria-label={`פתח תמונה: ${image.title}`}
                >
                  <img src={image.src} alt={image.alt} loading="lazy" />
                  <span>{image.title}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="section details-section" aria-labelledby="details-title">
          <div className="container split-section">
            <div className="reveal">
              <p className="eyebrow">פרטים שחשוב לדעת</p>
              <h2 id="details-title">שומרים על ציפיות ברורות כבר מהשיחה הראשונה.</h2>
            </div>
            <ul className="fact-list reveal">
              {facts.map((fact) => (
                <li key={fact}>
                  <CheckCircle2 aria-hidden="true" />
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section seo-section" aria-labelledby="seo-title">
          <div className="container split-section">
            <div className="reveal">
              <p className="eyebrow">מה אפשר להזמין</p>
              <h2 id="seo-title">קייטרינג בוטיק מביתר עילית לשבת, אירוח קטן ומארזים לדרך.</h2>
            </div>
            <div className="reveal">
              <p>
                nis נותנת מענה למי שמחפש קייטרינג בוטיק בביתר עילית והסביבה:
                תפריט שבת מוכן, מגשי אירוח לאירועים קטנים, פינגר פוד, בראנץ׳
                משפחתי ומארזי פיקניק או דרך. כל פנייה מתחילה בשיחה קצרה כדי
                להבין את סוג האירוח, כמות הסועדים, התאריך והתחושה שרוצים ליצור.
              </p>
              <div className="seo-tags" aria-label="תחומי שירות">
                {seoTopics.map((topic) => (
                  <span key={topic}>{topic}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section trust-section" aria-labelledby="trust-title">
          <div className="container">
            <div className="section-heading reveal">
              <p className="eyebrow">מה מרגיע לפני שסוגרים</p>
              <h2 id="trust-title">פחות סימני שאלה, יותר תחושה שיש עם מי לדבר.</h2>
            </div>
            <div className="testimonial-grid">
              {trustCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article className="testimonial-card reveal" key={card.title}>
                    <Icon aria-hidden="true" className="card-icon" />
                    <h3>{card.title}</h3>
                    <p>{card.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="faq" className="section soft-section" aria-labelledby="faq-title">
          <div className="container faq-grid">
            <div className="reveal">
              <p className="eyebrow">שאלות נפוצות</p>
              <h2 id="faq-title">התשובות שמקלות על הפנייה הראשונה.</h2>
            </div>
            <div className="faq-list reveal">
              {faqs.map((faq) => (
                <details key={faq.question}>
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="section contact-section" aria-labelledby="contact-title">
          <div className="container contact-grid">
            <div className="contact-copy reveal">
              <p className="eyebrow">יצירת קשר</p>
              <h2 id="contact-title">רוצים לארח יפה בלי לעבוד קשה? מכאן ממשיכים לוואטסאפ.</h2>
              <p>
                ספרו לנו אם מדובר בשבת, אירוע קטן או מארזים לדרך, ונרכיב יחד
                כיוון שמתאים לאופי האירוח שלכם.
              </p>
              <div className="contact-actions">
                <a className="button primary" href={contactWhatsapp} data-event="contact_whatsapp">
                  <MessageCircle aria-hidden="true" />
                  דברו איתנו בוואטסאפ
                </a>
                <a className="button secondary" href={phoneHref}>
                  <Phone aria-hidden="true" />
                  התקשרו עכשיו
                </a>
                <a className="contact-line" href={`mailto:${email}`}>
                  <Mail aria-hidden="true" />
                  {email}
                </a>
                <span className="contact-line">
                  <MapPin aria-hidden="true" />
                  ביתר עילית
                </span>
              </div>
              <div className="contact-promise" aria-label="מה קורה אחרי הפנייה">
                <strong>מה קורה אחרי הפנייה?</strong>
                <span>שיחה קצרה, התאמה אישית, ואז סיכום ברור של תאריך, כמות וסגנון אירוח.</span>
              </div>
            </div>
            <form className="contact-form reveal" onSubmit={handleContactSubmit}>
              <label>
                שם מלא
                <input name="name" autoComplete="name" required />
              </label>
              <label>
                טלפון
                <input name="phone" type="tel" autoComplete="tel" required />
              </label>
              <label>
                מייל
                <input name="email" type="email" autoComplete="email" />
              </label>
              <label>
                במה אתם מתעניינים?
                <select
                  name="interest"
                  value={leadSource}
                  onChange={(event) => setLeadSource(event.target.value)}
                >
                  <option>ניס בטעם של שבת</option>
                  <option>ניס בכיס - מגשי אירוח</option>
                  <option>Travel nis</option>
                  <option>אירוע קטן</option>
                  <option>אחר</option>
                </select>
              </label>
              <label>
                תאריך רצוי
                <input name="date" type="date" />
              </label>
              <label>
                מספר סועדים
                <input name="guests" type="number" min="1" inputMode="numeric" />
              </label>
              <label>
                אופן קבלה מועדף
                <select name="delivery">
                  <option>נדבר ונבדוק יחד</option>
                  <option>איסוף מביתר עילית</option>
                  <option>משלוח בתיאום</option>
                </select>
              </label>
              <label className="full-field">
                הודעה קצרה
                <textarea name="message" rows={5} />
              </label>
              <button className="button primary full-field" type="submit">
                <Send aria-hidden="true" />
                שלחו פנייה בוואטסאפ
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <strong>nis</strong>
            <span>Boutique Catering</span>
            <p>אוכל של בית, גימור של בוטיק.</p>
          </div>
          <div className="footer-links">
            <a href={phoneHref}>{phoneDisplay}</a>
            <a href={`mailto:${email}`}>{email}</a>
            <a href={footerWhatsapp}>וואטסאפ</a>
          </div>
        </div>
      </footer>

      <a className="floating-whatsapp" href={floatingWhatsapp} aria-label="דברו איתנו בוואטסאפ">
        <MessageCircle aria-hidden="true" />
      </a>

      <div className="mobile-sticky-cta" aria-label="פעולות מהירות ליצירת קשר">
        <a href={floatingWhatsapp}>
          <MessageCircle aria-hidden="true" size={18} />
          וואטסאפ
        </a>
        <a href={phoneHref}>
          <Phone aria-hidden="true" size={18} />
          טלפון
        </a>
      </div>

      {selectedImage ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={selectedImage.title}
          onClick={() => setSelectedImageIndex(null)}
        >
          <button
            className="lightbox-close"
            type="button"
            onClick={() => setSelectedImageIndex(null)}
            aria-label="סגור תמונה"
          >
            <X aria-hidden="true" />
          </button>
          {filteredGalleryImages.length > 1 ? (
            <>
              <button
                className="lightbox-nav lightbox-next"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showAdjacentImage(1);
                }}
                aria-label="תמונה הבאה"
              >
                <ChevronLeft aria-hidden="true" />
              </button>
              <button
                className="lightbox-nav lightbox-prev"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showAdjacentImage(-1);
                }}
                aria-label="תמונה קודמת"
              >
                <ChevronRight aria-hidden="true" />
              </button>
            </>
          ) : null}
          <img
            src={selectedImage.src}
            alt={selectedImage.alt}
            onClick={(event) => event.stopPropagation()}
          />
          <p className="lightbox-caption">{selectedImage.title}</p>
        </div>
      ) : null}
    </div>
  );
}

export default App;
