import { ChefHat, Clock, Package, Utensils } from 'lucide-react';
export { SectionHeading } from './primitives/SectionHeading';

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
