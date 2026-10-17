/**
 * Printable label of a folio line (DOM BE-21, ARC review S3 C: `labelKey` (`bill.line.*`) + `labelParams`).
 * The bill and the folio never show technical descriptions ("room_night", "late_checkout 13:00 30%",
 * "retain_with_guest_consent"); clients translate `labelKey` with `labelParams` (VI, VI/EN – BR-009).
 * `description` stays for the money log only.
 *
 * Params come from `folio_line.label_params` when the posting module gave them (FolioLineInput.labelParams),
 * otherwise from the known system descriptions of BE-A/BE-B (fallback, kept until every poster passes params).
 * Dates are ISO local dates (`YYYY-MM-DD`), times `HH:mm`, percentages integers – the client formats them.
 *
 * Keys and params (closed per key):
 * BR-012 (0.3.7 D1, S4-52 – BE-A): `room` / `from` / `to` are ROOM NAMES (The Pine…) in every response – the lines
 * keep room numbers, the name is read when shown (`roomName`, current room table; a settled folio uses the names
 * frozen at settlement – `folio.settled_room_names`, room-names.ts); a room without a name shows its number.
 *
 *   bill.line.room_night {date, room?} · bill.line.extra_night {date, room?} (E05-11, room line with charge_code
 *   `extra_night`) · bill.line.extra_person {date, count?} · bill.line.early_checkin {time, pct}
 *   bill.line.late_checkout {time, pct} · bill.line.early_departure_fee {pct?, nights?, noticeDays?}
 *   bill.line.overpayment_retained · bill.line.room_change {from, to} · bill.line.minibar {item, qty}
 *   bill.line.cancellation_fee · bill.line.no_show_fee · bill.line.foc {reason?} · bill.line.discount {reason?}
 *   bill.line.laundry {qty} · bill.line.adhoc_cleaning {qty} · bill.line.smoking_fee · bill.line.key_card_fee {qty}
 *   bill.line.damage {item, qty} · bill.line.fnb {text, qty} · bill.line.service_fee {text, qty}
 *   bill.line.utilities · bill.line.adjustment
 */
export type LabelParams = Record<string, string | number>;

export interface LineLabel {
  labelKey: string;
  labelParams?: LabelParams;
}

export interface LabelSource {
  category: string;
  charge_code?: string | null;
  description: string;
  service_date: string | null;
  quantity: string | number;
  label_params?: LabelParams | null;
}

export interface LabelContext {
  /** Room number of the stay on a business date (segment covering it), null when unknown. */
  roomOn?: (date: string | null) => string | null;
  /** BR-012: display name of a room number (null = no name → the number is shown). */
  roomName?: (roomNo: string) => string | null;
  /** Approval reason code of a FOC/discount line. */
  reasonOf?: (line: LabelSource) => string | null;
  /** Name of a damage catalogue item (`damage.<code>`). */
  catalogName?: (chargeCode: string) => string | null;
}

const qtyOf = (l: LabelSource): number => {
  const n = Number(l.quantity);
  return Number.isFinite(n) ? n : 1;
};

function clean(p: Record<string, string | number | null | undefined>): LabelParams | undefined {
  const out: LabelParams = {};
  for (const [k, v] of Object.entries(p)) if (v !== null && v !== undefined && v !== '') out[k] = v;
  return Object.keys(out).length ? out : undefined;
}

function label(
  labelKey: string,
  params?: Record<string, string | number | null | undefined>,
): LineLabel {
  const labelParams = params ? clean(params) : undefined;
  return labelParams ? { labelKey, labelParams } : { labelKey };
}

/** "late_checkout 13:00 30%" / "early_checkin 10:00 30%" → {time, pct}. */
function timePct(description: string): { time?: string; pct?: number } {
  const m = /(\d{2}:\d{2})\s+(\d+)%/.exec(description);
  return m ? { time: m[1] as string, pct: Number(m[2]) } : {};
}

