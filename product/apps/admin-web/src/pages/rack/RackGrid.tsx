import type { Channel, Rack, RackRoom } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Chip, Icon, type IconName } from '@ottimo/ui';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { channelName, dayMonth, remaining } from '../../app/reservations';
import { layoutRow, packLanes, rangeDays, slotAt, type RackBarX, type Slot } from './rackModel';

const KIND_ICON: Partial<Record<RackBarX['kind'], IconName>> = {
  in_house: 'bed',
  confirmed: 'check',
  long_stay: 'calendar',
  hold: 'hourglass',
  checked_out: 'out',
  ooo: 'lock',
};
const KIND_STATUS: Record<RackBarX['kind'], string> = {
  in_house: 'status.booking.in_house',
  confirmed: 'status.booking.confirmed',
  long_stay: 'status.booking.long_term',
  hold: 'status.booking.hold',
  checked_out: 'status.booking.checked_out',
  ooo: 'status.block.ooo',
  unavailable: 'fo.rack.sold_out',
};

export interface RackGridProps {
  rack: Rack;
  /** Visible rooms (group filter applied by the page). */
  rooms: RackRoom[];
  roomNames?: Record<string, string>;
  channels?: Channel[];
  /** `availability` = sale/CTV view (US-016 AC4): no names except their own items. */
  mode: 'full' | 'availability';
  now: number;
  label: string;
  /** Empty night is bookable (from today, room sellable, online, role may create). */
  canCreate: (room: RackRoom, date: string) => boolean;
  onOpenBar: (bar: RackBarX, cell: HTMLElement) => void;
  onEmptyCell: (room: RackRoom, date: string, cell: HTMLElement) => void;
  /** Focus the today column on mount / when this number changes (T shortcut, "Hôm nay"). */
  focusTodaySignal?: number;
}

interface Row {
  key: string;
  room?: RackRoom;
  lane?: boolean;
  header: ReactNode;
  headerLabel: string;
  slots: Slot[];
}

/**
 * C12–C13 room rack as an ARIA grid (H08 a11y): one row per room (+ "Chưa gán căn" lanes on top),
 * one column per night. Roving tabindex – only the active cell is in the Tab order; ←/→ move between
 * cells of a row (a booking bar is one cell), ↑/↓ keep the night, Home/End jump to the row ends,
 * Enter/Space opens the booking or the new-booking form. Every bar has a full text label (status,
 * dates, channel, "nhập tay", extra guest) – colour is never the only cue (US-016 AC2).
 */
