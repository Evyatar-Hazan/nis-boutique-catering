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
import type { ContentSnapshot } from '@monorepo/content-schema';
import { contentSnapshot as generatedContentSnapshot } from '../generated/siteContent.generated';

const contentSnapshot = generatedContentSnapshot as unknown as ContentSnapshot;

const generatedSettings = contentSnapshot.settings;

export const phoneDisplay = generatedSettings.phoneDisplay || '050-3502615';
export const phoneHref = generatedSettings.phoneHref || 'tel:+972503502615';
export const email = generatedSettings.email || 'nisboutiquecatering@gmail.com';
export const whatsappBase = generatedSettings.whatsappBase || 'https://wa.me/972503502615';
export const siteVersion = generatedSettings.siteVersion || 'v0.1.1';

export const sectionIds = ['top', 'experiences', 'gallery', 'process', 'samples', 'faq', 'contact'] as const;

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

export interface SectionCopy {
  readonly eyebrow: string;
  readonly title: string;
  readonly text?: string;
  readonly extraText?: string;
}

export interface SiteMicrocopy {
  readonly navExperiencesLabel: string;
  readonly navGalleryLabel: string;
  readonly navProcessLabel: string;
  readonly navSamplesLabel: string;
  readonly navFaqLabel: string;
  readonly navContactLabel: string;
  readonly galleryAllLabel: string;
  readonly galleryTablesLabel: string;
  readonly galleryTraysLabel: string;
  readonly gallerySaladsLabel: string;
  readonly galleryCoffeeLabel: string;
  readonly galleryFishLabel: string;
  readonly topbarWhatsappLabel: string;
  readonly footerTagline: string;
  readonly footerWhatsappLabel: string;
  readonly studioLoginLabel: string;
  readonly floatingWhatsappAria: string;
  readonly mobileActionsAria: string;
  readonly mobileWhatsappLabel: string;
  readonly mobilePhoneLabel: string;
  readonly heroPrimaryCta: string;
  readonly heroSecondaryCta: string;
  readonly heroMicrocopy: string;
  readonly heroShowcaseTitle: string;
  readonly heroShowcaseText: string;
  readonly heroVideoChip: string;
  readonly experienceCta: string;
  readonly contactPrimaryCta: string;
  readonly contactPhoneCta: string;
  readonly contactLocation: string;
  readonly contactPromiseHeading: string;
  readonly formNameLabel: string;
  readonly formPhoneLabel: string;
  readonly formEmailLabel: string;
  readonly formInterestLabel: string;
  readonly formDateLabel: string;
  readonly formGuestsLabel: string;
  readonly formDeliveryLabel: string;
  readonly formMessageLabel: string;
  readonly formSubmitLabel: string;
  readonly whatsappTopbarMessage: string;
  readonly whatsappHeroTopic: string;
  readonly whatsappContactMessage: string;
  readonly whatsappFooterMessage: string;
  readonly whatsappFloatingMessage: string;
}

export type GalleryCategory = 'all' | 'tables' | 'trays' | 'salads' | 'coffee' | 'fish';

export interface GalleryImage {
  readonly title: string;
  readonly alt: string;
  readonly image: ImageAsset;
  readonly category: GalleryCategory;
  readonly tall?: boolean;
}

const generatedMediaById = new Map(contentSnapshot.media.map((asset) => [asset.id, asset]));

const iconByName: Readonly<Record<string, LucideIcon>> = {
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
};

const activeGeneratedSections = contentSnapshot.sections
  .filter((section) => (section.active ?? true) && !section.deletedAt)
  .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
const getGeneratedSection = (id: string) => activeGeneratedSections.find((section) => section.id === id);
const getGeneratedCardsByGroup = (group: string, fallbackIcon: LucideIcon): readonly SimpleCard[] =>
  activeGeneratedSections
    .filter((section) => section.group === group && section.title && section.text)
    .map((section) => ({
      title: section.title ?? '',
      text: section.text ?? '',
      icon: section.items[0] ? (iconByName[section.items[0]] ?? fallbackIcon) : fallbackIcon,
    }));

