import { publicTrustDefaults } from '@monorepo/content-schema';
import type { IconComponent } from './primitives/Cards';
import { OptimizedImage, Section, SectionHeading } from './primitives';
import { useSiteSectionPreviewData } from './SiteSectionPreviewData';

interface TrustPointSource {
  readonly icon: IconComponent;
  readonly text: string;
  readonly title: string;
}

export const getPublicTrustPoints = (source: readonly TrustPointSource[]) => {
  if (source.length !== publicTrustDefaults.points.length) return [];

  return publicTrustDefaults.points.map((point, index) => ({
    ...point,
    icon: source[index].icon,
  }));
};

export const TrustSection = () => {
  const { heroMedia, trustCards: sourcePoints } = useSiteSectionPreviewData();
  const trustPoints = getPublicTrustPoints(sourcePoints);

  return (
    <Section className="trust-section scroll-scene scroll-scene--trust" labelledBy="trust-title">
      <div className="container trust-layout">
        <div className="trust-copy">
          <SectionHeading
            eyebrow={publicTrustDefaults.eyebrow}
            title={publicTrustDefaults.title}
            id="trust-title"
          >
            <p>{publicTrustDefaults.description}</p>
          </SectionHeading>
          {trustPoints.length === 3 ? (
            <div className="trust-points" data-reveal-stagger="50">
              {trustPoints.map((point, index) => {
                const Icon = point.icon;
                return (
                  <article
                    className="trust-point reveal"
                    data-reveal-direction={index % 2 === 0 ? 'inline-start' : 'inline-end'}
                    data-reveal-duration="620"
                    data-reveal-threshold="0.1"
                    key={point.id}
                  >
                    <Icon aria-hidden="true" className="card-icon" />
                    <div>
                      <h3>{point.title}</h3>
                      <p>{point.text}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="section-status" role="status">פרטי השירות מתעדכנים כרגע.</p>
          )}
        </div>
        <OptimizedImage
          className="trust-media reveal scroll-driven-media"
          data-reveal-duration="760"
          data-reveal-variant="focus"
          image={heroMedia.background}
          alt="שולחן אירוח של Nis עם מנות ומגשים מוכנים להגשה"
          loading="lazy"
          decoding="async"
        />
      </div>
    </Section>
  );
};
