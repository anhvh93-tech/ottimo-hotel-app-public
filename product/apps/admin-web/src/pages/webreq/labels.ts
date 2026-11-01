import type {
  WebsiteBookingRequest,
  WebsiteBookingRequestDeclineReason,
  WebsiteBookingRequestStatus,
} from '@ottimo/api-client';
import type { IconName } from '@ottimo/ui';
import { dayMonth } from '../../app/reservations';

type Translate = (key: string, args?: Record<string, string | number>) => string;
type Tone = 'ok' | 'warn' | 'bad' | 'ink' | 'neutral' | 'oak';

/** SM-18 status chip: icon + words, never colour alone (EP19 10). */
export const WR_STATUS: Record<
  WebsiteBookingRequestStatus,
  { key: string; tone: Tone; icon: IconName }
> = {
  new: { key: 'webreq.status.new', tone: 'oak', icon: 'bell' },
  in_progress: { key: 'webreq.status.in_progress', tone: 'ink', icon: 'hourglass' },
  converted: { key: 'webreq.status.converted', tone: 'ok', icon: 'check' },
  declined: { key: 'webreq.status.declined', tone: 'neutral', icon: 'x' },
  spam: { key: 'webreq.status.spam', tone: 'bad', icon: 'alert' },
};
export const STATUSES = Object.keys(WR_STATUS) as WebsiteBookingRequestStatus[];
export const DEFAULT_STATUSES: WebsiteBookingRequestStatus[] = ['new', 'in_progress'];

/** The 7 reasons staff choose (DOM Q-W01 v0.3.8, BR-913 (9)); `stale` / `erased_on_request` are system-only. */
export const STAFF_DECLINE_REASONS: WebsiteBookingRequestDeclineReason[] = [
  'no_availability',
  'price_not_accepted',
  'guest_not_proceeding',
  'guest_unreachable',
  'duplicate',
  'policy_mismatch',
  'other',
];
/** Reasons with a suggested reply staff send BEFORE closing (EP19 6.1 "Gửi tin? = Có"). */
export const REPLY_TEMPLATE_REASONS: WebsiteBookingRequestDeclineReason[] = [
  'no_availability',
  'price_not_accepted',
  'guest_not_proceeding',
  'policy_mismatch',
];

export const FLAG_KEYS = [
  'contains_url',
  'unexpected_script',
  'far_future',
  'repeat_contact',
  'room_type_unmatched',
  'possible_duplicate',
  'offer_unverified',
] as const;

export const CHANNEL_KEY: Record<WebsiteBookingRequest['preferredChannel'], string> = {
  zalo: 'webreq.channel.zalo',
  whatsapp: 'webreq.channel.whatsapp',
  telegram: 'webreq.channel.telegram',
  viber: 'webreq.channel.viber',
  phone: 'webreq.channel.phone',
  email: 'webreq.channel.email',
};
export const CHANNEL_ICON: Record<WebsiteBookingRequest['preferredChannel'], IconName> = {
  zalo: 'chat',
  whatsapp: 'chat',
  telegram: 'chat',
  viber: 'chat',
  phone: 'bell',
  email: 'globe',
};

/** "Website · Facebook" (US-155 AC6); no sub-source → "Website". */
export function sourceText(t: Translate, r: Pick<WebsiteBookingRequest, 'subSource'>): string {
  return r.subSource
    ? t('webreq.source_with', { label: t(`webreq.source.${r.subSource}`) })
    : t('webreq.source.website');
}

export function stayText(t: Translate, r: WebsiteBookingRequest): string {
  if (r.stayKind === 'long' && r.months)
    return t('webreq.stay_long_months', { arrival: dayMonth(r.arrival), months: r.months });
  if (!r.departure) return t('webreq.stay_long_open', { arrival: dayMonth(r.arrival) });
  return t('webreq.stay_short', {
    arrival: dayMonth(r.arrival),
    departure: dayMonth(r.departure),
    nights: r.nights ?? 0,
  });
}

