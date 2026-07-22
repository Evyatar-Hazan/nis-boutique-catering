import { Camera, CheckCircle2, MessageCircle } from 'lucide-react';
import { useSiteSectionPreviewData } from './SiteSectionPreviewData';
import { Button } from './primitives/Button';
import { OptimizedImage } from './primitives/OptimizedImage';

export const HeroSection = ({ heroWhatsapp }: { readonly heroWhatsapp: string }) => {
  const { heroBadges, heroContent, heroMedia, siteMicrocopy } = useSiteSectionPreviewData();

  return (
    <section id="top" className="hero hero--public scroll-scene scroll-scene--hero" aria-labelledby="hero-title">
      <div className="hero-layout">
        <div className="hero-content reveal is-visible scroll-scene__hero-copy">
          <p className="eyebrow">{heroContent.eyebrow}</p>
          <h1 id="hero-title">{heroContent.title}</h1>
          <p className="hero-text">{heroContent.text}</p>
          <div className="hero-actions" role="group" aria-label="פעולות ראשיות">
            <Button href={heroWhatsapp} data-event="hero_whatsapp">
              <MessageCircle aria-hidden="true" />
              {siteMicrocopy.heroPrimaryCta}
            </Button>
            <Button href="#gallery" variant="secondary">
              <Camera aria-hidden="true" />
              {siteMicrocopy.heroSecondaryCta}
            </Button>
          </div>
          <ul className="hero-values" aria-label="היתרונות של Nis">
            {heroBadges.slice(0, 3).map((value) => (
              <li key={value}>
                <CheckCircle2 aria-hidden="true" size={18} />
                {value}
              </li>
            ))}
          </ul>
        </div>

        <div className="hero-visual reveal is-visible scroll-scene__hero-media">
          <OptimizedImage
            className="hero-main-image"
            image={heroMedia.primary}
            alt="שולחן בופה של Nis עם רולים, מאפים, סלטים אישיים ומנות מוכנות להגשה"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
};
