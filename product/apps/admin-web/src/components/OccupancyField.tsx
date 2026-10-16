import { useI18n } from '@ottimo/i18n';
import { Icon, Stepper } from '@ottimo/ui';
import { useId } from 'react';
import { occupancy } from '../app/reservations';

export interface Occupancy {
  adults: number;
  children6to11: number;
  childrenUnder6: number;
}

export interface OccupancyFieldProps {
  value: Occupancy;
  onChange: (next: Occupancy) => void;
  room?: { roomNo: string; baseOccupancy?: number; maxOccupancy?: number };
  /** Server field error (e.g. CAPACITY_EXCEEDED after a room change elsewhere). */
  error?: string;
  /** OTA bookings are not blocked on capacity (EP02 §0) – only warned. */
  enforceMax?: boolean;
  /** Short labels for the narrow sale form (H12). */
  compact?: boolean;
  /** Long-stay form: extra-guest fee follows the paper contract (H10). */
  footnote?: string;
}

/**
 * Guest count (H09/H10/H12, ESC-014): adults + children 6–11 count toward capacity, children under 6
 * do not. Above the maximum → blocked at the field (US-004 AC3) before saving; above the standard
 * occupancy → reminder to prepare the extra-guest kit (BR-812) – housekeeping gets the task on save.
 */
export function OccupancyField({
  value,
  onChange,
  room,
  error,
  enforceMax = true,
  compact,
  footnote,
}: OccupancyFieldProps) {
  const { t } = useI18n();
  const id = useId();
  const base = room?.baseOccupancy ?? 2;
  const max = room?.maxOccupancy ?? base + 1;
  const { occ, extra } = occupancy(value.adults, value.children6to11, base);
  const over = !!room && occ > max;
  const errText = over ? t('error.CAPACITY_EXCEEDED', { room: room!.roomNo, max }) : error;
  const full = enforceMax && !!room && occ >= max;
  const set = (patch: Partial<Occupancy>) => onChange({ ...value, ...patch });
  const errId = `${id}-err`;
  return (
    <fieldset
      className={`card field${errText ? ' invalid' : ''}`}
      style={{ background: 'var(--bg)', margin: '0 0 14px' }}
    >
      <legend className="label-h">
        {t('booking.field.guests')}{' '}
        <span className="req" aria-hidden="true">
          *
        </span>
      </legend>
      <div className="occ-row">
        <div className="occ">
          <span id={`${id}-a`}>{t(compact ? 'occ.adults_short' : 'occ.adults')}</span>
          <Stepper
            value={value.adults}
            min={1}
            max={full ? value.adults : 9}
            onChange={(adults) => set({ adults })}
            labelledBy={`${id}-a`}
            describedBy={errText ? errId : undefined}
            decLabel={`${t('rooms.dec')} ${t(compact ? 'occ.adults_short' : 'occ.adults')}`}
            incLabel={`${t('rooms.inc')} ${t(compact ? 'occ.adults_short' : 'occ.adults')}`}
            invalid={!!errText}
          />
        </div>
        <div className="occ">
          <span id={`${id}-c`}>{t(compact ? 'occ.children_short' : 'occ.children')}</span>
          <Stepper
            value={value.children6to11}
            min={0}
            max={full ? value.children6to11 : 9}
            onChange={(children6to11) => set({ children6to11 })}
            labelledBy={`${id}-c`}
            decLabel={`${t('rooms.dec')} ${t(compact ? 'occ.children_short' : 'occ.children')}`}
            incLabel={`${t('rooms.inc')} ${t(compact ? 'occ.children_short' : 'occ.children')}`}
          />
        </div>
        <div className="occ">
          <span id={`${id}-u`}>{t(compact ? 'occ.under6_short' : 'occ.under6')}</span>
          <Stepper
            value={value.childrenUnder6}
            min={0}
            max={4}
            onChange={(childrenUnder6) => set({ childrenUnder6 })}
            labelledBy={`${id}-u`}
            decLabel={`${t('rooms.dec')} ${t(compact ? 'occ.under6_short' : 'occ.under6')}`}
            incLabel={`${t('rooms.inc')} ${t(compact ? 'occ.under6_short' : 'occ.under6')}`}
          />
        </div>
      </div>
      {room ? (
        <p className="li-s" style={{ margin: '8px 0 0' }} aria-live="polite">
          {t('sale.room_meta', { base, max })}
        </p>
      ) : null}
      {errText ? (
        <div className="err" id={errId} role="alert" style={{ marginTop: 6 }}>
          <Icon name="x" />
          <span>{errText}</span>
        </div>
      ) : null}
      {!over && extra > 0 ? (
        <div className="amenity" style={{ marginTop: 8 }} role="status">
          <Icon name="sofa" />
          <span>{t('occ.kit_reminder', { n: extra })}</span>
        </div>
      ) : null}
      <p className="help muted" style={{ fontSize: '.75rem', margin: '6px 0 0' }}>
        {footnote ?? t('occ.under6_note')}
      </p>
    </fieldset>
  );
}
