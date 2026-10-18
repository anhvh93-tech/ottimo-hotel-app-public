import type { ApprovalRequest, FolioLine } from '@ottimo/api-client';
import { useResource } from '../hooks/useResource';
import { api } from './api';
import { FOC_REASON, lineLabel } from './folio';

/** What an approval request is about, for the person deciding (UXR S4 P-03): the room and the waived line. */
export interface ApprovalTarget {
  roomNo?: string | null;
  /** The charge a FOC / special discount waives (the line `ApprovalRequest.folioLineId` points at). */
  line?: FolioLine;
}

/** Requests looked up per screen – a few at 10 rooms; past this the card shows what the request carries. */
export const MAX_TARGET_LOOKUPS = 20;

/** Request types that waive a folio line, and the categories of the waiver line itself. */
const WAIVES = new Set(['foc', 'special_discount']);
const WAIVER_LINES = new Set(['foc', 'discount']);

/**
 * `ApprovalRequest` carries the booking code but not the room or the waived charge (contract 0.3.7). Until
 * the API sends them (asked of ARC/BE – R3), they are read here: the booking by its code
 * (`listReservations?q=`), and for a FOC / special discount its folio. One read per booking, every failure
 * ignored (the card still shows code, type, amount, reason).
 */
export function useApprovalTargets(propertyId: string, rows: ApprovalRequest[] | undefined) {
  const wanted = (rows ?? []).filter((a) => a.reservationCode).slice(0, MAX_TARGET_LOOKUPS);
  const codes = [...new Set(wanted.map((a) => a.reservationCode!))];
  const folioCodes = new Set(
    wanted.filter((a) => WAIVES.has(a.type) && a.folioLineId).map((a) => a.reservationCode!),
  );
  const key = codes.map((c) => `${c}${folioCodes.has(c) ? '+f' : ''}`).join(',');
  const { state } = useResource(async () => {
    const out = new Map<string, { roomNo?: string | null; lines?: FolioLine[] }>();
    await Promise.all(
      codes.map(async (code) => {
        try {
          const list = await api.listReservations({ propertyId }, { q: code, limit: 5 });
          const found = list.data.data.find((r) => r.code === code);
          if (!found) return;
          const entry: { roomNo?: string | null; lines?: FolioLine[] } = { roomNo: found.roomNo };
          out.set(code, entry);
          if (!folioCodes.has(code)) return;
          const rsv = (await api.getReservation({ propertyId, reservationId: found.id })).data;
          if (!rsv.folioId) return;
          entry.lines = (await api.getFolio({ propertyId, folioId: rsv.folioId })).data.lines;
        } catch {
          // Detail only – the card keeps what the request itself says.
        }
      }),
    );
    return out;
  }, [propertyId, key]);

  return (a: ApprovalRequest): ApprovalTarget => {
    const hit = a.reservationCode ? state.data?.get(a.reservationCode) : undefined;
    if (!hit) return {};
    const own = a.folioLineId ? hit.lines?.find((l) => l.id === a.folioLineId) : undefined;
    // The request points at its FOC line (negative, `relatedLineId` = the charge); older data at the charge.
    const line =
      own && own.relatedLineId && (own.amountVnd < 0 || WAIVER_LINES.has(own.category))
        ? (hit.lines?.find((l) => l.id === own.relatedLineId) ?? undefined)
        : own;
    return { roomNo: hit.roomNo, line };
  };
}

type T = (key: string, args?: Record<string, string | number>) => string;

/**
 * "Phụ thu nhận sớm (nhận lúc 09:15) · 102 · The Fern" – the waived charge and the room, when known; with
 * `reason` also "Khách quen / VIP" (FOC / discount reason code). Empty parts are left out.
 */
export function approvalFacts(
  t: T,
  a: ApprovalRequest,
  target: ApprovalTarget,
  room: (roomNo?: string | null) => string,
  opts: { reason?: boolean } = {},
): string {
  const reason = opts.reason && FOC_REASON[a.reasonCode] ? t(FOC_REASON[a.reasonCode]!) : '';
  return [
    target.line ? lineLabel(t, target.line) : '',
    target.roomNo ? room(target.roomNo) : '',
    reason,
  ]
    .filter(Boolean)
    .join(' · ');
}
