import { Section, SectionHeading } from './primitives';
import { useSiteSectionPreviewData } from './SiteSectionPreviewData';

export const ProcessSection = () => {
  const { process } = useSiteSectionPreviewData();

  return (
    <Section id="process" className="process-section scroll-scene scroll-scene--process" labelledBy="process-title" tone="soft">
      <div className="container">
        <SectionHeading
          eyebrow={process.eyebrow}
          title={process.title}
          id="process-title"
        >
          {process.description ? <p>{process.description}</p> : null}
        </SectionHeading>
        {process.steps.length === 4 ? (
          <>
            <ol className="process-list" data-reveal-stagger="70">
              {process.steps.map((step) => {
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
              {process.operationalNotes.map((note) => (
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
