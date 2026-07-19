import { type CSSProperties, type FormEventHandler } from 'react';
import { CheckCircle2, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import type { GalleryCategory, GalleryImage } from './sitePreviewTypes';
import { OptimizedImage } from './OptimizedImage';
import { useSiteSectionPreviewData } from './SiteSectionPreviewData';
import { SectionHeading, TextParagraphs } from './SectionShared';
import { Button } from './primitives/Button';

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
        <TextParagraphs text={sectionCopy.faq.text} />
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
          <Button href={contactWhatsapp} data-event="contact_whatsapp">
            <MessageCircle aria-hidden="true" />
            {siteMicrocopy.contactPrimaryCta}
          </Button>
          <Button href={phoneHref} variant="secondary">
            <Phone aria-hidden="true" />
            {siteMicrocopy.contactPhoneCta}
          </Button>
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
        <Button fullWidth type="submit">
          <Send aria-hidden="true" />
          {siteMicrocopy.formSubmitLabel}
        </Button>
      </form>
    </div>
    </section>
  );
};
