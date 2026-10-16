import type { Guest, GuestSummary } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Icon } from '@ottimo/ui';
import { useEffect, useId, useState, type KeyboardEvent, type ReactNode } from 'react';
import { findGuests } from '../app/guestSearch';
import { useDebounced } from '../hooks/useDebounced';
import { GuestFormDialog } from '../pages/GuestFormDialog';
import { usePropertyId } from '../session/SessionProvider';

export interface GuestPickerProps {
  label: string;
  onSelect: (guest: GuestSummary) => void;
  /** Text shown when the form reopens with a chosen guest (draft / prefill). */
  initialText?: string;
  required?: boolean;
  /** Field error (EP00 0.2.1) – linked with aria-describedby. */
  error?: string;
  help?: ReactNode;
}

/**
 * Shared guest picker (US-073, H06 6.3) – APG combobox: ↑/↓ move, Enter picks, Esc closes.
 * From 2 characters, 300 ms after typing; max 5 results (`picker=true`); last option = quick create.
 * Used by booking, long-stay, quotes and party forms (Sprint 2+).
 */
export function GuestPicker({
  label,
  onSelect,
  initialText = '',
  required,
  error,
  help,
}: GuestPickerProps) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const id = useId();
  const [text, setText] = useState(initialText);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<GuestSummary[]>([]);
  const [failed, setFailed] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [creating, setCreating] = useState(false);
  const q = useDebounced(text.trim(), 300);

  useEffect(() => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let stale = false;
    findGuests(propertyId, q, true).then(
      (r) => {
        if (stale) return;
        setResults(r.slice(0, 5));
        setFailed(false);
        setActiveIdx(0);
      },
      () => !stale && setFailed(true),
    );
    return () => {
      stale = true;
    };
  }, [q, propertyId]);

  const options =
    q.length >= 2
      ? [...results.map((r) => ({ kind: 'guest' as const, r })), { kind: 'new' as const }]
      : [];
  const expanded = open && options.length > 0;

  const choose = (i: number) => {
    const o = options[i];
    if (!o) return;
    if (o.kind === 'new') setCreating(true);
    else {
      onSelect(o.r);
      setText(o.r.displayName);
      setOpen(false);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIdx((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && expanded) {
      e.preventDefault();
      choose(activeIdx);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className={`field combo${error ? ' invalid' : ''}`}>
      <label htmlFor={`${id}-in`}>
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
      <input
        id={`${id}-in`}
        className="input"
        role="combobox"
        aria-expanded={expanded}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={expanded ? `${id}-o${activeIdx}` : undefined}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [error ? `${id}-err` : '', help ? `${id}-help` : ''].filter(Boolean).join(' ') ||
          undefined
        }
        autoComplete="off"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
        }}
        onKeyDown={onKey}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {expanded ? (
        <ul className="combo-list" id={`${id}-list`} role="listbox" aria-label={label}>
          {failed ? (
            <li role="presentation" className="li-s" style={{ padding: 8 }}>
              {t('common.error_generic_title')}
            </li>
          ) : results.length === 0 ? (
            <li role="presentation" className="li-s" style={{ padding: 8 }}>
              {t('crm.empty_title', { q })}
            </li>
          ) : null}
          {options.map((o, i) =>
            o.kind === 'guest' ? (
              <li role="presentation" key={o.r.id}>
                <div
                  className="opt"
                  role="option"
                  id={`${id}-o${i}`}
                  aria-selected={i === activeIdx}
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(i)}
                  onKeyDown={(e) => e.key === 'Enter' && choose(i)}
                >
                  <span className="avatar" aria-hidden="true">
                    {o.r.displayName.charAt(0)}
                  </span>
                  <span className="grow">
                    <mark>{o.r.displayName}</mark> · {o.r.code}
                    <br />
                    <span className="li-s">
                      {[o.r.phoneMasked, o.r.nationalityCode].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </div>
              </li>
            ) : (
              <li role="presentation" key="new">
                <div
                  className="opt"
                  role="option"
                  id={`${id}-o${i}`}
                  aria-selected={i === activeIdx}
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(i)}
                  onKeyDown={(e) => e.key === 'Enter' && choose(i)}
                >
                  <Icon name="plus" />
                  <span>{t('crm.quick_create', { q })}</span>
                </div>
              </li>
            ),
          )}
        </ul>
      ) : null}
      {help ? (
        <span className="help" id={`${id}-help`}>
          {help}
        </span>
      ) : null}
      {error ? (
        <div className="err" id={`${id}-err`}>
          <Icon name="x" />
          <span>{error}</span>
        </div>
      ) : null}
      {creating ? (
        <GuestFormDialog
          prefillName={q}
          onClose={() => setCreating(false)}
          onSaved={(g: Guest) => {
            setCreating(false);
            onSelect({
              id: g.id,
              code: g.code,
              displayName: g.fullName,
              nationalityCode: g.nationalityCode,
            });
            setText(g.fullName);
            setOpen(false);
          }}
          onOpenGuest={() => setCreating(false)}
          onUseGuest={(s) => {
            setCreating(false);
            onSelect(s);
            setText(s.displayName);
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
