/**
 * Google Chat text of a website booking request (ARC gchat-booking-request-notify 2, 8.1–8.5; SEC ESC-041 ★2, ★3,
 * ★5, ★6; SEC-on-us155-enable 4.1). Built by the WORKER at send time (ChatDispatcher) – nothing here is stored or
 * logged. Lives in public-site because only this module reads its tables (module boundaries); the worker gets it
 * through src/worker-chat.ts (never through public-site.module.ts – test/worker-chat-composition.test.ts).
 *
 * Levels (configured by the worker variable BOOKING_REQUEST_CHAT_DETAIL_LEVEL, missing/invalid → A):
 *   A  code, received at (+ "ngoài giờ trực"), reply deadline, "cần gọi ngay", "cần xem kỹ", Desk link;
 *   B  A + arrival/departure, nights or months, guests by age group, short/long stay;
 *   C  B + guest name, the ONE contact the guest gave, preferred channel, message (made safe – chatSafeText).
 * Gates:
 *   - only the FIRST message (`web_request_new`) may carry details; reminders and the erase notice are always A (★6);
 *   - B/C only for a request sent under the notice `CHAT_DETAILS_MIN_NOTICE_VERSION` or later, compared on
 *     `privacy_notice_version.published_at` – never on the version text (★2). Not published yet → A for everyone;
 *   - the base SELECT never names a C2 column; the 5 contact columns are read by readChatContact() and ONLY at C.
 * PO defaults (ORC 30/10, PO confirms – change the constants below): Q4 no room type; Q5 `<users/all>` on the
 * overdue message only; Q6 one message per kind (no repeated reminder).
 */
import type { Tx } from '../../../db/database';
import { type LocalDate, businessDate, localDate, toZonedIso } from '../../../shared/time';
import { type StaffChatKind, staffChatState } from '../../events/public/staff-chat';
import type { ParameterService } from '../../platform/public/parameter.service';
import { deskHoursOf, looksLikeCard, looksLikeIdNumber } from '../internal/website-request-rules';

export type ChatDetailLevel = 'A' | 'B' | 'C';
export const CHAT_DETAIL_LEVELS: readonly ChatDetailLevel[] = ['A', 'B', 'C'];

/**
 * First notice version that names Google Chat (SEC esc041-gchat-full-details 1). A constant, not a variable, so a
 * configuration can never widen it. SEC fixes another date → change it here before the release tag.
 */
export const CHAT_DETAILS_MIN_NOTICE_VERSION = '2026-10-31';

/** PO Q5 (ORC default 30/10): kinds whose first line starts with `<users/all>` (everyone in the room is notified). */
export const CHAT_MENTION_ALL_KINDS: readonly StaffChatKind[] = ['web_request_overdue'];
const MENTION_ALL = '<users/all>';

/** Kinds that may carry B/C details (★6: only the first message). */
const DETAIL_KINDS: readonly StaffChatKind[] = ['web_request_new'];

export const CHAT_NAME_MAX = 80;
export const CHAT_NOTE_MAX = 500;
export const CHAT_NOTE_MAX_LINES = 8;
const CUT_SUFFIX = '… (xem đủ trên Desk)';
export const CHAT_ID_REPLACEMENT = '(có dãy số giống giấy tờ hoặc thẻ – xem trên Desk)';

/** Base row: NO C2 column (statically checked – test/gchat-units.test.ts). */
export const CHAT_BASE_SQL = `SELECT id, ref_code, status, arrival_date::text AS arrival_date,
       departure_date::text AS departure_date, stay_kind, stay_months, adults, children, infants, created_at,
       reply_by, assigned_user_id, pii_purged_at, suspicious_flags, consent_version, locale
  FROM website_booking_request WHERE id = $1`;

/** Level C only: exactly the 5 columns the notice names (statically checked: no decline/hmac column). */
export const CHAT_CONTACT_SQL = `SELECT guest_name, phone_e164, email, preferred_channel, note
  FROM website_booking_request WHERE id = $1`;

const CHAT_NOTICE_GATE_SQL = `SELECT
    (SELECT min(published_at) FROM privacy_notice_version WHERE organization_id = $1 AND version = $2) AS min_at,
    (SELECT published_at FROM privacy_notice_version
      WHERE organization_id = $1 AND version = $3 AND locale = $4) AS req_at`;

