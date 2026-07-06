import { type CSSProperties, useEffect, useState } from 'react';
import { Camera, MessageCircle, Play } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';
import { useSiteSectionPreviewData } from './SiteSectionPreviewData';
import { IntroBandSectionContent } from './IntroBandSectionContent';
import { MultilineTitle, TextParagraphs, heroBadgeIcons } from './SectionShared';

export const HeroSection = ({ heroWhatsapp }: { readonly heroWhatsapp: string }) => {
  const { brandMedia, heroBadges, heroContent, heroMedia, heroSceneNotes, heroStats, siteMicrocopy, videoMedia } = useSiteSectionPreviewData();
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const connection = 'connection' in navigator ? (navigator.connection as { saveData?: boolean }) : undefined;
    if (connection?.saveData) {
      return;
    }

    const enableVideo = () => setShouldLoadVideo(true);

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(enableVideo, { timeout: 2000 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(enableVideo, 1200);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);

  return (
    <section
      id="top"
      className="hero"
      aria-labelledby="hero-title"
      style={{ '--hero-media-image': `url('${heroMedia.background.src}')` } as CSSProperties}
    >
      <div className="hero-media" aria-hidden="true" />
      {shouldLoadVideo ? (
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
      ) : null}
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
          <p className="hero-kicker">{heroContent.kicker}</p>
          <p className="hero-text">{heroContent.text}</p>
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
          <OptimizedImage className="hero-plate side-plate" image={heroMedia.side} alt="מגש מטבלים צבעוני" decoding="async" />
          <OptimizedImage className="hero-plate tall-plate" image={heroMedia.tall} alt="שולחן ערוך לאירוח" decoding="async" />
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