/** BR-012: `room` / `from` / `to` params as room names. */
function named(out: LineLabel, ctx: LabelContext): LineLabel {
  const p = out.labelParams;
  if (!p || !ctx.roomName) return out;
  const next: LabelParams = { ...p };
  for (const k of ['room', 'from', 'to'] as const) {
    const v = p[k];
    if (typeof v === 'string' && v !== '') next[k] = ctx.roomName(v) ?? v;
  }
  return { labelKey: out.labelKey, labelParams: next };
}

export function lineLabel(l: LabelSource, ctx: LabelContext = {}): LineLabel {
  return named(rawLabel(l, ctx), ctx);
}

function rawLabel(l: LabelSource, ctx: LabelContext): LineLabel {
  const given = l.label_params ?? {};
  const d = l.description ?? '';
  switch (l.category) {
    case 'room':
      return label(
        l.charge_code === 'extra_night' ? 'bill.line.extra_night' : 'bill.line.room_night',
        {
          date: l.service_date,
          room: ctx.roomOn?.(l.service_date) ?? null,
          ...given,
        },
      );
    case 'extra_person': {
      const m = /x(\d+)/.exec(d);
      return label('bill.line.extra_person', {
        date: l.service_date,
        count: m ? Number(m[1]) : null,
        ...given,
      });
    }
    case 'early_checkin':
      return label('bill.line.early_checkin', { ...timePct(d), ...given });
    case 'late_checkout':
      return label('bill.line.late_checkout', { ...timePct(d), ...given });
    case 'early_departure_fee': {
      const m = /(\d+)d\b/.exec(d);
      return label('bill.line.early_departure_fee', {
        noticeDays: m ? Number(m[1]) : null,
        ...given,
      });
    }
    case 'deposit_forfeit':
      // retain_with_guest_consent (DOM S3-4, 0.3.6 bổ sung 2): charge_code `overpayment_retained`.
      return label('bill.line.overpayment_retained', given);
    case 'room_change_difference': {
      const m = /(\S+)->(\S+)/.exec(d);
      return label('bill.line.room_change', {
        from: m ? (m[1] as string) : null,
        to: m ? (m[2] as string) : null,
        ...given,
      });
    }
    case 'minibar':
      return label('bill.line.minibar', { item: d, ...given, qty: qtyOf(l) });
    case 'cancellation_fee':
      return label('bill.line.cancellation_fee', given);
    case 'no_show_fee':
      return label('bill.line.no_show_fee', given);
    case 'foc':
    case 'discount':
      return label(l.category === 'foc' ? 'bill.line.foc' : 'bill.line.discount', {
        reason: ctx.reasonOf?.(l) ?? null,
        ...given,
      });
    case 'laundry':
      return label('bill.line.laundry', { ...given, qty: qtyOf(l) });
    case 'cleaning':
      return label('bill.line.adhoc_cleaning', { ...given, qty: qtyOf(l) });
    case 'penalty':
      if (l.charge_code === 'key_card_fee') {
        return label('bill.line.key_card_fee', { ...given, qty: qtyOf(l) });
      }
      return label('bill.line.smoking_fee', given);
    case 'damage': {
      const code = l.charge_code ?? null;
      const name = code ? (ctx.catalogName?.(code) ?? null) : null;
      return label('bill.line.damage', { item: name ?? d, ...given, qty: qtyOf(l) });
    }
    case 'fnb':
      return label('bill.line.fnb', { text: d, ...given, qty: qtyOf(l) });
    case 'service_fee':
      return label('bill.line.service_fee', { text: d, ...given, qty: qtyOf(l) });
    case 'utilities':
      return label('bill.line.utilities', given);
    default:
      return label('bill.line.adjustment', given);
  }
}

/** Room number per business date from reservation segments (`fromDate` ≤ date < `toDate`). */
export function roomResolver(
  segments: ReadonlyArray<{ roomNo?: string; fromDate?: string; toDate?: string }>,
): (date: string | null) => string | null {
  return (date) => {
    if (!date) return segments[segments.length - 1]?.roomNo ?? null;
    const seg = segments.find(
      (s) =>
        s.fromDate !== undefined && s.toDate !== undefined && s.fromDate <= date && date < s.toDate,
    );
    return seg?.roomNo ?? segments[segments.length - 1]?.roomNo ?? null;
  };
}
