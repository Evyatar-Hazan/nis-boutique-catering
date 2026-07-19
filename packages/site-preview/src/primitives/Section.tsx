import type { HTMLAttributes, ReactNode } from 'react';

export type SectionTone = 'light' | 'soft' | 'dark';

export interface SectionProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  readonly children: ReactNode;
  readonly labelledBy: string;
  readonly tone?: SectionTone;
}

export const Section = ({ children, className, labelledBy, tone = 'light', ...sectionProps }: SectionProps) => {
  const classes = ['section', 'ui-section', `ui-section--${tone}`, className].filter(Boolean).join(' ');
  return (
    <section {...sectionProps} className={classes} aria-labelledby={labelledBy}>
      {children}
    </section>
  );
};
