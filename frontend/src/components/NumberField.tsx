interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min: number;
  max?: number;
  step?: string;
  optional?: boolean;
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = "1",
  optional = false,
}: NumberFieldProps) {
  return (
    <label className="input-label">
      {label}
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        min={min}
        max={max}
        step={step}
        required={!optional}
      />
    </label>
  );
}
