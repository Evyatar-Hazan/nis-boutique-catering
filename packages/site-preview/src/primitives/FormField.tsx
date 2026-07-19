import { cloneElement, useId, type ReactElement } from 'react';

export interface FormFieldProps {
  readonly children: ReactElement<{ readonly 'aria-describedby'?: string; readonly 'aria-invalid'?: boolean; readonly id?: string }>;
  readonly error?: string;
  readonly hint?: string;
  readonly label: string;
}

export const FormField = ({ children, error, hint, label }: FormFieldProps) => {
  const generatedId = useId();
  const fieldId = children.props.id ?? `${generatedId}-field`;
  const descriptionId = hint || error ? `${generatedId}-description` : undefined;
  const input = cloneElement(children, { id: fieldId, 'aria-describedby': descriptionId, 'aria-invalid': Boolean(error) });
  return (
    <div className="form-field">
      <label htmlFor={fieldId}>{label}</label>
      {input}
      {descriptionId ? <p id={descriptionId} className={error ? 'form-field__error' : 'form-field__hint'}>{error ?? hint}</p> : null}
    </div>
  );
};
