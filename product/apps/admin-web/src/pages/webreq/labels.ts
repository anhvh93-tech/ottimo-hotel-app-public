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
