type ToggleProps = {
  readonly checked: boolean;
  readonly label: string;
  readonly onChange: (checked: boolean) => void;
};

export const Toggle = ({ checked, label, onChange }: ToggleProps) => (
  <label className="toggle-control">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    <span>{label}</span>
  </label>
);
