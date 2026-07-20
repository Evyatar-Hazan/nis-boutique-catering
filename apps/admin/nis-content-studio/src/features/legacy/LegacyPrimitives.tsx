import type { ReactNode } from 'react';

export const Metric = ({ label, value }: { readonly label: string; readonly value: string }) => (
  <article className="metric-card">
    <span>{label}</span>
    <strong>{value}</strong>
  </article>
);

export const Panel = ({
  title,
  text,
  action,
  children,
}: {
  readonly title: string;
  readonly text: string;
  readonly action?: ReactNode;
  readonly children: ReactNode;
}) => (
  <section className="panel">
    <div className="panel-heading">
      <div>
        <p className="eyebrow">ניהול</p>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      {action}
    </div>
    {children}
  </section>
);

export const Field = ({ label, children }: { readonly label: string; readonly children: ReactNode }) => (
  <label className="field">
    <span>{label}</span>
    {children}
  </label>
);

export const ToggleField = ({
  label,
  checked,
  onChange,
}: {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}) => (
  <label className="toggle-field">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    <span>{label}</span>
  </label>
);

export const EmptyState = ({ text }: { readonly text: string }) => (
  <div className="empty-state">{text}</div>
);
