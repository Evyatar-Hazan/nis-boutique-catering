import type { ReactNode } from 'react';

type FieldProps = {
  readonly label: string;
  readonly help: string;
  readonly children: ReactNode;
};

export const Field = ({ label, help, children }: FieldProps) => (
  <label className="field-block">
    <span>{label}</span>
    <small>{help}</small>
    {children}
  </label>
);
