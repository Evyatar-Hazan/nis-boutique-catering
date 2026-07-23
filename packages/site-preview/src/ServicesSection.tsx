import { useSiteSectionPreviewData } from './SiteSectionPreviewData';
import { buildInquiryWhatsappLink } from './contactHelpers';
import { ServiceCard } from './primitives/Cards';
import { Section } from './primitives/Section';
import { SectionHeading } from './primitives/SectionHeading';

export const ServicesSection = () => {
  const { services, whatsappBase } = useSiteSectionPreviewData();
  const activeServices = services.items.filter((service) => service.active);

  return (
    <Section id="experiences" className="services-section scroll-scene scroll-scene--services" labelledBy="experiences-title" tone="soft">
      <div className="container">
        <SectionHeading
          eyebrow={services.eyebrow}
          id="experiences-title"
          title={services.title}
        >
          {services.description ? <p>{services.description}</p> : null}
        </SectionHeading>

        {activeServices.length === 3 ? (
          <div className="services-grid" data-reveal-stagger="70">
            {activeServices.map((service) => (
              <ServiceCard
                key={service.id}
                bestFor={service.bestFor}
                ctaHref={buildInquiryWhatsappLink(whatsappBase, service.cta.message)}
                ctaLabel={service.cta.label}
                description={service.description}
                image={service.image}
                imageAlt={`הגשה לדוגמה עבור ${service.title}`}
                title={service.title}
              />
            ))}
          </div>
        ) : (
          <p className="services-empty" role="status">אפשרויות ההזמנה מתעדכנות כרגע. אפשר לפנות אלינו בוואטסאפ ונשמח לעזור.</p>
        )}
      </div>
    </Section>
  );
};
