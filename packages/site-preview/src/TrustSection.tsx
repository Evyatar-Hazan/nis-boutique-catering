import { OptimizedImage, Section, SectionHeading } from './primitives';
import { useSiteSectionPreviewData } from './SiteSectionPreviewData';

export const TrustSection = () => {
  const { trust } = useSiteSectionPreviewData();

  return (
    <Section className="trust-section scroll-scene scroll-scene--trust" labelledBy="trust-title">
      <div className="container trust-layout">
        <div className="trust-copy">
          <SectionHeading
            eyebrow={trust.eyebrow}
            title={trust.title}
            id="trust-title"
          >
            {trust.description ? <p>{trust.description}</p> : null}
          </SectionHeading>
          {trust.points.length === 3 ? (
            <div className="trust-points" data-reveal-stagger="50">
              {trust.points.map((point, index) => {
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
          image={trust.image}
          alt="שולחן אירוח של Nis עם מנות ומגשים מוכנים להגשה"
          loading="lazy"
          decoding="async"
        />
      </div>
    </Section>
  );
};