interface BaseRow {
  id: string;
  ref_code: string;
  status: string;
  arrival_date: string;
  departure_date: string | null;
  stay_kind: string;
  stay_months: number | null;
  adults: number;
  children: number;
  infants: number;
  created_at: Date;
  reply_by: Date;
  assigned_user_id: string | null;
  pii_purged_at: Date | null;
  suspicious_flags: string[] | null;
  consent_version: string;
  locale: string;
}

export interface ChatContact {
  guest_name: string | null;
  phone_e164: string | null;
  email: string | null;
  preferred_channel: string | null;
  note: string | null;
}

export interface ChatRenderContext {
  /** Configured level (already parsed: anything unknown is A). */
  level: ChatDetailLevel;
  timezone: string;
  /** Desk origin checked at worker start (CHAT_LINK_BASE_INVALID otherwise), e.g. https://desk.ottimo.vn */
  linkBase: string;
  appEnv: string;
  now: Date;
}

export type ChatSkipCode = 'SKIPPED_GONE' | 'SKIPPED_HANDLED' | 'SKIPPED_NOT_POSTED';

export type ChatRender =
  | {
      send: true;
      text: string;
      threadKey: string;
      level: ChatDetailLevel;
      /** B/C configured but the request's notice is older (or the new notice is not published yet). */
      levelCapped: boolean;
    }
  | { send: false; code: ChatSkipCode };

export type ChatRenderer = (
  tx: Tx,
  kind: StaffChatKind,
  refId: string,
  ctx: ChatRenderContext,
) => Promise<ChatRender>;

/** The three columns read at level C – never logged, dropped after the text is built. */
export async function readChatContact(tx: Tx, id: string): Promise<ChatContact | null> {
  const { rows } = await tx.query<ChatContact>(CHAT_CONTACT_SQL, [id]);
  return rows[0] ?? null;
}

/** BUG fix-proof level parse: `trim().toUpperCase()`; unknown → null (the caller logs and uses A). */
export function parseChatDetailLevel(raw: string | undefined): {
  level: ChatDetailLevel;
  invalid: boolean;
} {
  const v = (raw ?? '').trim().toUpperCase();
  if (v === '') return { level: 'A', invalid: false };
  return (CHAT_DETAIL_LEVELS as readonly string[]).includes(v)
    ? { level: v as ChatDetailLevel, invalid: false }
    : { level: 'A', invalid: true };
}

// ───────────────────────── chatSafeText (★5) ─────────────────────────

/** Control characters (Cc); `\n` is kept by the replacer. */
const CONTROL = /\p{Cc}/gu;
const BIDI = /[‎‏‪-‮⁦-⁩]/g;
/** A dot (ASCII or full-width / ideographic) between a letter-or-digit and a letter: a domain-looking dot. */
const DOMAIN_DOT = /(?<=[\p{L}\p{N}])[.．。｡](?=\p{L})/gu;

const segmenter = new Intl.Segmenter('vi', { granularity: 'grapheme' });
const graphemes = (s: string): string[] => Array.from(segmenter.segment(s), (x) => x.segment);

/**
 * Guest-typed text made inert for a Google Chat message (SEC ★5, ARC 8.5), in this order:
 * 1. a card-like or ID-like digit run → the WHOLE field is replaced (looksLikeCard / looksLikeIdNumber re-run);
 * 2. control and bidi characters dropped; one line for a name, blank lines collapsed and ≤ 8 lines for a message;
 * 3. `<` `>` → `‹` `›` (no `<users/all>`, `<url|text>`), backticks dropped (cannot leave the code block);
 * 4. links and domains disabled: `://` → `[:]//`, domain dots → `[.]` (email addresses keep theirs – `domains: false`);
 * 5. cut by grapheme (never half an emoji) to maxChars, "… (xem đủ trên Desk)" added.
 */
