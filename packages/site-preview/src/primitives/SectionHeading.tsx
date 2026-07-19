import type { ReactNode } from 'react';

export interface SectionHeadingProps {
  readonly children?: ReactNode;
  readonly className?: string;
  readonly eyebrow?: string;
  readonly id: string;
  readonly title: string;
}

export const SectionHeading = ({ children, className, eyebrow, id, title }: SectionHeadingProps) => (
  <div className={className ?? 'section-heading reveal'}>
    {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
    <h2 id={id}>{title}</h2>
    {children}
  </div>
);