export function RackGrid(props: RackGridProps) {
  const { rack, rooms, roomNames, channels, mode, now, label, canCreate, onOpenBar, onEmptyCell } =
    props;
  const { t, locale } = useI18n();
  const days = useMemo(() => rangeDays(rack), [rack]);
  const todayCol = days.indexOf(rack.today);

  const rows: Row[] = useMemo(() => {
    const lanes = mode === 'full' ? packLanes((rack.unassigned ?? []) as RackBarX[]) : [];
    const laneRows: Row[] = lanes.map((bars, i) => ({
      key: `lane-${i}`,
      lane: true,
      header: (
        <b>
          {t('fo.rack.unassigned_lane', { n: (rack.unassigned ?? []).length })}
          {lanes.length > 1 ? ` · ${i + 1}` : ''}
        </b>
      ),
      headerLabel: t('fo.rack.unassigned_lane', { n: (rack.unassigned ?? []).length }),
      slots: layoutRow(bars, rack.from, rack.days),
    }));
    const roomRows: Row[] = rooms.map((room) => ({
      key: room.roomId,
      room,
      header: (
        <>
          <b>
            {room.roomNo}{' '}
            {roomNames?.[room.roomId] ? (
              <span
                className="faint"
                style={{ fontFamily: 'var(--sans)', fontSize: '.75rem', fontWeight: 500 }}
              >
                {roomNames[room.roomId]}
              </span>
            ) : null}
          </b>
          <span className="hk">{t(`status.room.${room.roomStatus}`)}</span>
          {room.isSellable === false ? <Chip tone="bad">{t('config.stop_sale')}</Chip> : null}
        </>
      ),
      headerLabel: [
        `${t('booking.field.room')} ${room.roomNo}`,
        roomNames?.[room.roomId],
        t(`status.room.${room.roomStatus}`),
        room.isSellable === false ? t('config.stop_sale') : undefined,
      ]
        .filter(Boolean)
        .join(', '),
      slots: layoutRow(room.bars as RackBarX[], rack.from, rack.days),
    }));
    return [...laneRows, ...roomRows];
  }, [rack, rooms, roomNames, mode, t]);

  // Active cell = (row, night column); column -1 = the row header.
  const [active, setActive] = useState({
    row: Math.max(
      0,
      rows.findIndex((r) => r.room),
    ),
    col: Math.max(0, todayCol),
  });
  const refs = useRef(new Map<string, HTMLElement>());
  const wantFocus = useRef(false);
  const keyOf = (row: number, col: number) => {
    if (col < 0) return `${row}:h`;
    const s = slotAt(rows[row]?.slots ?? [], col);
    return s ? `${row}:${s.col}` : `${row}:h`;
  };
  const activeKey = keyOf(
    Math.min(Math.max(active.row, 0), rows.length - 1),
    Math.min(active.col, rack.days - 1),
  );

  useEffect(() => {
    if (wantFocus.current) {
      wantFocus.current = false;
      refs.current.get(activeKey)?.focus();
    }
  }, [activeKey]);

  useEffect(() => {
    if (!props.focusTodaySignal) return;
    const row = Math.max(
      0,
      rows.findIndex((r) => r.room),
    );
    wantFocus.current = true;
    setActive({ row, col: Math.max(0, todayCol) });
    // Re-run only when the page asks (signal), not on every data reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.focusTodaySignal]);

  const activate = (rowIdx: number, slot: Slot | undefined, el: HTMLElement) => {
    const row = rows[rowIdx];
    if (!row || !slot) return;
    if (slot.bar) {
      if (slot.bar.reservationId) onOpenBar(slot.bar, el);
      return;
    }
    const date = days[slot.col]!;
    if (row.room && canCreate(row.room, date)) onEmptyCell(row.room, date, el);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const r = Math.min(Math.max(active.row, 0), rows.length - 1);
    const slots = rows[r]?.slots ?? [];
    const cur = active.col < 0 ? undefined : slotAt(slots, active.col);
    let next: { row: number; col: number } | null = null;
    switch (e.key) {
      case 'ArrowRight':
        next = { row: r, col: cur ? Math.min(cur.col + cur.span, rack.days - 1) : 0 };
        break;
      case 'ArrowLeft':
        next = { row: r, col: cur ? (cur.col === 0 ? -1 : cur.col - 1) : -1 };
        break;
      case 'ArrowDown':
        next = { row: Math.min(r + 1, rows.length - 1), col: active.col };
        break;
      case 'ArrowUp':
        next = { row: Math.max(r - 1, 0), col: active.col };
        break;
      case 'Home':
        next = { row: e.ctrlKey ? 0 : r, col: -1 };
        break;
      case 'End':
        next = { row: e.ctrlKey ? rows.length - 1 : r, col: rack.days - 1 };
        break;
      case 'Enter':
      case ' ': {
        e.preventDefault();
        const el = refs.current.get(activeKey);
        if (el && cur) activate(r, cur, el);
        return;
      }
      default:
        return;
    }
    e.preventDefault();
    // Keep the night when moving through a long bar so ↑/↓ land on the same date.
    if (e.key === 'ArrowLeft' && next.col >= 0) {
      const s = slotAt(slots, next.col);
      if (s) next.col = s.col;
    }
    wantFocus.current = true;
    setActive(next);
  };

  const barLabel = (row: Row, slot: Slot): string => {
    const bar = slot.bar!;
    const range = `${dayMonth(bar.from)} → ${dayMonth(bar.to)}`;
    const parts = [
      row.room ? `${t('booking.field.room')} ${row.room.roomNo}` : t('rack.legend_unassigned'),
      bar.guestDisplayName,
      bar.kind === 'ooo'
        ? t('rack.note.ooo', { reason: bar.label ?? '' })
        : t(KIND_STATUS[bar.kind]),
      bar.kind === 'unavailable' ? undefined : range,
      bar.channelCode ? channelName(channels, bar.channelCode) : undefined,
      bar.reservationCode,
      bar.externalContract ? `${t('rack.manual_badge')} ${t('rack.manual_legend')}` : undefined,
      bar.extraGuestCount ? t('occ.kit_chip', { n: bar.extraGuestCount }) : undefined,
      bar.kind === 'hold' && bar.holdExpiresAt ? holdNote(bar.holdExpiresAt) : undefined,
    ];
    return parts.filter(Boolean).join(', ');
  };

  const holdNote = (iso: string) => {
    const left = remaining(iso, now);
    return left ? t('rack.note.hold_left', { h: left.h, m: left.m }) : '';
  };

  const barContent = (row: Row, slot: Slot) => {
    const bar = slot.bar!;
    const conflict = row.lane || bar.conflictState === 'open';
    const kindClass = conflict ? 'conflict' : bar.kind;
    const left = bar.kind === 'hold' ? remaining(bar.holdExpiresAt, now) : null;
    const urgent = left !== null && left.ms < 2 * 3_600_000;
    let note: ReactNode = null;
    if (conflict) note = t('rack.note.need_room');
    else if (bar.kind === 'hold' && left)
      note = (
        <span className={urgent ? 'countdown bad' : undefined}>
          {t('rack.note.hold_left', { h: left.h, m: left.m })}
        </span>
      );
    else if (bar.kind === 'checked_out') note = t('rack.note.checked_out');
    else if (bar.kind === 'long_stay') note = t('rack.note.long_until', { date: dayMonth(bar.to) });
    else if (bar.kind === 'in_house' && bar.to === rack.today) note = t('rack.note.departs_today');
    else if (bar.kind === 'confirmed' && bar.from === rack.today)
      note = t('rack.note.arrives_today');
    else if (bar.kind === 'unavailable' && bar.reservationId) note = t('rack.yours');
    const name =
      bar.kind === 'ooo'
        ? t('rack.note.ooo', { reason: bar.label ?? '' })
        : bar.kind === 'unavailable'
          ? t('fo.rack.sold_out')
          : [bar.kind === 'long_stay' ? 'HĐ' : null, bar.guestDisplayName]
              .filter(Boolean)
              .join(' · ');
    const icon = conflict ? 'alert' : KIND_ICON[bar.kind];
    return (
      <span
        className={`bar ${kindClass}`}
        aria-hidden="true"
        style={urgent ? { borderColor: 'var(--bad)' } : undefined}
      >
        {icon ? <Icon name={icon} /> : null}
        <span>
          {slot.clippedStart ? '‹ ' : ''}
          {name}
          {note ? <> · {note}</> : null}
        </span>
        {bar.externalContract ? <span className="ext">{t('rack.manual_badge')}</span> : null}
        {bar.extraGuestCount ? (
          <span className="ext" title={t('occ.kit_chip', { n: bar.extraGuestCount })}>
            <Icon name="sofa" size="sm" />
          </span>
        ) : null}
      </span>
    );
  };

  const cols = `168px repeat(${rack.days}, minmax(60px, 1fr))`;
  return (
    <div className="rack-wrap" role="region" aria-label={label}>
      <div
        className="rack"
        role="grid"
        tabIndex={-1}
        aria-label={label}
        aria-rowcount={rows.length + 1}
        aria-colcount={rack.days + 1}
        style={{ gridTemplateColumns: cols, minWidth: 168 + rack.days * 60 }}
        onKeyDown={onKeyDown}
      >
        <div role="row" aria-rowindex={1} style={{ display: 'contents' }}>
          <div className="hd corner" role="columnheader" style={{ gridRow: 1, gridColumn: 1 }}>
            {t('rack.col_room')}
          </div>
          {days.map((d, i) => (
            <div
              key={d}
              role="columnheader"
              className={`hd${d === rack.today ? ' today' : ''}`}
              style={{ gridRow: 1, gridColumn: i + 2 }}
            >
              <b>{d.slice(8, 10)}</b>
              {weekdayShort(d, locale)}
              {d === rack.today ? ` · ${t('fo.rack.today')}` : ''}
            </div>
          ))}
        </div>
        {rows.map((row, ri) => (
          <div key={row.key} role="row" aria-rowindex={ri + 2} style={{ display: 'contents' }}>
            <div
              role="rowheader"
              className={`rm${row.lane ? ' lane' : ''}`}
              style={{ gridRow: ri + 2, gridColumn: 1 }}
              tabIndex={activeKey === `${ri}:h` ? 0 : -1}
              aria-label={row.headerLabel}
              ref={(el) => {
                if (el) refs.current.set(`${ri}:h`, el);
                else refs.current.delete(`${ri}:h`);
              }}
              onFocus={() => setActive({ row: ri, col: -1 })}
            >
              {row.header}
            </div>
            {row.slots.map((slot) => {
              const key = `${ri}:${slot.col}`;
              const date = days[slot.col]!;
              const creatable = !slot.bar && !!row.room && canCreate(row.room, date);
              const openable = !!slot.bar?.reservationId;
              const cls = [
                'cell',
                row.lane ? 'lanecell' : '',
                !slot.bar && date === rack.today ? 'today' : '',
                !slot.bar && date < rack.today ? 'past' : '',
                creatable || openable ? 'actionable' : '',
              ]
                .filter(Boolean)
                .join(' ');
              const label = slot.bar
                ? barLabel(row, slot)
                : creatable
                  ? t('fo.rack.empty_cell_hint', { room: row.room!.roomNo, date: dayMonth(date) })
                  : dayMonth(date);
              return (
                <div
                  key={key}
                  role="gridcell"
                  className={cls}
                  style={{ gridRow: ri + 2, gridColumn: `${slot.col + 2} / span ${slot.span}` }}
                  aria-colindex={slot.col + 2}
                  aria-colspan={slot.span > 1 ? slot.span : undefined}
                  aria-label={label}
                  aria-haspopup={creatable || openable ? 'dialog' : undefined}
                  tabIndex={activeKey === key ? 0 : -1}
                  data-date={date}
                  ref={(el) => {
                    if (el) refs.current.set(key, el);
                    else refs.current.delete(key);
                  }}
                  onFocus={() =>
                    active.row !== ri || slotAt(row.slots, active.col) !== slot
                      ? setActive({ row: ri, col: slot.col })
                      : undefined
                  }
                  onClick={(e) => {
                    setActive({ row: ri, col: slot.col });
                    activate(ri, slot, e.currentTarget);
                  }}
                  onKeyDown={() => undefined}
                >
                  {slot.bar ? barContent(row, slot) : null}
                  {creatable ? <span className="empty" aria-hidden="true" /> : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function weekdayShort(date: string, locale: 'vi' | 'en'): string {
  // vi: "T2…T7, CN" like the hi-fi; en: "Mon…Sun".
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
  if (locale === 'vi') return dow === 0 ? 'CN' : `T${dow + 1}`;
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dow]!;
}
