import type { ReactNode } from 'react';

type PanelHeaderProps = {
  readonly title: string;
  readonly text: string;
  readonly action?: ReactNode;
};

export const PanelHeader = ({ title, text, action }: PanelHeaderProps) => (
  <div className="panel-header">
    <div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
    {action}
  </div>
);
