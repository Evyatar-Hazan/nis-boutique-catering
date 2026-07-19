import { type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import { buildInquiryWhatsappLink } from './contactHelpers';
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
              <article className="editorial-card reveal" key={card.title} style={{ '--delay': `${index * 70}ms` } as CSSProperties}>
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

interface ExperienceLabSectionProps {
  readonly activeExperienceIndex: number;
  readonly onChangeExperience: (index: number) => void;
}

export const ExperienceLabSection = ({ activeExperienceIndex, onChangeExperience }: ExperienceLabSectionProps) => {
  const { foodMedia, sectionCopy, services, siteMicrocopy, whatsappBase } = useSiteSectionPreviewData();
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
              <div key={service.title} id={panelId} role="tabpanel" aria-labelledby={tabId} hidden={!isActive}>
                <div className="experience-frame">
                  <OptimizedImage image={service.image} alt="" loading="lazy" decoding="async" />
                  <div className="experience-overlay">
                    <span>0{index + 1}</span>
                    <h3>{service.title}</h3>
                    <p>{service.promise}</p>
                    <ul className="experience-detail-list" aria-label={`מה כולל ${service.title}`}>
                      {service.details.slice(0, 3).map((detail) => (
                        <li key={detail}>{detail}</li>
                      ))}
                    </ul>
                    <a href={buildInquiryWhatsappLink(whatsappBase, service.title)}>
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
