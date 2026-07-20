import { publicProcessDefaults } from '@monorepo/content-schema';
import type { IconComponent } from './primitives/Cards';
import { Section, SectionHeading } from './primitives';
import { useSiteSectionPreviewData } from './SiteSectionPreviewData';

interface ProcessStepSource {
  readonly icon: IconComponent;
  readonly text: string;
  readonly title: string;
}

export const getPublicProcessSteps = (source: readonly ProcessStepSource[]) => {
  if (source.length !== publicProcessDefaults.steps.length) return [];

  return publicProcessDefaults.steps.map((step, index) => ({
    ...step,
    icon: source[index].icon,
  }));
};

export const ProcessSection = () => {
  const { processSteps: sourceSteps } = useSiteSectionPreviewData();
  const processSteps = getPublicProcessSteps(sourceSteps);

  return (
    <Section id="process" className="process-section scroll-scene scroll-scene--process" labelledBy="process-title" tone="soft">
      <div className="container">
        <SectionHeading
          eyebrow={publicProcessDefaults.eyebrow}
          title={publicProcessDefaults.title}
          id="process-title"
        >
          <p>{publicProcessDefaults.description}</p>
        </SectionHeading>
        {processSteps.length === 4 ? (
          <>
            <ol className="process-list" data-reveal-stagger="70">
              {processSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <li className="process-step reveal" data-reveal-duration="620" data-reveal-threshold="0.1" data-reveal-variant="step" key={step.id}>
                    <span className="step-number" aria-hidden="true">{step.order}</span>
                    <Icon aria-hidden="true" className="card-icon" />
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </li>
                );
              })}
            </ol>
            <aside className="process-notes reveal" data-reveal-duration="560" data-reveal-variant="fade" aria-label="מידע שימושי להזמנה">
              {publicProcessDefaults.operationalNotes.map((note) => (
                <div className="process-note" key={note.id}>
                  <h3>{note.title}</h3>
                  <p>{note.text}</p>
                </div>
              ))}
            </aside>
          </>
        ) : (
          <p className="section-status" role="status">שלבי ההזמנה מתעדכנים כרגע. אפשר לפנות אלינו ישירות בוואטסאפ.</p>
        )}
      </div>
    </Section>
  );
};
