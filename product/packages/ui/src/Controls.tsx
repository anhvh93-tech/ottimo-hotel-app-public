import type { ReactNode } from 'react';

export interface SegOption<T extends string> {
  value: T;
  label: ReactNode;
}

export interface SegProps<T extends string> {
  options: SegOption<T>[];
  value: T;
  onChange: (value: T) => void;
  labelledBy?: string;
  label?: string;
  disabled?: boolean;
}

/** C5 segmented control: a group of toggle buttons (aria-pressed). */
export function Seg<T extends string>({
  options,
  value,
  onChange,
  labelledBy,
  label,
  disabled,
}: SegProps<T>) {
  return (
    <div className="seg" role="group" aria-labelledby={labelledBy} aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          disabled={disabled}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  disabled?: boolean;
  describedBy?: string;
}

export function Switch({ checked, onChange, children, disabled, describedBy }: SwitchProps) {
  return (
    <button
      type="button"
      className="switch"
      role="switch"
      aria-checked={checked}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <i aria-hidden="true" />
      <span>{children}</span>
    </button>
  );
}

export interface StepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  labelledBy: string;
  describedBy?: string;
  decLabel: string;
  incLabel: string;
  invalid?: boolean;
}

/** C4 stepper – no free number input; buttons lock at the bounds. */
export function Stepper({
  value,
  min,
  max,
  onChange,
  labelledBy,
  describedBy,
  decLabel,
  incLabel,
  invalid,
}: StepperProps) {
  return (
    <div
      className="stepper"
      role="group"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      style={invalid ? { borderColor: 'var(--bad)', borderWidth: 2 } : undefined}
    >
      <button
        type="button"
        aria-label={decLabel}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <output aria-live="polite">{value}</output>
      <button
        type="button"
        aria-label={incLabel}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, children, disabled }: CheckboxProps) {
  return (
    <label className="check">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{children}</span>
    </label>
  );
}
