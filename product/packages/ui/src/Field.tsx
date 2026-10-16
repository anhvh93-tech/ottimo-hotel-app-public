import { useId, type ReactNode } from 'react';
import { Icon } from './Icon';

export interface FieldControlProps {
  id: string;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
  'aria-required'?: true;
}

export interface FieldProps {
  label: ReactNode;
  required?: boolean;
  help?: ReactNode;
  error?: ReactNode;
  className?: string;
  /** Render the control with the wired-up id / aria attributes. */
  children: (control: FieldControlProps) => ReactNode;
}

/** C3 field: label, help, error under the control (EP00 0.2.1), all linked for screen readers. */
export function Field({ label, required, help, error, className, children }: FieldProps) {
  const id = useId();
  const helpId = help ? `${id}-help` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [errId, helpId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={['field', error ? 'invalid' : '', className ?? ''].filter(Boolean).join(' ')}>
      <label htmlFor={id}>
        {label}
        {required ? (
          <>
            {' '}
            <span className="req" aria-hidden="true">
              *
            </span>
          </>
        ) : null}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
        'aria-required': required ? true : undefined,
      })}
      {help ? (
        <span className="help" id={helpId}>
          {help}
        </span>
      ) : null}
      {error ? (
        <div className="err" id={errId}>
          <Icon name="x" />
          <span>{error}</span>
        </div>
      ) : null}
    </div>
  );
}
