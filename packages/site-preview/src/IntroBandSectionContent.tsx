type IntroBandSectionContentProps = {
  readonly eyebrow: string;
  readonly title: string;
  readonly text?: string;
  readonly className?: string;
};

const TextParagraphs = ({ text }: { readonly text?: string }) => (
  <>
    {text?.split('|').filter(Boolean).map((paragraph) => (
      <p key={paragraph}>{paragraph}</p>
    ))}
  </>
);

export const IntroBandSectionContent = ({
  eyebrow,
  title,
  text,
  className,
}: IntroBandSectionContentProps) => (
  <section className={className ?? 'section intro-band reveal'} aria-label="בידול">
    <div className="container intro-grid">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      <TextParagraphs text={text} />
    </div>
  </section>
);