export function chatSafeText(
  text: string,
  opts: { maxChars: number; singleLine: boolean; domains?: boolean },
): string {
  if (looksLikeCard(text) || looksLikeIdNumber(text)) return CHAT_ID_REPLACEMENT;
  let t = text
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(BIDI, '')
    .replace(CONTROL, (c) => (c === '\n' ? '\n' : ''));
  if (opts.singleLine) {
    t = t.replace(/\s*\n\s*/g, ' ');
  } else {
    const lines = t
      .split('\n')
      .map((l) => l.trimEnd())
      .filter((l) => l.trim() !== '');
    t =
      lines.length > CHAT_NOTE_MAX_LINES
        ? [
            ...lines.slice(0, CHAT_NOTE_MAX_LINES - 1),
            lines.slice(CHAT_NOTE_MAX_LINES - 1).join(' '),
          ].join('\n')
        : lines.join('\n');
  }
  t = t.replace(/</g, '‹').replace(/>/g, '›').replace(/`/g, '');
  if (opts.domains !== false) {
    t = t.replace(/:\/\//g, '[:]//').replace(DOMAIN_DOT, '[.]');
  }
  t = t.trim();
  const g = graphemes(t);
  if (g.length > opts.maxChars) t = `${g.slice(0, opts.maxChars).join('').trimEnd()}${CUT_SUFFIX}`;
  return t;
}

// ───────────────────────── text ─────────────────────────

const CHANNEL_LABEL: Readonly<Record<string, string>> = {
  zalo: 'Zalo',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  viber: 'Viber',
  phone: 'Điện thoại',
  email: 'Email',
};

const hhmm = (d: Date, tz: string) => toZonedIso(d, tz).slice(11, 16);
const ddmm = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;
const nights = (a: string, b: string) =>
  Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

function stayLine(r: BaseRow): string {
  const kind = r.stay_kind === 'long' ? 'Theo tháng' : 'Ngắn ngày';
  if (r.stay_kind === 'long' && r.stay_months) {
    return `Đến ${ddmm(r.arrival_date)} · ${r.stay_months} tháng · ${kind}`;
  }
  if (r.departure_date) {
    return `Đến ${ddmm(r.arrival_date)} – đi ${ddmm(r.departure_date)} · ${nights(r.arrival_date, r.departure_date)} đêm · ${kind}`;
  }
  return `Đến ${ddmm(r.arrival_date)} · chưa rõ thời gian ở`;
}

function guestsLine(r: BaseRow): string {
  const parts = [`${r.adults} người lớn`];
  if (r.children > 0) parts.push(`${r.children} trẻ em`);
  if (r.infants > 0) parts.push(`${r.infants} trẻ dưới 2 tuổi`);
  return parts.join(', ');
}

function contactLines(c: ChatContact, flags: readonly string[]): string[] {
  const out: string[] = [];
  const name = c.guest_name
    ? chatSafeText(c.guest_name, { maxChars: CHAT_NAME_MAX, singleLine: true })
    : '';
  out.push(`Khách: ${name || '(không có)'}`);
  // One contact only (ARC-14): the e-mail for the e-mail channel, the phone otherwise – exactly what the guest gave.
  const contact =
    c.preferred_channel === 'email'
      ? c.email
        ? chatSafeText(c.email, { maxChars: 254, singleLine: true, domains: false })
        : ''
      : c.phone_e164
        ? `+${c.phone_e164.replace(/\D/g, '')}`
        : '';
  const label = CHANNEL_LABEL[c.preferred_channel ?? ''] ?? 'Khác';
  out.push(`Liên hệ: ${contact || '(không có)'} · kênh: ${label}`);
  const note = c.note ? chatSafeText(c.note, { maxChars: CHAT_NOTE_MAX, singleLine: false }) : '';
  if (note) {
    const link = flags.includes('contains_url') ? ' (có link – không bấm, xem trên Desk)' : '';
    out.push(`Lời nhắn${link}:`, '```', note, '```');
  }
  return out;
}

interface Timing {
  inHours: boolean;
  urgent: boolean;
}

/** In desk hours at reception; "cần gọi ngay" = arriving on the business date, out of hours (replyPlan call_now). */
async function timingOf(params: ParameterService, tx: Tx, r: BaseRow, tz: string): Promise<Timing> {
  const day: LocalDate = localDate(r.created_at, tz);
  const hours = deskHoursOf(await params.get<unknown>(tx, 'front_desk_hours', day));
  const rollover = await params.get<string>(tx, 'business_day_rollover', day);
  const t = hhmm(r.created_at, tz);
  const inHours = t >= hours.from && t < hours.to;
  const urgent = !inHours && r.arrival_date === businessDate(r.created_at, tz, rollover);
  return { inHours, urgent };
}

/** Effective level: details only on the first message, and only under the Chat notice or later (★2, ★6). */
async function effectiveLevel(
  tx: Tx,
  kind: StaffChatKind,
  r: BaseRow,
  configured: ChatDetailLevel,
): Promise<{ level: ChatDetailLevel; capped: boolean }> {
  if (configured === 'A' || !DETAIL_KINDS.includes(kind)) return { level: 'A', capped: false };
  const { rows } = await tx.query<{ min_at: Date | null; req_at: Date | null }>(
    CHAT_NOTICE_GATE_SQL,
    [tx.ctx.organizationId, CHAT_DETAILS_MIN_NOTICE_VERSION, r.consent_version, r.locale],
  );
  const g = rows[0];
  if (!g?.min_at || !g.req_at || g.req_at.getTime() < g.min_at.getTime()) {
    return { level: 'A', capped: true };
  }
  return { level: configured, capped: false };
}

/** Renderer of the website-request kinds (injected into ChatDispatcher by src/worker-chat.ts). */
export function websiteRequestChatRenderer(deps: { params: ParameterService }): ChatRenderer {
  return async (tx, kind, refId, ctx) => {
    const { rows } = await tx.query<BaseRow>(CHAT_BASE_SQL, [refId]);
    const r = rows[0];
    if (!r) return { send: false, code: 'SKIPPED_GONE' };
    const tz = ctx.timezone;
    const env = ctx.appEnv === 'production' ? '' : `[${ctx.appEnv}] `;
    const deskLine = `Mở Desk: ${ctx.linkBase}/website-requests/${r.id}`;
    if (kind === 'web_request_erased') {
      // WR8: only when the first message really reached the room (ARC 8.6 N1).
      if ((await staffChatState(tx, 'web_request_new', r.id)) !== 'posted') {
        return { send: false, code: 'SKIPPED_NOT_POSTED' };
      }
      return {
        send: true,
        text: [
          `${env}Đã xóa dữ liệu của ${r.ref_code} theo yêu cầu của khách. Quản lý phòng xóa tin đầu của luồng này nếu còn.`,
          deskLine,
        ].join('\n'),
        threadKey: r.id,
        level: 'A',
        levelCapped: false,
      };
    }
    if (r.status === 'spam' || r.pii_purged_at) return { send: false, code: 'SKIPPED_GONE' };
    const reminder = kind === 'web_request_overdue' || kind === 'web_request_morning';
    if (reminder && (r.status !== 'new' || r.assigned_user_id)) {
      return { send: false, code: 'SKIPPED_HANDLED' };
    }
    const timing = await timingOf(deps.params, tx, r, tz);
    const flags = r.suspicious_flags ?? [];
    const mention = CHAT_MENTION_ALL_KINDS.includes(kind) ? `${MENTION_ALL} ` : '';
    const first = reminder
      ? `${mention}${env}Chưa có người nhận · ${r.ref_code}`
      : `${mention}${env}Yêu cầu đặt phòng mới${timing.urgent ? ' – cần gọi ngay' : ''} · ${r.ref_code}`;
    const deadline = kind === 'web_request_overdue' ? 'đã quá hạn phản hồi' : 'hạn phản hồi';
    const second =
      `Nhận lúc ${hhmm(r.created_at, tz)}${timing.inHours ? '' : ' (ngoài giờ trực)'} · ` +
      `${deadline} ${hhmm(r.reply_by, tz)}${flags.length > 0 ? ' · cần xem kỹ' : ''}`;
    const { level, capped } = await effectiveLevel(tx, kind, r, ctx.level);
    const lines = [first, second];
    if (level === 'B' || level === 'C') lines.push(stayLine(r), guestsLine(r));
    if (level === 'C') {
      const c = await readChatContact(tx, r.id);
      if (c) lines.push(...contactLines(c, flags));
    }
    lines.push(deskLine); // always last (★5 point 5)
    return { send: true, text: lines.join('\n'), threadKey: r.id, level, levelCapped: capped };
  };
}
