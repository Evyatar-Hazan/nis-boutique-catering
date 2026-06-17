import { type CSSProperties, type FormEventHandler, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { ArrowLeft, Camera, CheckCircle2, ChefHat, Clock, Mail, MapPin, MessageCircle, Package, Phone, Play, Send, Utensils } from 'lucide-react';
import {
  audienceCards,
  brandMedia,
  boutiqueReasons,
  coordinationCards,
  editorialCards,
  facts,
  faqs,
  foodMedia,
  galleryCategories,
  heroContent,
  heroSceneNotes,
  manifestoMoments,
  menuGroups,
  processSteps,
  seoTopics,
  services,
  signatureMoments,
  storyMoments,
  trustCards,
  videoMedia,
  type GalleryCategory,
  type GalleryImage,
} from '../data/siteContent';
import { buildInquiryWhatsappLink } from '../utils/contact';
import { OptimizedImage } from './OptimizedImage';

const SectionHeading = ({
  eyebrow,
  title,
  children,
  id,
  className,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly children?: ReactNode;
  readonly id: string;
  readonly className?: string;
}) => (
  <div className={className ?? 'section-heading reveal'}>
    <p className="eyebrow">{eyebrow}</p>
    <h2 id={id}>{title}</h2>
    {children}
  </div>
);

export const HeroSection = ({ heroWhatsapp }: { readonly heroWhatsapp: string }) => (
  <section
    id="top"
    className="hero"
    aria-labelledby="hero-title"
    style={{ '--hero-media-image': `url('${foodMedia.hostingTableOverview.src}')` } as CSSProperties}
  >
    <div className="hero-media" aria-hidden="true" />
    <video
      className="hero-video"
      aria-hidden="true"
      autoPlay
      loop
      muted
      playsInline
      preload="none"
      poster={foodMedia.hostingTableOverview.src}
    >
      <source src={videoMedia.eventVideo} type="video/mp4" />
    </video>
    <div className="hero-texture" aria-hidden="true" />
    <div className="hero-layout">
      <div className="hero-content reveal is-visible">
        <div className="hero-brand-lockup" aria-label="Nis, boutique catering">
          <OptimizedImage
            className="hero-brand-logo"
            image={brandMedia.logo}
            alt="Nis boutique catering"
            decoding="async"
          />
        </div>
        <p className="eyebrow">{heroContent.eyebrow}</p>
        <h1 id="hero-title">
          {heroContent.title.split('\n').map((line) => (
            <span key={line}>
              {line}
              <br />
            </span>
          ))}
        </h1>
        <p className="hero-kicker">
          {heroContent.kicker}
        </p>
        <p className="hero-text">
          {heroContent.text}
        </p>
        <div className="hero-actions" aria-label="פעולות ראשיות">
          <a className="button primary" href={heroWhatsapp} data-event="hero_whatsapp">
            <MessageCircle aria-hidden="true" />
            דברו איתנו בוואטסאפ
          </a>
          <a className="button secondary" href="#gallery">
            <Camera aria-hidden="true" />
            ראו איך זה נראה
          </a>
        </div>
        <p className="microcopy">אפשר גם למלא את הטופס בסוף האתר ולשלוח פנייה מסודרת לוואטסאפ.</p>
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
            Travel Nis
          </span>
          <span>
            <Clock aria-hidden="true" size={16} />
            מומלץ לפנות מוקדם
          </span>
        </div>
      </div>
      <div className="hero-showcase reveal is-visible" aria-label="תמונות אירוח של Nis">
        <div className="hero-stage-frame">
          <OptimizedImage
            className="hero-plate primary-plate"
            image={foodMedia.salmonSkewersLemon}
            alt="שיפודי סלמון עם לימון"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          <div className="hero-stage-caption">
            <strong>שבתות, אירוח קטן ומארזים</strong>
            <span>אותה שפה של טעם, נראות ושקט למארח.</span>
          </div>
        </div>
        <OptimizedImage
          className="hero-plate side-plate"
          image={foodMedia.dipsTrayClose}
          alt="מגש מטבלים צבעוני"
          decoding="async"
        />
        <OptimizedImage
          className="hero-plate tall-plate"
          image={foodMedia.tableSettingBlueGold}
          alt="שולחן ערוך לאירוח"
          decoding="async"
        />
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
          <span>Travel Nis</span>
        </div>
        <a className="video-chip" href="#gallery">
          <Play aria-hidden="true" size={18} />
          רגעים אמיתיים מהאירוח
        </a>
      </div>
    </div>
  </section>
);

export const IntroBandSection = () => (
  <section className="section intro-band reveal" aria-label="בידול">
    <div className="container intro-grid">
      <div>
        <p className="eyebrow">רעיון אחד ברור</p>
        <h2>אוכל ביתי מוקפד, בהגשה של בוטיק, לאירוח קטן שמרגיש גדול.</h2>
      </div>
      <p>
        במקום לנסות להיות הכול, Nis בנויה סביב שלוש חוויות ברורות: שבתות, אירועים קטנים
        ומארזים לדרך. החוט שמחבר ביניהן הוא אותו חוט: אוכל שמרגיש חם וביתי, נראות נקייה
        ומכובדת, ושירות אישי שלא משאיר אתכם לבד עם הפרטים.
      </p>
    </div>
  </section>
);

export const ManifestoSection = () => (
  <section className="section manifesto-section" aria-labelledby="manifesto-title">
    <div className="container manifesto-layout">
      <div className="manifesto-copy reveal">
        <p className="eyebrow">השפה של Nis</p>
        <h2 id="manifesto-title">
          לא עוד מגש.
          <br />
          חוויית אירוח שנראית
          <br />
          כמו מחשבה.
        </h2>
        <p>
          כש־Nis נראית נכון, זה מרגיש מיד אחרת: יותר שקט למארח, יותר כבוד לשולחן, ויותר
          תחושה שמישהו החזיק את כל הפרטים יחד.
        </p>
      </div>
      <div className="manifesto-stack">
        {manifestoMoments.map((moment, index) => (
          <article
            className="manifesto-card reveal"
            key={moment.title}
            style={{ '--delay': `${index * 80}ms` } as CSSProperties}
          >
            <OptimizedImage image={moment.image} alt="" loading="lazy" decoding="async" />
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
);

export const EditorialSection = () => (
  <section className="section editorial-section" aria-labelledby="editorial-title">
    <div className="container">
      <SectionHeading eyebrow="מה מזמינים אצלנו" title="שלוש קטגוריות ברורות. שפה אחת של אירוח." id="editorial-title" />
      <div className="editorial-grid">
        {editorialCards.map((card, index) => {
          const Icon = card.icon;

          return (
            <article
              className="editorial-card reveal"
              key={card.title}
              style={{ '--delay': `${index * 70}ms` } as CSSProperties}
            >
              <OptimizedImage image={card.image} alt="" loading="lazy" decoding="async" />
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
);

export const AudienceSection = () => (
  <section className="section" aria-labelledby="audience-title">
    <div className="container">
      <SectionHeading eyebrow="למי זה מתאים" title="כשרוצים לארח יפה, טעים ומכובד בלי לסחוב הכול לבד." id="audience-title">
        <p>
          Nis מתאימה למי שרוצה לזהות את עצמו מהר: שבת רגועה יותר, אירוע קטן שנראה נכון, או
          מארז יפה שלוקחים לדרך או שולחים הלאה.
        </p>
      </SectionHeading>
      <div className="compact-grid">
        {audienceCards.map((card) => {
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
);

interface ExperienceLabSectionProps {
  readonly activeExperienceIndex: number;
  readonly onChangeExperience: (index: number) => void;
}

export const ExperienceLabSection = ({
  activeExperienceIndex,
  onChangeExperience,
}: ExperienceLabSectionProps) => {
  const handleTabNavigation = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      onChangeExperience((index - 1 + services.length) % services.length);
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onChangeExperience((index + 1) % services.length);
    }

    if (event.key === 'Home') {
      event.preventDefault();
      onChangeExperience(0);
    }

    if (event.key === 'End') {
      event.preventDefault();
      onChangeExperience(services.length - 1);
    }
  };

  return (
    <section
      className="section experience-lab-section"
      aria-labelledby="experience-lab-title"
      style={{ '--experience-media-image': `url('${foodMedia.dipsTrayClose.src}')` } as CSSProperties}
    >
      <div className="container experience-lab">
        <div className="experience-copy reveal">
          <p className="eyebrow">בחרו את החוויה</p>
          <h2 id="experience-lab-title">מהרגע שבוחרים כיוון, כל האתר מתחיל להרגיש יותר מדויק.</h2>
          <p>
            במקום לקרוא רשימה יבשה, בוחרים את סוג האירוח ורואים מיד איך Nis מדמיינת אותו:
            מה נפתח על השולחן, מה מקבלים, ואיך זה מרגיש בפועל.
          </p>
          <div className="experience-switcher" role="tablist" aria-label="בחירת חוויית אירוח">
            {services.map((service, index) => {
              const Icon = service.icon;
              const isActive = index === activeExperienceIndex;
              const tabId = `experience-tab-${index}`;
              const panelId = `experience-panel-${index}`;

              return (
                <button
                  id={tabId}
                  key={service.title}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  aria-controls={panelId}
                  tabIndex={isActive ? 0 : -1}
                  className={isActive ? 'experience-pill is-active' : 'experience-pill'}
                  onClick={() => onChangeExperience(index)}
                  onFocus={() => onChangeExperience(index)}
                  onMouseEnter={() => onChangeExperience(index)}
                  onKeyDown={(event) => handleTabNavigation(event, index)}
                >
                  <Icon aria-hidden="true" size={18} />
                  <span>{service.title}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="experience-stage reveal" aria-live="polite">
          {services.map((service, index) => {
            const isActive = index === activeExperienceIndex;
            const panelId = `experience-panel-${index}`;
            const tabId = `experience-tab-${index}`;

            return (
              <div
                key={service.title}
                id={panelId}
                role="tabpanel"
                aria-labelledby={tabId}
                hidden={!isActive}
              >
                <div className="experience-frame">
                  <OptimizedImage image={service.image} alt="" loading="lazy" decoding="async" />
                  <div className="experience-overlay">
                    <span>0{index + 1}</span>
                    <h3>{service.title}</h3>
                    <p>{service.promise}</p>
                    <a href={buildInquiryWhatsappLink(service.title)}>
                      לפתוח שיחה על החוויה הזו
                      <ArrowLeft aria-hidden="true" size={16} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="experience-meter" aria-hidden="true">
            <span style={{ '--meter-index': activeExperienceIndex } as CSSProperties} />
          </div>
        </div>
      </div>
    </section>
  );
};

export const SignatureSection = () => (
  <section className="section signature-section" aria-labelledby="signature-title">
    <div className="container">
      <SectionHeading eyebrow="למה זה בוטיק" title="בוטיק זו לא מילה. זו הדרך שבה כל פרט מרגיש נכון יותר." id="signature-title" />
      <div className="signature-grid">
        {signatureMoments.map((moment, index) => (
          <article
            className="signature-card reveal"
            key={moment.title}
            style={{ '--delay': `${index * 80}ms` } as CSSProperties}
          >
            <OptimizedImage image={moment.image} alt="" loading="lazy" decoding="async" />
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
);

export const BoutiqueSection = () => (
  <section className="section boutique-section" aria-labelledby="boutique-title">
    <div className="container boutique-layout">
      <div className="boutique-copy reveal">
        <p className="eyebrow">למה זה מרגיש בוטיק</p>
        <h2 id="boutique-title">הפרטים הקטנים שעוזרים להחליט מהר יותר.</h2>
        <p>
          במקום עוד הבטחות, הנה מה שבאמת משנה לפני שפונים: התאמה אישית, נראות מוכנה לשולחן,
          יחס אנושי וטעם שמרגיש ביתי אבל חגיגי.
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
);

export const ServicesSection = () => (
  <section id="experiences" className="section" aria-labelledby="experiences-title">
    <div className="container">
      <SectionHeading eyebrow="מה אפשר להזמין" title="שלוש אפשרויות ברורות. בוחרים כיוון וממשיכים לפנייה." id="experiences-title">
        <p>
          שבת, אירוח קטן או דרך: שלושת השירותים מקבלים משקל שווה, וכל אחד מהם נבנה לפי כמות,
          תאריך והתחושה שרוצים ליצור.
        </p>
      </SectionHeading>
      <div className="service-grid">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <article className="service-card reveal" key={service.title}>
              <OptimizedImage image={service.image} alt="" loading="lazy" decoding="async" />
              <div className="service-body">
                <Icon aria-hidden="true" className="card-icon" />
                <h3>{service.title}</h3>
                <p className="service-subtitle">{service.subtitle}</p>
                <p>{service.description}</p>
                <ul>
                  {service.details.slice(0, 4).map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
                <a href={buildInquiryWhatsappLink(service.title)} className="text-link">
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
);

export const ProcessSection = () => (
  <section id="process" className="section" aria-labelledby="process-title">
    <div className="container">
      <SectionHeading eyebrow="איך זה עובד" title="ארבעה צעדים קצרים מהרעיון ועד אוכל שמוכן להגשה." id="process-title" />
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
);

export const StorySection = () => (
  <section className="section story-section" aria-labelledby="story-title">
    <div className="container story-grid">
      <div className="story-copy reveal">
        <p className="eyebrow">הסיפור של המותג</p>
        <h2 id="story-title">Nis נולדה מתוך אהבה לאירוח יפה, אוכל ביתי מדויק ותשומת לב לפרטים הקטנים.</h2>
        <p>מאחורי Nis עומדת יהודית ניסטנפובר, עם אהבה עמוקה לאירוח, לאוכל מוקפד ולרגעים הקטנים שהופכים ארוחה לחוויה.</p>
        <p>אחרי שנים של חיים ברובע היהודי, בין סמטאות אבן, בתים מלאי ריח של שבת ושולחנות שנפתחים לאנשים שאוהבים, יהודית מביאה למטבח של Nis חיבור בין ביתיות, אסתטיקה ושירות אישי.</p>
        <p>כל הזמנה נבנית מתוך תשומת לב לפרטים הקטנים: חומרי גלם טריים, טעמים מדויקים, אריזה אסתטית ותחושה שמישהו חשב עליכם באמת.</p>
        <div className="story-moments" aria-label="הדרך של Nis">
          {storyMoments.map((moment) => (
            <article key={moment.title}>
              <h3>{moment.title}</h3>
              <p>{moment.text}</p>
            </article>
          ))}
        </div>
      </div>
      <OptimizedImage
        className="reveal"
        image={foodMedia.tableSettingBlueGold}
        alt="שולחן אירוח ערוך ומוכן לאורחים"
        loading="lazy"
        decoding="async"
      />
    </div>
  </section>
);

export const SamplesSection = () => (
  <section id="samples" className="section soft-section" aria-labelledby="samples-title">
    <div className="container">
      <SectionHeading
        eyebrow="כיוונים שאפשר להתחיל מהם"
        title="לא תפריט סגור. כן תחושת כיוון ברורה יותר לשיחה."
        id="samples-title"
        className="section-heading sample-heading reveal"
      >
        <p>
          הדוגמאות כאן נועדו לפתוח כיוון ולהפוך את ההזמנה למוחשית יותר. כל הזמנה מותאמת אישית,
          והצעת מחיר ניתנת אחרי שיחה קצרה לפי סוג האירוח, מספר הסועדים והתאריך.
        </p>
      </SectionHeading>
      <div className="menu-grid">
        {menuGroups.map((group) => (
          <article className="menu-card reveal" key={group.title}>
            <h3>{group.title}</h3>
            <p>{group.intro}</p>
            <ul>
              {group.items.slice(0, 3).map((item) => (
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
);

export const CoordinationSection = () => (
  <section className="section coordination-section" aria-labelledby="coordination-title">
    <div className="container">
      <SectionHeading eyebrow="תיאום וזמינות" title="פרטים זמניים שמאפשרים להתקדם כבר עכשיו." id="coordination-title" />
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
);

export const RealMediaSection = () => (
  <section className="section real-media-section" aria-labelledby="real-media-title">
    <div className="container real-media-grid">
      <div className="reveal">
        <p className="eyebrow">וידאו אמיתי</p>
        <h2 id="real-media-title">ככה נראית תשומת לב לפני שהאירוח בכלל פוגש את האורחים.</h2>
        <p>
          מנות אישיות, אריזה נקייה, מדבקת Nis ופרטים קטנים שמסדרים את החוויה עוד לפני הביס
          הראשון. התמונות והווידאו כאן הם מהכנות אמיתיות של Nis.
        </p>
      </div>
      <video className="reveal" controls muted playsInline preload="none" poster={foodMedia.hostingTableOverview.src}>
        <source src={videoMedia.eventVideo} type="video/mp4" />
      </video>
    </div>
  </section>
);

interface GallerySectionProps {
  readonly activeCategory: GalleryCategory;
  readonly images: readonly GalleryImage[];
  readonly onFilterChange: (category: GalleryCategory) => void;
  readonly onOpenImage: (index: number) => void;
}

export const GallerySection = ({
  activeCategory,
  images,
  onFilterChange,
  onOpenImage,
}: GallerySectionProps) => {
  const visibleImages = activeCategory === 'all' ? images.slice(0, 6) : images;

  return (
    <section id="gallery" className="section" aria-labelledby="gallery-title">
      <div className="container">
        <SectionHeading eyebrow="גלריה" title="קודם רואים. אחר כך הרבה יותר קל לפנות." id="gallery-title" className="section-heading gallery-heading reveal">
          <p>
            שולחנות, מגשים, סלטים, קפה ופרטים קטנים שמראים את הסגנון לפני שמתחילים לדבר על תפריט.
          </p>
        </SectionHeading>
        <div className="gallery-tabs reveal" aria-label="סינון גלריה לפי סוג">
          {galleryCategories.map((category) => (
            <button
              className={category.id === activeCategory ? 'gallery-tab is-active' : 'gallery-tab'}
              key={category.id}
              type="button"
              onClick={() => onFilterChange(category.id)}
              aria-pressed={category.id === activeCategory}
            >
              {category.label}
            </button>
          ))}
        </div>
        <div className="gallery-grid" aria-live="polite">
          {visibleImages.map((image, index) => (
            <button
              className={image.tall ? 'gallery-item tall reveal' : 'gallery-item reveal'}
              key={image.title}
              style={{ '--delay': `${(index % 6) * 55}ms` } as CSSProperties}
              type="button"
              onClick={() => onOpenImage(index)}
              aria-label={`פתח תמונה: ${image.title}`}
            >
              <OptimizedImage image={image.image} alt={image.alt} loading="lazy" decoding="async" />
              <span>{image.title}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export const DetailsSection = () => (
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
);

export const BookingBasicsSection = () => (
  <section className="section booking-basics-section soft-section" aria-labelledby="booking-basics-title">
    <div className="container booking-basics-grid">
      <div className="reveal">
        <p className="eyebrow">לפני שפונים</p>
        <h2 id="booking-basics-title">כל מה שצריך לדעת כדי לשלוח פנייה בלי להתלבט.</h2>
        <p>
          אין צורך להגיע מוכנים עם תפריט סגור. מספיק לדעת מה סוג האירוח, בערך כמה סועדים,
          ומה התאריך הרצוי, ומשם אפשר לדייק יחד.
        </p>
      </div>
      <div className="booking-basics-content">
        <div className="compact-grid booking-facts">
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
        <div className="faq-list booking-faq reveal">
          {faqs.slice(0, 3).map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export const SeoSection = () => (
  <section className="section seo-section" aria-labelledby="seo-title">
    <div className="container split-section">
      <div className="reveal">
        <p className="eyebrow">מה אפשר להזמין</p>
        <h2 id="seo-title">קייטרינג בוטיק מביתר עילית לשבת, אירוח קטן ומארזים לדרך.</h2>
      </div>
      <div className="reveal">
        <p>
          Nis נותנת מענה למי שמחפש קייטרינג בוטיק בביתר עילית והסביבה: תפריט שבת מוכן, מגשי
          אירוח לאירועים קטנים, פינגר פוד, בראנץ׳ משפחתי ומארזי פיקניק או דרך. כל פנייה מתחילה
          בשיחה קצרה כדי להבין את סוג האירוח, כמות הסועדים, התאריך והתחושה שרוצים ליצור.
        </p>
        <div className="seo-tags" aria-label="תחומי שירות">
          {seoTopics.map((topic) => (
            <span key={topic}>{topic}</span>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export const TrustSection = () => (
  <section className="section trust-section" aria-labelledby="trust-title">
    <div className="container">
      <SectionHeading eyebrow="מה מרגיע לפני שסוגרים" title="פחות סימני שאלה, יותר תחושה שיש עם מי לדבר." id="trust-title" />
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
);

export const FaqSection = () => (
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
);

interface ContactSectionProps {
  readonly contactWhatsapp: string;
  readonly email: string;
  readonly leadSource: string;
  readonly onLeadSourceChange: (value: string) => void;
  readonly onSubmit: FormEventHandler<HTMLFormElement>;
}

export const ContactSection = ({
  contactWhatsapp,
  email,
  leadSource,
  onLeadSourceChange,
  onSubmit,
}: ContactSectionProps) => (
  <section
    id="contact"
    className="section contact-section"
    aria-labelledby="contact-title"
    style={{ '--contact-media-image': `url('${foodMedia.tableSettingBlueGold.src}')` } as CSSProperties}
  >
    <div className="container contact-grid">
      <div className="contact-copy reveal">
        <p className="eyebrow">יצירת קשר</p>
        <h2 id="contact-title">אהבתם את הסגנון? שלחו פנייה מסודרת לוואטסאפ.</h2>
        <p>
          הטופס נשאר קצר ומעשי: סוג הזמנה, תאריך, כמות והערה. אחרי השליחה נפתחת הודעת וואטסאפ
          מוכנה, כדי שיהיה קל להמשיך לשיחה אישית.
        </p>
        <div className="contact-actions">
          <a className="button primary" href={contactWhatsapp} data-event="contact_whatsapp">
            <MessageCircle aria-hidden="true" />
            קבלו הצעה מותאמת בוואטסאפ
          </a>
          <a className="button secondary" href="tel:+972503502615">
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
      <form className="contact-form reveal" onSubmit={onSubmit}>
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
            onChange={(event) => onLeadSourceChange(event.target.value)}
          >
            <option>ניס בטעם של שבת</option>
            <option>ניס בכיס - מגשי אירוח</option>
            <option>Travel Nis</option>
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
);
