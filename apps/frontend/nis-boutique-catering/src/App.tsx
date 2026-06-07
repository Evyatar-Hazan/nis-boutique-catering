import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  Gift,
  HeartHandshake,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
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

const imageUrl = (id: string, width: number): string =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`;

interface NavItem {
  readonly label: string;
  readonly href: string;
}

interface Service {
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
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

interface GalleryImage {
  readonly title: string;
  readonly alt: string;
  readonly src: string;
  readonly tall?: boolean;
}

const navItems: readonly NavItem[] = [
  { label: 'החוויות', href: '#experiences' },
  { label: 'איך זה עובד', href: '#process' },
  { label: 'גלריה', href: '#gallery' },
  { label: 'שאלות', href: '#faq' },
  { label: 'יצירת קשר', href: '#contact' },
];

const services: readonly Service[] = [
  {
    title: 'ניס בטעם של שבת',
    subtitle: 'להכניס את השבת ברוגע, להתענג על הטעם.',
    description:
      'תפריט שבת עשיר, חם ומנחם, שמגיע מוכן, מסודר ומלא בטעם של בית עם גימור של קייטרינג בוטיק.',
    details: ['סלטים', 'דגים', 'עיקריות', 'תוספות', 'חלות', 'קינוחים', 'מנות בהתאמה אישית'],
    cta: 'להזמנת תפריט שבת',
    image: imageUrl('photo-1543353071-10c8ba85a904', 900),
    icon: ChefHat,
  },
  {
    title: 'ניס בכיס',
    subtitle: 'אירוח קטן, רושם גדול.',
    description:
      'מגשי אירוח ופינגר פוד מעוצבים לאירועים פרטיים, ימי הולדת, הרמות כוסית, ישיבות ואירוח עסקי.',
    details: ['אירועים קטנים', 'בראנצ׳ים', 'מפגשים משפחתיים', 'אירוח עסקי', 'שולחנות חגיגיים'],
    cta: 'דברו איתנו על מגשי אירוח',
    image: imageUrl('photo-1555244162-803834f70033', 900),
    icon: Utensils,
  },
  {
    title: 'Travel nis',
    subtitle: 'פינוק בוטיק שלוקחים איתכם.',
    description:
      'מארזי דרך ופיקניק מוקפדים, ארוזים יפה ונוח, עם אוכל טרי ומפנק לטיולים, נסיעות וימי כיף.',
    details: ['פיקניק זוגי', 'טיול משפחתי', 'יום הולדת בטבע', 'נסיעות ארוכות', 'ימי חופש'],
    cta: 'להזמנת מארז דרך',
    image: imageUrl('photo-1485963631004-f2f00b1d6606', 900),
    icon: Package,
  },
];

const fitCards: readonly SimpleCard[] = [
  {
    title: 'משפחות שרוצות שבת מפנקת',
    text: 'שבת מלאה בטעם, בלי לחץ של בישולים וריצות של הרגע האחרון.',
    icon: HeartHandshake,
  },
  {
    title: 'מארחים שאוהבים שולחן מוקפד',
    text: 'אירוח שנראה נקי, מרשים ואסתטי כבר מהרגע שהמגש נפתח.',
    icon: Sparkles,
  },
  {
    title: 'אירועים קטנים ועסקיים',
    text: 'מגשים ופינגר פוד לפגישות, הרמות כוסית, ימי הולדת ומפגשים משפחתיים.',
    icon: Users,
  },
  {
    title: 'נסיעות ורגעים מיוחדים',
    text: 'מארזים נוחים ויפים לטיולים, פיקניקים וימים שרוצים להפוך לחוויה.',
    icon: Gift,
  },
];

const processSteps: readonly SimpleCard[] = [
  {
    title: 'יוצרים קשר',
    text: 'פונים בוואטסאפ, בטלפון או במייל ומספרים מה מתכננים.',
    icon: MessageCircle,
  },
  {
    title: 'מגדירים את האירוח',
    text: 'סוג האירוע, תאריך רצוי, מספר סועדים והעדפות חשובות.',
    icon: CalendarDays,
  },
  {
    title: 'מרכיבים תפריט אישי',
    text: 'בונים יחד פתרון שמתאים בדיוק לאופי האירוח ולסגנון שלכם.',
    icon: ClipboardList,
  },
  {
    title: 'מקבלים מוכן להגשה',
    text: 'אוכל מוקפד, ארוז יפה ומוכן להיכנס לשולחן ברוגע.',
    icon: CheckCircle2,
  },
];

const sampleMenus: readonly string[] = [
  'מארז שבת זוגי או משפחתי',
  'שולחן פינגר פוד לאירוח קטן',
  'מגש מלוח מעוצב',
  'מגש מתוקים וקינוחים אישיים',
  'ערכת פיקניק זוגית',
  'ערכת דרך משפחתית',
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
    title: 'מגש אירוח',
    alt: 'מגש אירוח בוטיק עם מנות קטנות ומעוצבות',
    src: imageUrl('photo-1555244162-803834f70033', 900),
    tall: true,
  },
  {
    title: 'שולחן שבת',
    alt: 'שולחן אוכל חגיגי ומוקפד',
    src: imageUrl('photo-1543353071-10c8ba85a904', 900),
  },
  {
    title: 'קינוחים אישיים',
    alt: 'קינוחים אישיים מסודרים להגשה',
    src: imageUrl('photo-1488477181946-6428a0291777', 900),
  },
  {
    title: 'אריזה לדרך',
    alt: 'מארז אוכל מסודר ונוח לנסיעה',
    src: imageUrl('photo-1526367790999-0150786686a2', 900),
    tall: true,
  },
  {
    title: 'תקריב מנות',
    alt: 'תקריב של מנות אוכל טריות ומוקפדות',
    src: imageUrl('photo-1476224203421-9ac39bcb3327', 900),
  },
  {
    title: 'שולחן אירוח',
    alt: 'שולחן אירוח עם מגוון מנות להגשה',
    src: imageUrl('photo-1551218808-94e220e084d2', 900),
  },
];

const facts: readonly string[] = [
  'אזור פעילות זמני: ביתר עילית והסביבה, בתיאום מול הלקוח.',
  'להזמנות שבת ואירועים מומלץ לפנות מוקדם ככל האפשר.',
  'לא מוצגים מחירים באתר; כל הזמנה מקבלת הצעה מותאמת לאחר שיחה קצרה.',
  'אפשר לדבר על העדפות והתאמות תפריט לפי הצורך.',
];

const trustCards: readonly SimpleCard[] = [
  {
    title: 'אסתטיקה שמגיעה מוכנה',
    text: 'המנות נארזות ומסודרות כך שהשולחן נראה מוקפד בלי עבודה מיותרת מצדכם.',
    icon: Sparkles,
  },
  {
    title: 'התאמה לפני סגירה',
    text: 'לפני שמתקדמים עוברים על סוג האירוח, מספר הסועדים והעדפות חשובות.',
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

function App() {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [leadSource, setLeadSource] = useState('תפריט שבת');

  const defaultWhatsapp = useMemo(
    () =>
      buildWhatsappLink(
        `שלום nis Boutique Catering, אשמח לשמוע פרטים על ${leadSource}.`,
      ),
    [leadSource],
  );

  useEffect(() => {
    if (!selectedImage) {
      return undefined;
    }

    document.body.classList.add('is-lightbox-open');

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('is-lightbox-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedImage]);

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
      `הודעה: ${formData.get('message') ?? ''}`,
    ];
    window.location.href = buildWhatsappLink(`שלום nis Boutique Catering,\n${lines.join('\n')}`);
  };

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">
        דלג לתוכן המרכזי
      </a>

      <header className="topbar" aria-label="ניווט ראשי">
        <a className="brand" href="#top" aria-label="nis Boutique Catering">
          <img
            className="brand-logo"
            src="/brand/nis-logo.svg"
            alt="nis Boutique Catering"
          />
        </a>
        <nav className="nav-links">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <a className="topbar-cta" href={defaultWhatsapp} data-event="topbar_whatsapp">
          <MessageCircle aria-hidden="true" size={18} />
          וואטסאפ
        </a>
      </header>

      <main id="main">
        <section id="top" className="hero" aria-labelledby="hero-title">
          <div className="hero-media" aria-hidden="true" />
          <div className="hero-content">
            <p className="eyebrow">קייטרינג בוטיק מביתר עילית</p>
            <h1 id="hero-title">nis Boutique Catering</h1>
            <p className="hero-kicker">להתאהב בכל פרט, להתרגש מכל ביס.</p>
            <p className="hero-text">
              קייטרינג בוטיק אישי לשבתות, אירועים קטנים ומארזי דרך, עם אוכל מוקפד,
              אריזה יפה ושירות שנבנה סביבכם.
            </p>
            <div className="hero-actions" aria-label="פעולות ראשיות">
              <a className="button primary" href={defaultWhatsapp} data-event="hero_whatsapp">
                <MessageCircle aria-hidden="true" />
                דברו איתנו בוואטסאפ
              </a>
              <a className="button secondary" href="#samples">
                קבלו תפריט לדוגמה
              </a>
            </div>
            <p className="microcopy">שיחה קצרה, התאמה אישית, והצעת מחיר לפי האירוח שלכם.</p>
            <dl className="hero-proof" aria-label="סוגי הזמנות מרכזיים">
              <div>
                <dt>שבתות</dt>
                <dd>תפריט מוכן ומסודר</dd>
              </div>
              <div>
                <dt>אירועים קטנים</dt>
                <dd>מגשים ופינגר פוד</dd>
              </div>
              <div>
                <dt>Travel nis</dt>
                <dd>מארזים לדרך</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="section intro-band" aria-label="בידול">
          <div className="container intro-grid">
            <div>
              <p className="eyebrow">הבטחת המותג</p>
              <h2>אנחנו דואגים לאוכל, כדי שאתם תוכלו לדאוג לאנשים.</h2>
            </div>
            <p>
              nis נולדה בשביל אירוח שמרגיש אישי, אסתטי ומדויק: שבת בלי לחץ,
              שולחן שנראה מוקפד, פתרון שמרגיש יוקרתי אבל נשאר חם וביתי.
            </p>
          </div>
        </section>

        <section id="experiences" className="section" aria-labelledby="experiences-title">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">שלוש החוויות של nis</p>
              <h2 id="experiences-title">כל אירוח מקבל את הקצב, הטעם והאריזה שלו.</h2>
            </div>
            <div className="service-grid">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <article className="service-card" key={service.title}>
                    <img src={service.image} alt="" loading="lazy" />
                    <div className="service-body">
                      <Icon aria-hidden="true" className="card-icon" />
                      <h3>{service.title}</h3>
                      <p className="service-subtitle">{service.subtitle}</p>
                      <p>{service.description}</p>
                      <ul>
                        {service.details.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                      <a
                        href={buildWhatsappLink(`שלום, אשמח לקבל פרטים על ${service.title}.`)}
                        onClick={() => setLeadSource(service.title)}
                        className="text-link"
                      >
                        {service.cta}
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section soft-section" aria-labelledby="fit-title">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">למי זה מתאים?</p>
              <h2 id="fit-title">למי nis מתאימה במיוחד?</h2>
            </div>
            <div className="compact-grid">
              {fitCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article className="compact-card" key={card.title}>
                    <Icon aria-hidden="true" className="card-icon" />
                    <h3>{card.title}</h3>
                    <p>{card.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="process" className="section" aria-labelledby="process-title">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">איך זה עובד</p>
              <h2 id="process-title">ארבעה צעדים פשוטים לאירוח רגוע.</h2>
            </div>
            <div className="process-list">
              {processSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <article className="process-step" key={step.title}>
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
            <div className="story-copy">
              <p className="eyebrow">הסיפור מאחורי nis</p>
              <h2 id="story-title">אוכל שיש בו נשמה, סדר, יופי וחום של בית.</h2>
              <p>
                מאחורי nis Boutique Catering עומדת יהודית ניסטנפובר, עם אהבה עמוקה
                לאירוח, לאוכל מוקפד ולרגעים הקטנים שהופכים ארוחה לחוויה.
              </p>
              <p>
                אחרי שנים של חיים ברובע היהודי, בין סמטאות אבן, בתים מלאי ריח של
                שבת ושולחנות שנפתחים לאנשים שאוהבים, יהודית מביאה למטבח של nis
                חיבור בין ביתיות, אסתטיקה ושירות אישי.
              </p>
              <p>
                כל הזמנה נבנית מתוך תשומת לב לפרטים הקטנים: חומרי גלם טריים,
                טעמים מדויקים, אריזה אסתטית ותחושה שמישהו חשב עליכם באמת.
              </p>
            </div>
            <img
              src={imageUrl('photo-1556911220-bff31c812dba', 1000)}
              alt="הכנת אוכל מוקפד במטבח"
              loading="lazy"
            />
          </div>
        </section>

        <section id="samples" className="section soft-section" aria-labelledby="samples-title">
          <div className="container split-section">
            <div>
              <p className="eyebrow">תפריטים ומארזים לדוגמה</p>
              <h2 id="samples-title">רעיונות מוחשיים שמותאמים לכל אירוח.</h2>
              <p>
                הדוגמאות כאן נועדו לפתוח כיוון. כל הזמנה מותאמת אישית, והצעת מחיר
                ניתנת אחרי שיחה קצרה לפי סוג האירוח, מספר הסועדים והתאריך.
              </p>
            </div>
            <div className="sample-list">
              {sampleMenus.map((sample) => (
                <span key={sample}>{sample}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="section coordination-section" aria-labelledby="coordination-title">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">תיאום וזמינות</p>
              <h2 id="coordination-title">פרטים זמניים שמאפשרים להתקדם כבר עכשיו.</h2>
            </div>
            <div className="compact-grid">
              {coordinationCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article className="compact-card" key={card.title}>
                    <Icon aria-hidden="true" className="card-icon" />
                    <h3>{card.title}</h3>
                    <p>{card.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="gallery" className="section" aria-labelledby="gallery-title">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">גלריה</p>
              <h2 id="gallery-title">קודם רואים, אחר כך מרגישים בטוחים לפנות.</h2>
            </div>
            <div className="gallery-grid">
              {galleryImages.map((image) => (
                <button
                  className={image.tall ? 'gallery-item tall' : 'gallery-item'}
                  key={image.title}
                  type="button"
                  onClick={() => setSelectedImage(image)}
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
            <div>
              <p className="eyebrow">פרטים שחשוב לדעת</p>
              <h2 id="details-title">שומרים על ציפיות ברורות כבר מהשיחה הראשונה.</h2>
            </div>
            <ul className="fact-list">
              {facts.map((fact) => (
                <li key={fact}>
                  <CheckCircle2 aria-hidden="true" />
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section trust-section" aria-labelledby="trust-title">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">למה אפשר לסמוך על nis</p>
              <h2 id="trust-title">פחות ניחושים, יותר ודאות לפני שמזמינים.</h2>
            </div>
            <div className="testimonial-grid">
              {trustCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article className="testimonial-card" key={card.title}>
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
            <div>
              <p className="eyebrow">שאלות נפוצות</p>
              <h2 id="faq-title">התשובות שמקלות על הפנייה הראשונה.</h2>
            </div>
            <div className="faq-list">
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
            <div className="contact-copy">
              <p className="eyebrow">יצירת קשר</p>
              <h2 id="contact-title">נשמח לקחת חלק בשמחה שלכם.</h2>
              <p>
                ספרו לנו מה אתם מתכננים, ונרכיב יחד תפריט מדויק, יפה וטעים לאירוח
                שלכם.
              </p>
              <div className="contact-actions">
                <a className="button primary" href={defaultWhatsapp} data-event="contact_whatsapp">
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
            </div>
            <form className="contact-form" onSubmit={handleContactSubmit}>
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
                  <option>תפריט שבת</option>
                  <option>מגשי אירוח</option>
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
          <div>
            <strong>nis Boutique Catering</strong>
            <p>אוכל של בית, גימור של בוטיק.</p>
          </div>
          <div className="footer-links">
            <a href={phoneHref}>{phoneDisplay}</a>
            <a href={`mailto:${email}`}>{email}</a>
            <a href={defaultWhatsapp}>וואטסאפ</a>
          </div>
        </div>
      </footer>

      <a className="floating-whatsapp" href={defaultWhatsapp} aria-label="דברו איתנו בוואטסאפ">
        <MessageCircle aria-hidden="true" />
      </a>

      {selectedImage ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={selectedImage.title}
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="lightbox-close"
            type="button"
            onClick={() => setSelectedImage(null)}
            aria-label="סגור תמונה"
          >
            <X aria-hidden="true" />
          </button>
          <img
            src={selectedImage.src}
            alt={selectedImage.alt}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}

export default App;
