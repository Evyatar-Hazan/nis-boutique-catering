import { type ReactNode } from 'react';
import { ChefHat, Clock, Package, Utensils } from 'lucide-react';

export const SectionHeading = ({
  eyebrow,
  title,
  children,
  id,
  className,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly children?: ReactNode;
  readonly id: string;
  readonly className?: string;
}) => (
  <div className={className ?? 'section-heading reveal'}>
    <p className="eyebrow">{eyebrow}</p>
    <h2 id={id}>{title}</h2>
    {children}
  </div>
);

export const MultilineTitle = ({ text }: { readonly text: string }) => (
  <>
    {text.split('\n').map((line, index, lines) => (
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
  </>
);

export const TextParagraphs = ({ text }: { readonly text?: string }) => (
  <>
    {text?.split('|').filter(Boolean).map((paragraph) => (
      <p key={paragraph}>{paragraph}</p>
    ))}
  </>
);

export const heroBadgeIcons = [ChefHat, Utensils, Package, Clock] as const;