const getGeneratedSectionsByGroup = (group: string) =>
  activeGeneratedSections.filter((section) => section.group === group && (section.title || section.text || section.items.length > 0));

const getGeneratedSectionCopy = (id: string, fallback: SectionCopy): SectionCopy => {
  const section = getGeneratedSection(`copy-${id}`);
  if (!section) {
    return fallback;
  }

  return {
    eyebrow: section.items[0] ?? fallback.eyebrow,
    title: section.title ?? fallback.title,
    text: section.text ?? fallback.text,
    extraText: section.items[1] ?? fallback.extraText,
  };
};

const getGeneratedMicrocopy = (id: string, fallback: string) => {
  const section = getGeneratedSection(`microcopy-${id}`);
  return section?.text ?? section?.title ?? section?.items[0] ?? fallback;
};

const getGeneratedMicrocopyList = (id: string, fallback: readonly string[]) => {
  const section = getGeneratedSection(`microcopy-${id}`);
  return section?.items.length ? section.items : fallback;
};

const mergeGeneratedSimpleCards = <T extends SimpleCard>(
  group: string,
  fallback: readonly T[],
  fallbackIcon: LucideIcon,
): readonly T[] => {
  const generated = getGeneratedSectionsByGroup(group);
  if (generated.length === 0) {
    return fallback;
  }

  return generated.map((section, index) => {
    const base = fallback[index] ?? fallback[0];
    return {
      ...base,
      title: section.title ?? base.title,
      text: section.text ?? base.text,
      icon: section.items[0] ? (iconByName[section.items[0]] ?? base.icon ?? fallbackIcon) : base.icon ?? fallbackIcon,
    };
  });
};

const mergeGeneratedEditorialCards = (
  group: string,
  fallback: readonly EditorialCard[],
): readonly EditorialCard[] => {
  const generated = getGeneratedSectionsByGroup(group);
  if (generated.length === 0) {
    return fallback;
  }

  return generated.map((section, index) => {
    const base = fallback[index] ?? fallback[0];
    return {
      ...base,
      label: section.items[0] ?? base.label,
      title: section.title ?? base.title,
      text: section.text ?? base.text,
      icon: section.items[1] ? (iconByName[section.items[1]] ?? base.icon) : base.icon,
    };
  });
};

const mergeGeneratedStoryMoments = (
  group: string,
  fallback: readonly StoryMoment[],
): readonly StoryMoment[] => {
  const generated = getGeneratedSectionsByGroup(group);
  if (generated.length === 0) {
    return fallback;
  }

  return generated.map((section, index) => {
    const base = fallback[index] ?? fallback[0];
    return {
      title: section.title ?? base.title,
      text: section.text ?? base.text,
    };
  });
};

const mergeGeneratedMenuGroups = (
  group: string,
  fallback: readonly MenuGroup[],
): readonly MenuGroup[] => {
  const generated = getGeneratedSectionsByGroup(group);
  if (generated.length === 0) {
    return fallback;
  }

  return generated.map((section, index) => {
    const base = fallback[index] ?? fallback[0];
    return {
      title: section.title ?? base.title,
      intro: section.text ?? base.intro,
      items: section.items.length > 0 ? section.items : base.items,
    };
  });
};

