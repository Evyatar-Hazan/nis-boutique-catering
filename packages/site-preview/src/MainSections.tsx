import { type CSSProperties } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';
import { useSiteSectionPreviewData } from './SiteSectionPreviewData';
import { SectionHeading, TextParagraphs } from './SectionShared';

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
