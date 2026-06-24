import type { KeyboardEvent } from 'react';

type TextInputProps = {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly onBlur?: () => void;
  readonly onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
};

export const TextInput = ({
  value,
  onChange,
  placeholder,
  onBlur,
  onKeyDown,
}: TextInputProps) => (
  <input
    value={value}
    onChange={(event) => onChange(event.target.value)}
    placeholder={placeholder}
    onBlur={onBlur}
    onKeyDown={onKeyDown}
  />
);