export function guestsText(t: Translate, r: WebsiteBookingRequest): string {
  return [
    t('webreq.adults', { n: r.adults }),
    r.children ? t('webreq.children', { n: r.children }) : '',
    r.infants ? t('webreq.infants', { n: r.infants }) : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

/**
 * The only contact links Desk builds (SEC ARC-21): from the server's E.164 phone, exact pattern, made at click time –
 * `tel:` and `https://wa.me/<digits>`. No Zalo/Telegram/Viber deep link to the guest's number (BR-913 (4)).
 */
export const E164 = /^\+[1-9][0-9]{7,14}$/;
export function phoneLinks(phone: string | undefined): { tel: string; wa: string } | null {
  if (!phone || !E164.test(phone)) return null;
  return { tel: `tel:${phone}`, wa: `https://wa.me/${phone.slice(1)}` };
}

/** Readable E.164 for the desk ("+84 905 123 456"); only spacing – the copied value stays E.164. */
export function phoneDisplay(phone: string): string {
  const m = /^\+(84)(\d{3})(\d{3})(\d+)$/.exec(phone);
  if (m) return `+${m[1]} ${m[2]} ${m[3]} ${m[4]}`;
  return phone.replace(/^(\+\d{1,3})(\d{3})(\d{3})(\d+)$/, '$1 $2 $3 $4');
}

/** `refCode` as the server reads it (SEC UXD-07): drop `-`/spaces, upper case; 8 chars or it is not a code. */
export function cleanRefCode(raw: string): string | null {
  const c = raw.replace(/[-\s]/g, '').toUpperCase();
  return /^[0-9A-Z]{8}$/.test(c) ? c : null;
}

/**
 * US-131 AC10 (BUG-R4-001): the estimate the guest saw on the website form (`priceEstimate` = the signed `seen` part,
 * decoded by the server – never a number the browser declared, SEC ARC-18). `atSubmit` is the server's own
 * recomputation when the request arrived; it is not in OpenAPI 0.3.10 yet (SEC FB-R4-SEC-BE-03 asks ARC to expose
 * it read-only), so it is read only when the API sends it. No figure (null, a monthly stay, no total) → null =
 * "the guest saw no price".
 */
export interface SeenEstimate {
  totalVnd: number;
  computedAt: string;
  roomType: string;
  arrival: string;
  nights: number | null;
  adults: number;
  children: number;
  infants: number;
  /** Server total when the request was submitted – only when it differs from what the guest saw. */
  atSubmitVnd?: number;
}

type EstimateRecord = NonNullable<WebsiteBookingRequest['priceEstimate']> & {
  atSubmit?: { fromTotalVnd?: number | null } | null;
};

export function seenEstimate(r: WebsiteBookingRequest): SeenEstimate | null {
  const p = r.priceEstimate as EstimateRecord | null | undefined;
  if (!p || p.stayKind !== 'short' || typeof p.totalVnd !== 'number') return null;
  const at = p.atSubmit?.fromTotalVnd;
  return {
    totalVnd: p.totalVnd,
    computedAt: p.computedAt,
    roomType: p.roomType,
    arrival: p.arrival,
    nights: p.nights ?? null,
    adults: p.adults,
    children: p.children,
    infants: p.infants,
    ...(typeof at === 'number' && at !== p.totalVnd ? { atSubmitVnd: at } : {}),
  };
}

/**
 * Quote vs the estimate the guest saw (US-131 AC10 "Đã đổi: {cũ} → {mới}"): compared only when the quote is for the
 * same arrival, nights and party – and the same public room type when the room carries one (BR-012; the room list
 * may not send it yet – BUG-R4-004). Other inputs → `other`: never a "changed" claim for a different stay.
 */
export function compareWithSeen(
  seen: SeenEstimate,
  q: {
    arrival: string;
    nights: number;
    adults: number;
    children6to11: number;
    childrenUnder6: number;
    publicRoomType?: string | null;
    totalVnd: number;
  },
): 'same' | 'changed' | 'other' {
  const sameInputs =
    q.arrival === seen.arrival &&
    (seen.nights === null || q.nights === seen.nights) &&
    q.adults === seen.adults &&
    q.children6to11 === seen.children &&
    q.childrenUnder6 === seen.infants &&
    (!q.publicRoomType || q.publicRoomType === seen.roomType);
  if (!sameInputs) return 'other';
  return q.totalVnd === seen.totalVnd ? 'same' : 'changed';
}
