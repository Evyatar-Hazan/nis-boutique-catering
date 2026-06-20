import { type CSSProperties, type FormEventHandler, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { ArrowLeft, Camera, CheckCircle2, ChefHat, Clock, Mail, MapPin, MessageCircle, Package, Phone, Play, Send, Utensils } from 'lucide-react';
import {
  type GalleryCategory,
  type GalleryImage,
} from '../data/siteContent';
import { buildInquiryWhatsappLink } from '../utils/contact';
import { OptimizedImage } from './OptimizedImage';
import { useSiteSectionPreviewData } from './SiteSectionPreviewData';
import { IntroBandSectionContent } from './sections/IntroBandSection';

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

const MultilineTitle = ({ text }: { readonly text: string }) => (
  <>
    {text.split('\n').map((line, index, lines) => (
      <span key={line}>
        {line}
        {index < lines.length - 1 ? (
          <>
            <br />
            {' '}
          </>
        ) : null}
      </span>
    ))}
  </>
);

const TextParagraphs = ({ text }: { readonly text?: string }) => (
  <>
    {text?.split('|').filter(Boolean).map((paragraph) => (
      <p key={paragraph}>{paragraph}</p>
    ))}
  </>
);

const heroBadgeIcons = [ChefHat, Utensils, Package, Clock] as const;

export const HeroSection = ({ heroWhatsapp }: { readonly heroWhatsapp: string }) => {
  const { brandMedia, heroBadges, heroContent, heroMedia, heroSceneNotes, heroStats, siteMicrocopy, videoMedia } = useSiteSectionPreviewData();

  return (
    <section
      id="top"
      className="hero"
      aria-labelledby="hero-title"
      style={{ '--hero-media-image': `url('${heroMedia.background.src}')` } as CSSProperties}
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
      poster={heroMedia.background.src}
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
          {heroContent.title.split('\n').map((line, index, lines) => (
            <span key={line}>
              {line}
              {index < lines.length - 1 ? (
                <>
                  <br />
                  {' '}
                </>
              ) : null}
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
            {siteMicrocopy.heroPrimaryCta}
          </a>
          <a className="button secondary" href="#gallery">
            <Camera aria-hidden="true" />
            {siteMicrocopy.heroSecondaryCta}
          </a>
        </div>
        <p className="microcopy">{siteMicrocopy.heroMicrocopy}</p>
        <div className="hero-badges" aria-label="נקודות אמון">
          {heroBadges.map((badge, index) => {
            const Icon = heroBadgeIcons[index % heroBadgeIcons.length];
            return (
              <span key={badge}>
                <Icon aria-hidden="true" size={16} />
                {badge}
              </span>
            );
          })}
        </div>
        <dl className="hero-proof" aria-label="נתוני אירוח">
          {heroStats.map((stat) => (
            <div key={stat.value}>
              <dt>{stat.value}</dt>
              <dd>{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="hero-showcase reveal is-visible" aria-label="תמונות אירוח של Nis">
        <div className="hero-stage-frame">
          <OptimizedImage
            className="hero-plate primary-plate"
            image={heroMedia.primary}
            alt="שיפודי סלמון עם לימון"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          <div className="hero-stage-caption">
            <strong>{siteMicrocopy.heroShowcaseTitle}</strong>
            <span>{siteMicrocopy.heroShowcaseText}</span>
          </div>
        </div>
        <OptimizedImage
          className="hero-plate side-plate"
          image={heroMedia.side}
          alt="מגש מטבלים צבעוני"
          decoding="async"
        />
        <OptimizedImage
          className="hero-plate tall-plate"
          image={heroMedia.tall}
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
          {heroBadges.slice(0, 3).map((badge) => (
            <span key={badge}>{badge}</span>
          ))}
        </div>
        <a className="video-chip" href="#gallery">
          <Play aria-hidden="true" size={18} />
          {siteMicrocopy.heroVideoChip}
        </a>
      </div>
    </div>
    </section>
  );
};

export const IntroBandSection = () => {
  const { sectionCopy } = useSiteSectionPreviewData();
  return <IntroBandSectionContent {...sectionCopy.introBand} />;
};

export const ManifestoSection = () => {
  const { manifestoMoments, sectionCopy } = useSiteSectionPreviewData();
  return (
    <section className="section manifesto-section" aria-labelledby="manifesto-title">
    <div className="container manifesto-layout">
      <div className="manifesto-copy reveal">
        <p className="eyebrow">{sectionCopy.manifesto.eyebrow}</p>
        <h2 id="manifesto-title">
          <MultilineTitle text={sectionCopy.manifesto.title} />
        </h2>
        <TextParagraphs text={sectionCopy.manifesto.text} />
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
};

export const EditorialSection = () => {
  const { editorialCards, sectionCopy } = useSiteSectionPreviewData();
  return (
    <section className="section editorial-section" aria-labelledby="editorial-title">
    <div className="container">
      <SectionHeading eyebrow={sectionCopy.editorial.eyebrow} title={sectionCopy.editorial.title} id="editorial-title" />
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
};

export const AudienceSection = () => {
  const { audienceCards, sectionCopy } = useSiteSectionPreviewData();
  return (
    <section className="section" aria-labelledby="audience-title">
    <div className="container">
      <SectionHeading eyebrow={sectionCopy.audience.eyebrow} title={sectionCopy.audience.title} id="audience-title">
        <TextParagraphs text={sectionCopy.audience.text} />
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
};

interface ExperienceLabSectionProps {
  readonly activeExperienceIndex: number;
  readonly onChangeExperience: (index: number) => void;
}

export const ExperienceLabSection = ({
  activeExperienceIndex,
  onChangeExperience,
}: ExperienceLabSectionProps) => {
  const { foodMedia, sectionCopy, services, siteMicrocopy } = useSiteSectionPreviewData();
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
          <p className="eyebrow">{sectionCopy.experienceLab.eyebrow}</p>
          <h2 id="experience-lab-title">{sectionCopy.experienceLab.title}</h2>
          <TextParagraphs text={sectionCopy.experienceLab.text} />
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
                      {siteMicrocopy.experienceCta}
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

export const SignatureSection = () => {
  const { sectionCopy, signatureMoments } = useSiteSectionPreviewData();
  return (
    <section className="section signature-section" aria-labelledby="signature-title">
    <div className="container">
      <SectionHeading eyebrow={sectionCopy.signature.eyebrow} title={sectionCopy.signature.title} id="signature-title" />
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
};

export const BoutiqueSection = () => {
  const { boutiqueReasons, sectionCopy } = useSiteSectionPreviewData();
  return (
    <section className="section boutique-section" aria-labelledby="boutique-title">
    <div className="container boutique-layout">
      <div className="boutique-copy reveal">
        <p className="eyebrow">{sectionCopy.boutique.eyebrow}</p>
        <h2 id="boutique-title">{sectionCopy.boutique.title}</h2>
        <TextParagraphs text={sectionCopy.boutique.text} />
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
};

export const ServicesSection = () => {
  const { sectionCopy, services } = useSiteSectionPreviewData();
  return (
    <section id="experiences" className="section" aria-labelledby="experiences-title">
    <div className="container">
      <SectionHeading eyebrow={sectionCopy.services.eyebrow} title={sectionCopy.services.title} id="experiences-title">
        <TextParagraphs text={sectionCopy.services.text} />
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
};

export const ProcessSection = () => {
  const { processSteps, sectionCopy } = useSiteSectionPreviewData();
  return (
    <section id="process" className="section" aria-labelledby="process-title">
    <div className="container">
      <SectionHeading eyebrow={sectionCopy.process.eyebrow} title={sectionCopy.process.title} id="process-title" />
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
};

export const StorySection = () => {
  const { foodMedia, sectionCopy, storyMoments } = useSiteSectionPreviewData();
  return (
    <section className="section story-section" aria-labelledby="story-title">
    <div className="container story-grid">
      <div className="story-copy reveal">
        <p className="eyebrow">{sectionCopy.story.eyebrow}</p>
        <h2 id="story-title">{sectionCopy.story.title}</h2>
        <TextParagraphs text={sectionCopy.story.text} />
        <TextParagraphs text={sectionCopy.story.extraText} />
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
};

export const SamplesSection = () => {
  const { menuGroups, sectionCopy } = useSiteSectionPreviewData();
  return (
    <section id="samples" className="section soft-section" aria-labelledby="samples-title">
    <div className="container">
      <SectionHeading
        eyebrow={sectionCopy.samples.eyebrow}
        title={sectionCopy.samples.title}
        id="samples-title"
        className="section-heading sample-heading reveal"
      >
        <TextParagraphs text={sectionCopy.samples.text} />
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
};

export const CoordinationSection = () => {
  const { coordinationCards, sectionCopy } = useSiteSectionPreviewData();
  return (
    <section className="section coordination-section" aria-labelledby="coordination-title">
    <div className="container">
      <SectionHeading eyebrow={sectionCopy.coordination.eyebrow} title={sectionCopy.coordination.title} id="coordination-title" />
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
};

export const RealMediaSection = () => {
  const { foodMedia, sectionCopy, videoMedia } = useSiteSectionPreviewData();
  return (
    <section className="section real-media-section" aria-labelledby="real-media-title">
    <div className="container real-media-grid">
      <div className="reveal">
        <p className="eyebrow">{sectionCopy.realMedia.eyebrow}</p>
        <h2 id="real-media-title">{sectionCopy.realMedia.title}</h2>
        <TextParagraphs text={sectionCopy.realMedia.text} />
      </div>
      <video className="reveal" controls muted playsInline preload="none" poster={foodMedia.hostingTableOverview.src}>
        <source src={videoMedia.eventVideo} type="video/mp4" />
      </video>
    </div>
    </section>
  );
};

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
  const { galleryCategories, sectionCopy } = useSiteSectionPreviewData();
  const visibleImages = activeCategory === 'all' ? images.slice(0, 6) : images;

  return (
    <section id="gallery" className="section" aria-labelledby="gallery-title">
      <div className="container">
        <SectionHeading eyebrow={sectionCopy.gallery.eyebrow} title={sectionCopy.gallery.title} id="gallery-title" className="section-heading gallery-heading reveal">
          <TextParagraphs text={sectionCopy.gallery.text} />
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

export const BookingBasicsSection = () => {
  const { coordinationCards, faqs, sectionCopy } = useSiteSectionPreviewData();
  return (
    <section className="section booking-basics-section soft-section" aria-labelledby="booking-basics-title">
    <div className="container booking-basics-grid">
      <div className="reveal">
        <p className="eyebrow">{sectionCopy.bookingBasics.eyebrow}</p>
        <h2 id="booking-basics-title">{sectionCopy.bookingBasics.title}</h2>
        <TextParagraphs text={sectionCopy.bookingBasics.text} />
      </div>
      <div className="booking-basics-content">
        <div className="compact-grid booking-basics-cards">
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
};

export const SeoSection = () => {
  const { sectionCopy, seoTopics } = useSiteSectionPreviewData();
  return (
    <section className="section seo-section" aria-labelledby="seo-title">
    <div className="container split-section">
      <div className="reveal">
        <p className="eyebrow">{sectionCopy.seo.eyebrow}</p>
        <h2 id="seo-title">{sectionCopy.seo.title}</h2>
      </div>
      <div className="reveal">
        <TextParagraphs text={sectionCopy.seo.text} />
        <div className="seo-tags" aria-label="תחומי שירות">
          {seoTopics.map((topic) => (
            <span key={topic}>{topic}</span>
          ))}
        </div>
      </div>
    </div>
    </section>
  );
};

export const TrustSection = () => {
  const { sectionCopy, trustCards } = useSiteSectionPreviewData();
  return (
    <section className="section trust-section" aria-labelledby="trust-title">
    <div className="container">
      <SectionHeading eyebrow={sectionCopy.trust.eyebrow} title={sectionCopy.trust.title} id="trust-title" />
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
};

export const FaqSection = () => {
  const { faqs, sectionCopy } = useSiteSectionPreviewData();
  return (
    <section id="faq" className="section soft-section" aria-labelledby="faq-title">
    <div className="container faq-grid">
      <div className="reveal">
        <p className="eyebrow">{sectionCopy.faq.eyebrow}</p>
        <h2 id="faq-title">{sectionCopy.faq.title}</h2>
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
};

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
}: ContactSectionProps) => {
  const { contactDeliveryOptions, contactInterestOptions, foodMedia, phoneHref, sectionCopy, siteMicrocopy } = useSiteSectionPreviewData();

  return (
    <section
      id="contact"
      className="section contact-section"
      aria-labelledby="contact-title"
      style={{ '--contact-media-image': `url('${foodMedia.tableSettingBlueGold.src}')` } as CSSProperties}
    >
    <div className="container contact-grid">
      <div className="contact-copy reveal">
        <p className="eyebrow">{sectionCopy.contact.eyebrow}</p>
        <h2 id="contact-title">{sectionCopy.contact.title}</h2>
        <TextParagraphs text={sectionCopy.contact.text} />
        <div className="contact-actions">
          <a className="button primary" href={contactWhatsapp} data-event="contact_whatsapp">
            <MessageCircle aria-hidden="true" />
            {siteMicrocopy.contactPrimaryCta}
          </a>
          <a className="button secondary" href={phoneHref}>
            <Phone aria-hidden="true" />
            {siteMicrocopy.contactPhoneCta}
          </a>
          <a className="contact-line" href={`mailto:${email}`}>
            <Mail aria-hidden="true" />
            {email}
          </a>
          <span className="contact-line">
            <MapPin aria-hidden="true" />
            {siteMicrocopy.contactLocation}
          </span>
        </div>
        <div className="contact-promise" aria-label={siteMicrocopy.contactPromiseHeading}>
          <strong>{siteMicrocopy.contactPromiseHeading}</strong>
          <span>{sectionCopy.contact.extraText}</span>
        </div>
      </div>
      <form className="contact-form reveal" onSubmit={onSubmit}>
        <label>
          {siteMicrocopy.formNameLabel}
          <input name="name" autoComplete="name" required />
        </label>
        <label>
          {siteMicrocopy.formPhoneLabel}
          <input name="phone" type="tel" autoComplete="tel" required />
        </label>
        <label>
          {siteMicrocopy.formEmailLabel}
          <input name="email" type="email" autoComplete="email" />
        </label>
        <label>
          {siteMicrocopy.formInterestLabel}
          <select
            name="interest"
            value={leadSource}
            onChange={(event) => onLeadSourceChange(event.target.value)}
          >
            {contactInterestOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          {siteMicrocopy.formDateLabel}
          <input name="date" type="date" />
        </label>
        <label>
          {siteMicrocopy.formGuestsLabel}
          <input name="guests" type="number" min="1" inputMode="numeric" />
        </label>
        <label>
          {siteMicrocopy.formDeliveryLabel}
          <select name="delivery">
            {contactDeliveryOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="full-field">
          {siteMicrocopy.formMessageLabel}
          <textarea name="message" rows={5} />
        </label>
        <button className="button primary full-field" type="submit">
          <Send aria-hidden="true" />
          {siteMicrocopy.formSubmitLabel}
        </button>
      </form>
    </div>
    </section>
  );
};