const fallbackServices: readonly Service[] = [
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

const generatedServices = contentSnapshot.services
  .filter((service) => (service.active ?? true) && !service.deletedAt)
  .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
  .map((service): Service | undefined => {
    const image = generatedMediaById.get(service.mediaId);
    if (!image) {
      return undefined;
    }

    return {
      title: service.title,
      subtitle: service.subtitle,
      description: service.description,
      bestFor: service.bestFor,
      promise: service.promise,
      details: service.details,
      cta: service.cta,
      image,
      icon: iconByName[service.icon] ?? Sparkles,
    };
  })
  .filter((service): service is Service => Boolean(service));

export const services: readonly Service[] = generatedServices.length > 0 ? generatedServices : fallbackServices;

const fallbackEditorialCards: readonly EditorialCard[] = [
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

export const editorialCards: readonly EditorialCard[] = mergeGeneratedEditorialCards('editorial', fallbackEditorialCards);

const fallbackAudienceCards: readonly SimpleCard[] = [
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

const generatedAudienceCards = getGeneratedCardsByGroup('audience', Users);
export const audienceCards: readonly SimpleCard[] = generatedAudienceCards.length > 0 ? generatedAudienceCards : fallbackAudienceCards;

const fallbackBoutiqueReasons: readonly SimpleCard[] = [
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

export const boutiqueReasons: readonly SimpleCard[] = mergeGeneratedSimpleCards('boutique', fallbackBoutiqueReasons, Sparkles);

const fallbackManifestoMoments: readonly Readonly<{
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

export const manifestoMoments: readonly Readonly<{
  label: string;
  title: string;
  text: string;
  image: ImageAsset;
}>[] = (() => {
  const generated = getGeneratedSectionsByGroup('manifesto');
  if (generated.length === 0) {
    return fallbackManifestoMoments;
  }

  return generated.map((section, index) => {
    const base = fallbackManifestoMoments[index] ?? fallbackManifestoMoments[0];
    return {
      ...base,
      label: section.items[0] ?? base.label,
      title: section.title ?? base.title,
      text: section.text ?? base.text,
    };
  });
})();

const fallbackProcessSteps: readonly SimpleCard[] = [
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

const generatedProcessSteps = getGeneratedCardsByGroup('process', CheckCircle2);
export const processSteps: readonly SimpleCard[] = generatedProcessSteps.length > 0 ? generatedProcessSteps : fallbackProcessSteps;

const fallbackMenuGroups: readonly MenuGroup[] = [
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

export const menuGroups: readonly MenuGroup[] = mergeGeneratedMenuGroups('samples', fallbackMenuGroups);

const fallbackStoryMoments: readonly StoryMoment[] = [
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

export const storyMoments: readonly StoryMoment[] = mergeGeneratedStoryMoments('story', fallbackStoryMoments);

const fallbackCoordinationCards: readonly SimpleCard[] = [
  {
    title: 'אזור פעילות',
    text: 'ביתר עילית כבסיס פעילות. איסוף ומשלוחים בסביבה מתואמים לפי תאריך, מיקום ואופי ההזמנה.',
    icon: MapPin,
  },
  {
    title: 'זמן פנייה מומלץ',
    text: 'לשבתות, חגים ואירועים כדאי לפנות כמה שיותר מוקדם כדי להשאיר מקום להתאמה אישית.',
    icon: CalendarDays,
  },
  {
    title: 'הצעת מחיר',
    text: 'מקבלים הצעה מותאמת אחרי שמבינים את סוג האירוח, הכמות, התאריך ורמת ההגשה הרצויה.',
    icon: Users,
  },
  {
    title: 'אישור תפריט',
    text: 'אחרי שיחה קצרה מסכמים כיוון, התאמות, תאריך ואופן קבלה לפני סגירת ההזמנה.',
    icon: ClipboardList,
  },
];

export const coordinationCards: readonly SimpleCard[] = mergeGeneratedSimpleCards('coordination', fallbackCoordinationCards, ClipboardList);

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

const generatedGalleryImages = contentSnapshot.gallery
  .filter((item) => (item.active ?? true) && !item.deletedAt)
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

const heroSection = getGeneratedSection('hero');

export const heroContent = {
  eyebrow: heroSection?.items[0] || 'מהרובע היהודי לביתר עילית',
  title: heroSection?.title || 'קייטרינג בוטיק ביתי\nלשבתות ואירועים קטנים',
  kicker: heroSection?.items[1] || 'שבתות, מגשי אירוח ו־Travel Nis, עם אוכל מוקפד, נראות יפה ושיחה קצרה שסוגרת כיוון.',
  text:
    heroSection?.text ||
    'רואים את הסגנון, בוחרים את סוג ההזמנה, ומשאירים פנייה מסודרת. Nis כבר תהפוך את זה לתפריט, מגשים או מארז שמתאימים לאירוח שלכם.',
} as const;

export const siteMicrocopy: SiteMicrocopy = {
  navExperiencesLabel: getGeneratedMicrocopy('nav-experiences-label', 'מה מזמינים'),
  navGalleryLabel: getGeneratedMicrocopy('nav-gallery-label', 'גלריה'),
  navProcessLabel: getGeneratedMicrocopy('nav-process-label', 'איך זה עובד'),
  navSamplesLabel: getGeneratedMicrocopy('nav-samples-label', 'דוגמאות'),
  navFaqLabel: getGeneratedMicrocopy('nav-faq-label', 'שאלות'),
  navContactLabel: getGeneratedMicrocopy('nav-contact-label', 'יצירת קשר'),
  galleryAllLabel: getGeneratedMicrocopy('gallery-all-label', 'הכל'),
  galleryTablesLabel: getGeneratedMicrocopy('gallery-tables-label', 'שולחנות'),
  galleryTraysLabel: getGeneratedMicrocopy('gallery-trays-label', 'מגשים'),
  gallerySaladsLabel: getGeneratedMicrocopy('gallery-salads-label', 'סלטים'),
  galleryCoffeeLabel: getGeneratedMicrocopy('gallery-coffee-label', 'קפה'),
  galleryFishLabel: getGeneratedMicrocopy('gallery-fish-label', 'דגים'),
  topbarWhatsappLabel: getGeneratedMicrocopy('topbar-whatsapp-label', 'וואטסאפ'),
  footerTagline: getGeneratedMicrocopy('footer-tagline', 'אוכל של בית, גימור של בוטיק.'),
  footerWhatsappLabel: getGeneratedMicrocopy('footer-whatsapp-label', 'וואטסאפ'),
  studioLoginLabel: getGeneratedMicrocopy('studio-login-label', 'כניסת ניהול'),
  floatingWhatsappAria: getGeneratedMicrocopy('floating-whatsapp-aria', 'דברו איתנו בוואטסאפ'),
  mobileActionsAria: getGeneratedMicrocopy('mobile-actions-aria', 'פעולות מהירות ליצירת קשר'),
  mobileWhatsappLabel: getGeneratedMicrocopy('mobile-whatsapp-label', 'וואטסאפ'),
  mobilePhoneLabel: getGeneratedMicrocopy('mobile-phone-label', 'טלפון'),
  heroPrimaryCta: getGeneratedMicrocopy('hero-primary-cta', 'דברו איתנו בוואטסאפ'),
  heroSecondaryCta: getGeneratedMicrocopy('hero-secondary-cta', 'ראו איך זה נראה'),
  heroMicrocopy: getGeneratedMicrocopy('hero-microcopy', 'אפשר גם למלא את הטופס בסוף האתר ולשלוח פנייה מסודרת לוואטסאפ.'),
  heroShowcaseTitle: getGeneratedMicrocopy('hero-showcase-title', 'שבתות, אירוח קטן ומארזים'),
  heroShowcaseText: getGeneratedMicrocopy('hero-showcase-text', 'אותה שפה של טעם, נראות ושקט למארח.'),
  heroVideoChip: getGeneratedMicrocopy('hero-video-chip', 'רגעים אמיתיים מהאירוח'),
  experienceCta: getGeneratedMicrocopy('experience-cta', 'לפתוח שיחה על החוויה הזו'),
  contactPrimaryCta: getGeneratedMicrocopy('contact-primary-cta', 'קבלו הצעה מותאמת בוואטסאפ'),
  contactPhoneCta: getGeneratedMicrocopy('contact-phone-cta', 'התקשרו עכשיו'),
  contactLocation: getGeneratedMicrocopy('contact-location', 'ביתר עילית'),
  contactPromiseHeading: getGeneratedMicrocopy('contact-promise-heading', 'מה קורה אחרי הפנייה?'),
  formNameLabel: getGeneratedMicrocopy('form-name-label', 'שם מלא'),
  formPhoneLabel: getGeneratedMicrocopy('form-phone-label', 'טלפון'),
  formEmailLabel: getGeneratedMicrocopy('form-email-label', 'מייל'),
  formInterestLabel: getGeneratedMicrocopy('form-interest-label', 'במה אתם מתעניינים?'),
  formDateLabel: getGeneratedMicrocopy('form-date-label', 'תאריך רצוי'),
  formGuestsLabel: getGeneratedMicrocopy('form-guests-label', 'מספר סועדים'),
  formDeliveryLabel: getGeneratedMicrocopy('form-delivery-label', 'אופן קבלה מועדף'),
  formMessageLabel: getGeneratedMicrocopy('form-message-label', 'הודעה קצרה'),
  formSubmitLabel: getGeneratedMicrocopy('form-submit-label', 'שלחו פנייה בוואטסאפ'),
  whatsappTopbarMessage: getGeneratedMicrocopy('whatsapp-topbar-message', 'שלום Nis, אשמח ליצור קשר.'),
  whatsappHeroTopic: getGeneratedMicrocopy('whatsapp-hero-topic', 'קייטרינג בוטיק לאירוח'),
  whatsappContactMessage: getGeneratedMicrocopy('whatsapp-contact-message', 'שלום Nis, אשמח ליצור קשר לגבי הזמנה.'),
  whatsappFooterMessage: getGeneratedMicrocopy('whatsapp-footer-message', 'שלום Nis, אשמח לקבל פרטים.'),
  whatsappFloatingMessage: getGeneratedMicrocopy('whatsapp-floating-message', 'שלום Nis, אשמח לקבל פרטים דרך האתר.'),
};

export const navItems: readonly NavItem[] = [
  { label: siteMicrocopy.navExperiencesLabel, href: '#experiences' },
  { label: siteMicrocopy.navGalleryLabel, href: '#gallery' },
  { label: siteMicrocopy.navProcessLabel, href: '#process' },
  { label: siteMicrocopy.navSamplesLabel, href: '#samples' },
  { label: siteMicrocopy.navFaqLabel, href: '#faq' },
  { label: siteMicrocopy.navContactLabel, href: '#contact' },
];

export const galleryCategories: readonly Readonly<{ id: GalleryCategory; label: string }>[] = [
  { id: 'all', label: siteMicrocopy.galleryAllLabel },
  { id: 'tables', label: siteMicrocopy.galleryTablesLabel },
  { id: 'trays', label: siteMicrocopy.galleryTraysLabel },
  { id: 'salads', label: siteMicrocopy.gallerySaladsLabel },
  { id: 'fish', label: siteMicrocopy.galleryFishLabel },
  { id: 'coffee', label: siteMicrocopy.galleryCoffeeLabel },
];

export const contactInterestOptions: readonly string[] = getGeneratedMicrocopyList('contact-interest-options', [
  'ניס בטעם של שבת',
  'ניס בכיס - מגשי אירוח',
  'Travel Nis',
  'אירוע קטן',
  'אחר',
]);

export const contactDeliveryOptions: readonly string[] = getGeneratedMicrocopyList('contact-delivery-options', [
  'נדבר ונבדוק יחד',
  'איסוף מביתר עילית',
  'משלוח בתיאום',
]);

export const sectionCopy = {
  introBand: getGeneratedSectionCopy('intro-band', {
    eyebrow: 'רעיון אחד ברור',
    title: 'אוכל ביתי מוקפד, בהגשה של בוטיק, לאירוח קטן שמרגיש גדול.',
    text:
      'במקום לנסות להיות הכול, Nis בנויה סביב שלוש חוויות ברורות: שבתות, אירועים קטנים ומארזים לדרך. החוט שמחבר ביניהן הוא אותו חוט: אוכל שמרגיש חם וביתי, נראות נקייה ומכובדת, ושירות אישי שלא משאיר אתכם לבד עם הפרטים.',
  }),
  manifesto: getGeneratedSectionCopy('manifesto', {
    eyebrow: 'השפה של Nis',
    title: 'לא עוד מגש.\nחוויית אירוח שנראית\nכמו מחשבה.',
    text:
      'כש־Nis נראית נכון, זה מרגיש מיד אחרת: יותר שקט למארח, יותר כבוד לשולחן, ויותר תחושה שמישהו החזיק את כל הפרטים יחד.',
  }),
  editorial: getGeneratedSectionCopy('editorial', {
    eyebrow: 'מה מזמינים אצלנו',
    title: 'שלוש קטגוריות ברורות. שפה אחת של אירוח.',
  }),
  audience: getGeneratedSectionCopy('audience', {
    eyebrow: 'למי זה מתאים',
    title: 'כשרוצים לארח יפה, טעים ומכובד בלי לסחוב הכול לבד.',
    text:
      'Nis מתאימה למי שרוצה לזהות את עצמו מהר: שבת רגועה יותר, אירוע קטן שנראה נכון, או מארז יפה שלוקחים לדרך או שולחים הלאה.',
  }),
  experienceLab: getGeneratedSectionCopy('experience-lab', {
    eyebrow: 'בחרו את החוויה',
    title: 'מהרגע שבוחרים כיוון, האירוח מתחיל לקבל צורה.',
    text:
      'בוחרים את סוג האירוח ומבינים מהר איך זה יכול להיראות אצלכם: מה נפתח על השולחן, מה מתאים לאופי האירוע, ואיך ממשיכים לשיחה קצרה.',
  }),
  signature: getGeneratedSectionCopy('signature', {
    eyebrow: 'למה זה בוטיק',
    title: 'בוטיק זו לא מילה. זו הדרך שבה כל פרט מרגיש נכון יותר.',
  }),
  boutique: getGeneratedSectionCopy('boutique', {
    eyebrow: 'למה זה מרגיש בוטיק',
    title: 'הפרטים הקטנים שעוזרים להחליט מהר יותר.',
    text:
      'התאמה אישית, נראות מוכנה לשולחן, יחס אנושי וטעם שמרגיש ביתי אבל חגיגי. אלה הפרטים שעוזרים לאירוח להרגיש רגוע ומדויק יותר.',
  }),
  services: getGeneratedSectionCopy('services', {
    eyebrow: 'מה אפשר להזמין',
    title: 'שלוש אפשרויות ברורות. בוחרים כיוון וממשיכים לפנייה.',
    text:
      'שבת, אירוח קטן או דרך: שלושת השירותים מקבלים משקל שווה, וכל אחד מהם נבנה לפי כמות, תאריך והתחושה שרוצים ליצור.',
  }),
  process: getGeneratedSectionCopy('process', {
    eyebrow: 'איך זה עובד',
    title: 'ארבעה צעדים קצרים מהרעיון ועד אוכל שמוכן להגשה.',
  }),
  story: getGeneratedSectionCopy('story', {
    eyebrow: 'הסיפור של המותג',
    title: 'Nis נולדה מתוך אהבה לאירוח יפה, אוכל ביתי מדויק ותשומת לב לפרטים הקטנים.',
    text:
      'מאחורי Nis עומדת יהודית ניסטנפובר, עם אהבה עמוקה לאירוח, לאוכל מוקפד ולרגעים הקטנים שהופכים ארוחה לחוויה.',
    extraText:
      'אחרי שנים של חיים ברובע היהודי, בין סמטאות אבן, בתים מלאי ריח של שבת ושולחנות שנפתחים לאנשים שאוהבים, יהודית מביאה למטבח של Nis חיבור בין ביתיות, אסתטיקה ושירות אישי.|כל הזמנה נבנית מתוך תשומת לב לפרטים הקטנים: חומרי גלם טריים, טעמים מדויקים, אריזה אסתטית ותחושה שמישהו חשב עליכם באמת.',
  }),
  samples: getGeneratedSectionCopy('samples', {
    eyebrow: 'כיוונים שאפשר להתחיל מהם',
    title: 'כיוונים טעימים שקל להתחיל מהם שיחה.',
    text:
      'אפשר להתחיל מכיוון כללי ולהתאים אותו לשבת, לאירוח קטן או למארז לדרך. בשיחה קצרה מדייקים יחד כמויות, תאריך וסגנון הגשה.',
  }),
  coordination: getGeneratedSectionCopy('coordination', {
    eyebrow: 'תיאום וזמינות',
    title: 'הפרטים שעוזרים להתקדם בביטחון.',
  }),
  realMedia: getGeneratedSectionCopy('real-media', {
    eyebrow: 'וידאו אמיתי',
    title: 'ככה נראית תשומת לב לפני שהאירוח בכלל פוגש את האורחים.',
    text:
      'מנות אישיות, אריזה נקייה, מדבקת Nis ופרטים קטנים שמסדרים את החוויה עוד לפני הביס הראשון. התמונות והווידאו כאן הם מהכנות אמיתיות של Nis.',
  }),
  gallery: getGeneratedSectionCopy('gallery', {
    eyebrow: 'גלריה',
    title: 'קודם רואים. אחר כך הרבה יותר קל לפנות.',
    text:
      'שולחנות, מגשים, סלטים, קפה ופרטים קטנים שמראים את הסגנון לפני שמתחילים לדבר על תפריט.',
  }),
  details: getGeneratedSectionCopy('details', {
    eyebrow: 'פרטים שחשוב לדעת',
    title: 'שומרים על ציפיות ברורות כבר מהשיחה הראשונה.',
  }),
  bookingBasics: getGeneratedSectionCopy('booking-basics', {
    eyebrow: 'לפני שפונים',
    title: 'כל מה שצריך לדעת כדי לשלוח פנייה בלי להתלבט.',
    text:
      'מספיק לדעת מה סוג האירוח, בערך כמה סועדים ומה התאריך הרצוי. משם אפשר לדייק יחד את התפריט, ההגשה ואופן הקבלה.',
  }),
  seo: getGeneratedSectionCopy('seo', {
    eyebrow: 'מה אפשר להזמין',
    title: 'קייטרינג בוטיק מביתר עילית לשבת, אירוח קטן ומארזים לדרך.',
    text:
      'Nis נותנת מענה למי שמחפש קייטרינג בוטיק בביתר עילית והסביבה: תפריט שבת מוכן, מגשי אירוח לאירועים קטנים, פינגר פוד, בראנץ׳ משפחתי ומארזי פיקניק או דרך. כל פנייה מתחילה בשיחה קצרה כדי להבין את סוג האירוח, כמות הסועדים, התאריך והתחושה שרוצים ליצור.',
  }),
  trust: getGeneratedSectionCopy('trust', {
    eyebrow: 'מה מרגיע לפני שסוגרים',
    title: 'פחות סימני שאלה, יותר תחושה שיש עם מי לדבר.',
  }),
  faq: getGeneratedSectionCopy('faq', {
    eyebrow: 'שאלות נפוצות',
    title: 'התשובות שמקלות על הפנייה הראשונה.',
  }),
  contact: getGeneratedSectionCopy('contact', {
    eyebrow: 'יצירת קשר',
    title: 'אהבתם את הסגנון? שלחו פנייה מסודרת לוואטסאפ.',
    text:
      'הטופס נשאר קצר ומעשי: סוג הזמנה, תאריך, כמות והערה. אחרי השליחה נפתחת הודעת וואטסאפ מוכנה, כדי שיהיה קל להמשיך לשיחה אישית.',
    extraText: 'שיחה קצרה, התאמה אישית, ואז סיכום ברור של תאריך, כמות וסגנון אירוח.',
  }),
} as const;

const fallbackHeroStats: readonly Readonly<{ value: string; label: string }>[] = [
  { value: 'שבתות', label: 'אוכל ביתי מוקפד, מוכן להגשה' },
  { value: 'אירוח קטן', label: 'מגשים ושולחנות שנראים כמו בוטיק' },
  { value: 'Travel Nis', label: 'מארזים חכמים לדרך ולרגעים מיוחדים' },
];

export const heroStats: readonly Readonly<{ value: string; label: string }>[] = (() => {
  const generated = getGeneratedSectionsByGroup('hero-stats');
  if (generated.length === 0) {
    return fallbackHeroStats;
  }

  return generated.map((section, index) => {
    const base = fallbackHeroStats[index] ?? fallbackHeroStats[0];
    return {
      value: section.title ?? base.value,
      label: section.text ?? base.label,
    };
  });
})();

const fallbackHeroSceneNotes: readonly Readonly<{ title: string; text: string }>[] = [
  {
    title: 'אירוח מוכן להגשה',
    text: 'כל מגש מגיע מסודר כך שהשולחן נראה נכון כבר מהרגע הראשון.',
  },
  {
    title: 'שיחה קצרה, התאמה אישית',
    text: 'מספר סועדים, סוג האירוח והאווירה שאתם רוצים יוצרים יחד את הכיוון.',
  },
];

export const heroSceneNotes: readonly Readonly<{ title: string; text: string }>[] =
  mergeGeneratedStoryMoments('hero-notes', fallbackHeroSceneNotes);

const heroMarqueeSection = getGeneratedSection('hero-marquee');

export const heroMarquee: readonly string[] = heroMarqueeSection?.items.length ? heroMarqueeSection.items : [
  'שולחן שנפתח יפה',
  'אוכל ביתי מוקפד',
  'מגשי אירוח אלגנטיים',
  'Travel Nis',
  'ביתר עילית',
  'אריזה שנראית כמו מותג',
];

const fallbackHeroBadges: readonly string[] = [
  'שבתות',
  'מגשי אירוח',
  'Travel Nis',
  'מומלץ לפנות מוקדם',
];

const heroBadgesSection = getGeneratedSection('hero-badges');

export const heroBadges: readonly string[] = heroBadgesSection?.items.length ? heroBadgesSection.items : fallbackHeroBadges;

const fallbackSignatureMoments: readonly Readonly<{ title: string; text: string; image: ImageAsset }>[] = [
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

export const signatureMoments: readonly Readonly<{ title: string; text: string; image: ImageAsset }>[] = (() => {
  const generated = getGeneratedSectionsByGroup('signature');
  if (generated.length === 0) {
    return fallbackSignatureMoments;
  }

  return generated.map((section, index) => {
    const base = fallbackSignatureMoments[index] ?? fallbackSignatureMoments[0];
    return {
      ...base,
      title: section.title ?? base.title,
      text: section.text ?? base.text,
    };
  });
})();

const factsSection = getGeneratedSection('facts');

export const facts: readonly string[] = factsSection?.items.length
  ? factsSection.items
  : [
  'אזור פעילות: ביתר עילית והסביבה, בתיאום לפי תאריך ומיקום.',
  'להזמנות שבת ואירועים מומלץ לפנות מוקדם ככל האפשר.',
  'כל הזמנה מקבלת הצעה מותאמת אחרי שיחה קצרה והבנת הצורך.',
  'אפשר לדבר על העדפות, רגישויות והתאמות תפריט לפי הצורך.',
];

const fallbackSeoTopics: readonly string[] = [
  'קייטרינג בוטיק בביתר עילית',
  'תפריט שבת מוכן ומסודר',
  'מגשי אירוח לאירועים קטנים',
  'פינגר פוד והרמות כוסית',
  'מארזי פיקניק ומארזי דרך',
  'אירוח משפחתי בהתאמה אישית',
];

const seoTopicsSection = getGeneratedSection('seo-topics');

export const seoTopics: readonly string[] = seoTopicsSection?.items.length ? seoTopicsSection.items : fallbackSeoTopics;

const fallbackTrustCards: readonly SimpleCard[] = [
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

const generatedTrustCards = getGeneratedCardsByGroup('trust', Sparkles);
export const trustCards: readonly SimpleCard[] = generatedTrustCards.length > 0 ? generatedTrustCards : fallbackTrustCards;

const fallbackFaqs: readonly Readonly<{ question: string; answer: string }>[] = [
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

const generatedFaqs = activeGeneratedSections
  .filter((section) => section.group === 'faq' && section.title && section.text)
  .map((section) => ({ question: section.title ?? '', answer: section.text ?? '' }));

export const faqs: readonly Readonly<{ question: string; answer: string }>[] =
  generatedFaqs.length > 0 ? generatedFaqs : fallbackFaqs;

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
