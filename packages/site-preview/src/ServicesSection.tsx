import { publicServicesDefaults } from '@monorepo/content-schema';
import type { SiteSectionPreviewData } from './SiteSectionPreviewData';
import { useSiteSectionPreviewData } from './SiteSectionPreviewData';
import { buildInquiryWhatsappLink } from './contactHelpers';
import { ServiceCard } from './primitives/Cards';
import { Section } from './primitives/Section';
import { SectionHeading } from './primitives/SectionHeading';

type SourceService = SiteSectionPreviewData['services'][number];

export type PublicService = SourceService & {
  readonly ctaLabel: string;
  readonly id: string;
  readonly message: string;
  readonly order: number;
};

export const getPublicServices = (services: readonly SourceService[]): readonly PublicService[] => {
  if (services.length !== publicServicesDefaults.items.length) {
    return [];
  }

  return publicServicesDefaults.items.flatMap((definition, index) => {
    const source = services[index];
    if (!source) {
      return [];
    }
    return [{
      ...source,
      ctaLabel: definition.ctaLabel,
      id: definition.id,
      message: definition.message,
      order: definition.order,
      title: definition.title,
    }];
  });
};

export const ServicesSection = () => {
  const { services, whatsappBase } = useSiteSectionPreviewData();
  const publicServices = getPublicServices(services);

  return (
    <Section id="experiences" className="services-section scroll-scene scroll-scene--services" labelledBy="experiences-title" tone="soft">
      <div className="container">
        <SectionHeading
          eyebrow={publicServicesDefaults.eyebrow}
          id="experiences-title"
          title={publicServicesDefaults.title}
        >
          <p>{publicServicesDefaults.description}</p>
        </SectionHeading>

        {publicServices.length === 3 ? (
          <div className="services-grid" data-reveal-stagger="70">
            {publicServices.map((service) => (
              <ServiceCard
                key={service.id}
                bestFor={service.bestFor}
                ctaHref={buildInquiryWhatsappLink(whatsappBase, service.message)}
                ctaLabel={service.ctaLabel}
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
