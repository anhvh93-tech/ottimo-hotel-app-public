/**
 * Google Chat text of a website booking request (ARC gchat-booking-request-notify 2, 8.1–8.5; SEC ESC-041 ★2, ★3,
 * ★5, ★6; SEC-on-us155-enable 4.1). Built by the WORKER at send time (ChatDispatcher) – nothing here is stored or
 * logged. Lives in public-site because only this module reads its tables (module boundaries); the worker gets it
 * through src/worker-chat.ts (never through public-site.module.ts – locked by test/gchat-units.test.ts "chat-message.ts
 * is wired by src/worker-chat.ts" and by the worker-only process test test/integration/gchat-worker-only.test.ts).
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
 * configuration can never widen it. SEC fixes another date → change it here before the release tag (PR + SEC review).
 * The gate only works "from this version on": a LATER notice that drops Google Chat from the recipients needs the
 * level lowered to A or B BEFORE it is published (SEC FB-R3-SEC-BE-GCHAT-03).
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

/** Re-check right before the POST (level C): null = still sendable, else the skip code (SEC FB-R3-SEC-BE-GCHAT-04). */
export type ChatRecheck = (tx: Tx) => Promise<ChatSkipCode | null>;

export type ChatRender =
  | {
      send: true;
      text: string;
      threadKey: string;
      level: ChatDetailLevel;
      /** B/C configured but the request's notice is older (or the new notice is not published yet). */
      levelCapped: boolean;
      /** Set when the text carries guest data (C): WR8 erase / spam in the claim→POST gap must stop the post. */
      recheck?: ChatRecheck;
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
/** Line and paragraph separators and NEL: treated as a line break (ARC GC-02 – a name cannot fake a second line). */
const LINE_BREAKS = /[\u2028\u2029\u0085]/g;
/**
 * Every format character (Cf: zero-width space/joiner, bidi marks and embeddings, U+061C, soft hyphen…) is dropped
 * (ARC GC-02, SEC 02) – the bidi marks below are only the documented subset. Kept: U+200D between two pictographs
 * (emoji ZWJ sequences such as a family), so a cut never splits them and they stay readable.
 */
const FORMAT = /\p{Cf}/gu;
export const BIDI_MARKS = /[\u200e\u200f\u202a-\u202e\u2066-\u2069\u061c]/;
const PICTO_BEFORE = /\p{Extended_Pictographic}\ufe0f?$/u;
const PICTO_AFTER = /^\p{Extended_Pictographic}/u;
/**
 * A dot (ASCII or full-width / ideographic) between a letter, digit or combining mark and a letter: a domain-looking
 * dot (`x̃.com` has a mark before the dot). Format characters are gone before this runs, so `evil<ZWSP>.example` is
 * caught too.
 */
const DOMAIN_DOT = /(?<=[\p{L}\p{N}\p{M}])[.．。｡](?=\p{L})/gu;
/** IPv4-looking runs (`1.2.3.4/login`): their dots are disabled too (SEC 02 – a bare IP can become a link). */
const IPV4 = /(?<![\d.])\d{1,3}(?:[.．。｡]\d{1,3}){3}(?![\d])/g;
/** Chat formatting marks, removed from a NAME (outside the code block): `*bold*`, `_italic_`, `~strike~` (SEC 02). */
const NAME_FORMATTING = /[*_~]/g;

/** Any decimal digit that is not ASCII (Arabic-Indic, Devanagari, Thai…; full-width ones are already ASCII after NFKC). */
const NON_ASCII_DIGIT = /(?![0-9])\p{Nd}/gu;
const IS_DIGIT = /^\p{Nd}$/u;

/** Its ASCII value: Unicode puts every Nd digit in a contiguous 0–9 run, so the run start gives the zero. */
function asciiDigits(s: string): string {
  return s.replace(NON_ASCII_DIGIT, (d) => {
    const cp = d.codePointAt(0) ?? 0;
    let zero = cp;
    while (zero > 0 && IS_DIGIT.test(String.fromCodePoint(zero - 1))) zero -= 1;
    return String((cp - zero) % 10);
  });
}

/** Dates and times blanked before the extra separators below (same shapes as website-request-rules). */
const DATE_OR_TIME =
  /(?<!\d)\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?(?!\d)|(?<!\d)\d{1,2}[:h]\d{2}(?!\d)/g;
/**
 * Separators a guest (or a cleaning step) can put between digit groups that the form rules do not read as one
 * (they take one space, dot or dash): `079_203_012_345`, `079/203/012/345`, `4111,1111,1111,1111`. One character
 * only – `0905 111 222, 0905 333 444` (comma + space) stays two phone numbers.
 */
const EXTRA_DIGIT_SEP = /(?<=\d)[_/,](?=\d)/g;

/**
 * BUG-R3-057: the V-09 / SR-LOG-04 rules (looksLikeCard, looksLikeIdNumber) on a NORMALISED copy – NFKC (full-width
 * digits `０７９…`, NBSP and other compatibility spaces), every Nd digit as ASCII, and `_` `/` `,` between digits read
 * as a group separator. The copy is only checked, never printed. Phone numbers (10–11 digits, or after `+`) and
 * amounts with a currency still pass – the rules themselves are unchanged (the form keeps its own, BUG-R3-058).
 */
export function looksLikeSensitiveNumber(text: string): boolean {
  if (looksLikeCard(text) || looksLikeIdNumber(text)) return true;
  const k = asciiDigits(text.normalize('NFKC'));
  if (looksLikeCard(k) || looksLikeIdNumber(k)) return true;
  const w = k.replace(DATE_OR_TIME, ' / ').replace(EXTRA_DIGIT_SEP, ' ');
  return looksLikeCard(w) || looksLikeIdNumber(w);
}

const segmenter = new Intl.Segmenter('vi', { granularity: 'grapheme' });
const graphemes = (s: string): string[] => Array.from(segmenter.segment(s), (x) => x.segment);

/**
 * Guest-typed text made inert for a Google Chat message (SEC ★5, ARC 8.5), in this order:
 * 1. a card-like or ID-like digit run → the WHOLE field is replaced (looksLikeSensitiveNumber, on the raw text);
 * 2. control and format (Cf) characters dropped (U+2028/2029/0085 = line break); one line for a name (Chat formatting
 *    marks `*` `_` `~` removed – `plain`), blank lines collapsed and ≤ 8 lines for a message;
 * 3. `<` `>` → `‹` `›` (no `<users/all>`, `<url|text>`), backticks dropped (cannot leave the code block);
 * 4. the number check of step 1 runs AGAIN on the cleaned text (BUG-R3-057): steps 2–3 drop characters (ZWSP, WJ,
 *    soft hyphen, tab, backtick…) and turn `_` into a space, so they can JOIN a split CCCD or card number. Run before
 *    step 5, whose `[.]` would hide `079.203.012.345` (an IPv4 shape) from the digit rules;
 * 5. links disabled: `://` → `[:]//` ALWAYS; domain dots and IPv4 dots → `[.]` (an e-mail address keeps its domain dots –
 *    `domains: false`, SEC Q3);
 * 6. cut by grapheme (never half an emoji) to maxChars, "… (xem đủ trên Desk)" added; the printed text is checked a
 *    last time (with `[.]` read as a dot) – the check is on what Chat would show.
 */
export function chatSafeText(
  text: string,
  opts: { maxChars: number; singleLine: boolean; domains?: boolean; plain?: boolean },
): string {
  if (looksLikeSensitiveNumber(text)) return CHAT_ID_REPLACEMENT;
  let t = text
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(LINE_BREAKS, '\n')
    .replace(CONTROL, (c) => (c === '\n' ? '\n' : ''));
  t = t.replace(FORMAT, (c, at: number, all: string) =>
    c === '\u200d' && PICTO_BEFORE.test(all.slice(0, at)) && PICTO_AFTER.test(all.slice(at + 1))
      ? c
      : '',
  );
  if (opts.plain) t = t.replace(NAME_FORMATTING, ' ').replace(/ {2,}/g, ' ');
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
  if (looksLikeSensitiveNumber(t)) return CHAT_ID_REPLACEMENT; // BUG-R3-057: after every step that drops characters
  t = t.replace(/:\/\//g, '[:]//');
  if (opts.domains !== false) {
    t = t.replace(IPV4, (ip) => ip.replace(/[.．。｡]/g, '[.]')).replace(DOMAIN_DOT, '[.]');
  }
  t = t.trim();
  const g = graphemes(t);
  if (g.length > opts.maxChars) t = `${g.slice(0, opts.maxChars).join('').trimEnd()}${CUT_SUFFIX}`;
  return looksLikeSensitiveNumber(t.replace(/\[([.:])\]/g, '$1')) ? CHAT_ID_REPLACEMENT : t;
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

/**
 * E-mail printed only in a strict, link-free shape (SEC FB-R3-SEC-BE-GCHAT-01): local part `[a-z0-9._%+-]{1,64}`,
 * domain = the labels normalizeEmail accepts (`[a-z0-9-]{1,63}`, ≥ 2 labels, letters-only TLD). The form lets through
 * `:` `/` `|` `*`… before the `@` (`https://evil.example/login@ottimo.vn` is "valid"), so anything else is replaced.
 */
export const CHAT_EMAIL = /^[a-z0-9._%+-]{1,64}@(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/;
export const CHAT_EMAIL_REPLACEMENT = '(email có ký tự đặc biệt – xem trên Desk)';

export function chatSafeEmail(email: string): string {
  const e = email.trim().toLowerCase();
  if (e.length > 254 || !CHAT_EMAIL.test(e)) return CHAT_EMAIL_REPLACEMENT;
  // Defence in depth: the strict shape has no `://`, `<`, `>` – still run the same steps (domain dots kept, SEC Q3).
  return chatSafeText(e, { maxChars: 254, singleLine: true, domains: false });
}

function contactLines(c: ChatContact, flags: readonly string[]): string[] {
  const out: string[] = [];
  const name = c.guest_name
    ? chatSafeText(c.guest_name, { maxChars: CHAT_NAME_MAX, singleLine: true, plain: true })
    : '';
  out.push(`Khách: ${name || '(không có)'}`);
  // One contact only (ARC-14): the e-mail for the e-mail channel, the phone otherwise – exactly what the guest gave.
  const contact =
    c.preferred_channel === 'email'
      ? c.email
        ? chatSafeEmail(c.email)
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

/**
 * SEC FB-R3-SEC-BE-GCHAT-04: a level-C text is built in the claim transaction and posted up to ~65 s later. A WR8 erase
 * (or a spam mark) in between must stop the post – one cheap read right before it (no C2 column).
 */
export const CHAT_RECHECK_SQL = `SELECT status, pii_purged_at FROM website_booking_request WHERE id = $1`;

async function stillSendable(tx: Tx, id: string): Promise<ChatSkipCode | null> {
  const { rows } = await tx.query<{ status: string; pii_purged_at: Date | null }>(
    CHAT_RECHECK_SQL,
    [id],
  );
  const r = rows[0];
  return !r || r.status === 'spam' || r.pii_purged_at ? 'SKIPPED_GONE' : null;
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
    return {
      send: true,
      text: lines.join('\n'),
      threadKey: r.id,
      level,
      levelCapped: capped,
      ...(level === 'C' ? { recheck: (t2: Tx) => stillSendable(t2, r.id) } : {}),
    };
  };
}
