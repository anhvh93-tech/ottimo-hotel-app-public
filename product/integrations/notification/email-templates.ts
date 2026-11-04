// Staff e-mail templates (topic `staff.email`, SEC 06.15 / 06.33 / Q51-6). Owner: INT.
// OTTIMO brand guideline (00-brief/context/brand/brand-guidelines.md): English leads, Vietnamese supports, short,
// calm, no emoji, no shouting capitals; colours only from the 80/15/5 palette; Lora / Be Vietnam Pro with the
// guideline fallbacks Georgia / Arial (most mail clients do not load web fonts).
// Security rules: no codes, no secrets, no links (a security notice that asks you to click is what phishing looks
// like), no username, no account number. Every parameter is HTML-escaped; unknown templates are refused.
// One layout for all five (v1.0.4, CPY FB-R4-CPY-INT-03/05): main sentence(s) → own "Time:" / "Thời điểm:" line
// (only with occurredAt) → action; the shared footer says once that these notices never carry links.
// Terms follow Desk (content-guide section 3, CPY FB-R4-CPY-INT-104-03 / INT-CPY-31-06): owner = "the owner" /
// "chủ đầu tư", 2FA = "2-step verification" / "xác thực 2 bước", "receiving account" / "tài khoản nhận chuyển khoản".
import { IntegrationError } from '../contracts/common.js';

/**
 * THE list of staff e-mail templates (ARC FB-R4-ARC-BE-31-05 / FB-R4-ARC-OPS-PR32-06). Used by the api (enqueue,
 * `EMAIL_CHANGED_TEMPLATE satisfies StaffEmailTemplate`), the worker (`isStaffEmailTemplate` → BAD_TEMPLATE) and
 * `infra/server/bin/requeue-email-changed.sh`, which asks a running worker image
 * `import("@ottimo/integrations/notification").isStaffEmailTemplate("email_changed")`. Do not move or rename these two
 * exports: email-templates.test.ts locks the export path.
 */
export const STAFF_EMAIL_TEMPLATES = [
  'mfa_recovery_code_used',
  'mfa_reset',
  'mfa_reset_by_operator',
  'receiving_account_changed',
  'email_changed',
] as const;
export type StaffEmailTemplate = (typeof STAFF_EMAIL_TEMPLATES)[number];

export function isStaffEmailTemplate(v: string): v is StaffEmailTemplate {
  return (STAFF_EMAIL_TEMPLATES as readonly string[]).includes(v);
}

/**
 * Parameters (all optional strings, already formatted by the caller):
 * - `audience`: 'self' (the person concerned) | 'owner' (copy to an owner) |
 *   'previous' (email_changed only: the address that was replaced or removed)
 * - `staffName`: display name of the person concerned – read ONLY when audience = 'owner'; dropped for every other
 *   copy before rendering (G-BE-4, FB-R4-INT-BE-31-05: least data; the dispatcher stops sending it in v1.0.4 too)
 * - `occurredAt`: local time, e.g. '23/10/2026 14:05 (GMT+7)' – printed on its own "Time:" line, never in brackets
 * - `effectiveDate`: receiving_account_changed only, e.g. '25/10/2026' (the date the schedule takes effect)
 * - `change`: receiving_account_changed only, 'set' (a new account was scheduled) | 'cancel' (a scheduled change was
 *   cancelled). Missing or unknown = neutral sentence that is true for both (CPY FB-R4-CPY-INT-104-01): the
 *   template can ship before the outbox payload carries the action.
 * - `via`: email_changed only, 'self' | 'owner' (who made the change; missing or unknown = 'self')
 * Any other parameter is ignored. email_changed never prints an address (new or old, full or masked) in any
 * copy: the recipient already knows their own address, and the old address must not learn the new one
 * (ARC v1.0.3-contract-email 4.3, least data).
 */
export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

/** Brand palette (guideline section 5) – the only colours used. */
export const BRAND = {
  ivory: '#F4F0E8',
  cream: '#EDE6D8',
  stone: '#6B6760',
  ink: '#2B2B28',
  oak: '#B08D57',
  earth: '#7A5C44',
  sage: '#8A9079',
  white: '#FFFFFF',
} as const;

const SERIF = "Lora, Georgia, 'Times New Roman', serif";
const SANS = "'Be Vietnam Pro', Arial, Helvetica, sans-serif";

interface Copy {
  subjectEn: string;
  subjectVi: string;
  en: string[];
  vi: string[];
}

function copyFor(t: StaffEmailTemplate, p: Readonly<Record<string, string>>): Copy {
  const owner = p.audience === 'owner';
  const who = p.staffName?.trim() || 'A staff member';
  const whoVi = p.staffName?.trim() || 'Một nhân viên';
  const notYouEn =
    'If this was not you, contact the owner or the OTTIMO team today and change your password.';
  const notYouVi =
    'Nếu không phải bạn, hãy báo chủ đầu tư hoặc đội OTTIMO ngay trong hôm nay và đổi mật khẩu.';
  const ownerEn = 'If this was not expected, check with them today.';
  const ownerVi = 'Nếu việc này không được báo trước, hãy kiểm tra với người đó trong hôm nay.';
  // Own line, same in all five templates (CPY FB-R4-CPY-INT-03): occurredAt already ends with "(GMT+7)", so it is
  // never put in brackets; no line at all without occurredAt.
  const timeEn = p.occurredAt ? [`Time: ${p.occurredAt}`] : [];
  const timeVi = p.occurredAt ? [`Thời điểm: ${p.occurredAt}`] : [];
  switch (t) {
    case 'mfa_recovery_code_used':
      return {
        subjectEn: 'Security notice: a recovery code was used',
        subjectVi: 'Thông báo bảo mật: đã dùng mã khôi phục',
        en: owner
          ? [`${who} signed in to OTTIMO Desk with a recovery code.`, ...timeEn, ownerEn]
          : ['Your OTTIMO Desk account was signed in with a recovery code.', ...timeEn, notYouEn],
        vi: owner
          ? [`${whoVi} vừa đăng nhập OTTIMO Desk bằng mã khôi phục.`, ...timeVi, ownerVi]
          : [
              'Tài khoản OTTIMO Desk của bạn vừa được đăng nhập bằng mã khôi phục.',
              ...timeVi,
              notYouVi,
            ],
      };
    case 'mfa_reset':
    case 'mfa_reset_by_operator': {
      const byTeam = t === 'mfa_reset_by_operator';
      const howEn = byTeam ? ' by the OTTIMO technical team' : '';
      const howVi = byTeam ? ' bởi đội kỹ thuật OTTIMO' : '';
      // Mid-sentence in Vietnamese: the fallback stays lower case.
      const whoViMid = p.staffName?.trim() || 'một nhân viên';
      return {
        subjectEn: 'Security notice: 2-step verification was reset',
        subjectVi: 'Thông báo bảo mật: xác thực 2 bước đã được đặt lại',
        en: owner
          ? [`${who}'s 2-step verification was reset${howEn}.`, ...timeEn, ownerEn]
          : [
              `Your 2-step verification was reset${howEn}.`,
              ...timeEn,
              'You will set it up again at your next sign-in.',
              notYouEn,
            ],
        vi: owner
          ? [`Xác thực 2 bước của ${whoViMid} đã được đặt lại${howVi}.`, ...timeVi, ownerVi]
          : [
              `Xác thực 2 bước của tài khoản bạn đã được đặt lại${howVi}.`,
              ...timeVi,
              'Lần đăng nhập tới bạn sẽ cài lại.',
              notYouVi,
            ],
      };
    }
    case 'receiving_account_changed': {
      // CPY FB-R4-CPY-INT-104-01/02: the same outbox template is sent when an owner schedules a new receiving
      // account AND when they cancel a scheduled change, so the subject is neutral and the main sentence follows
      // `change`. Without `change` (payload before BE adds it) or without a date: a sentence true for every case.
      const date = p.effectiveDate?.trim() ?? '';
      const change = p.change === 'set' || p.change === 'cancel' ? p.change : null;
      const [mainEn, mainVi] = !date
        ? [
            'The receiving bank account settings were updated.',
            'Thiết lập tài khoản ngân hàng nhận chuyển khoản vừa được cập nhật.',
          ]
        : change === 'set'
          ? [
              `A new receiving bank account was set, effective from ${date}.`,
              `Tài khoản ngân hàng nhận chuyển khoản mới đã được đặt, có hiệu lực từ ngày ${date}.`,
            ]
          : change === 'cancel'
            ? [
                `The receiving bank account change scheduled for ${date} was cancelled.`,
                `Lịch đổi tài khoản ngân hàng nhận chuyển khoản từ ngày ${date} đã được hủy.`,
              ]
            : [
                `The receiving bank account schedule for ${date} was updated.`,
                `Lịch tài khoản ngân hàng nhận chuyển khoản ngày ${date} vừa được cập nhật.`,
              ];
      return {
        subjectEn: 'Security notice: receiving account update',
        subjectVi: 'Thông báo bảo mật: cập nhật tài khoản nhận chuyển khoản',
        en: [
          mainEn,
          ...timeEn,
          'Open OTTIMO Desk as usual and check the receiving account. If you did not expect this, do it today.',
        ],
        vi: [
          mainVi,
          ...timeVi,
          'Hãy mở OTTIMO Desk như thường lệ và kiểm tra tài khoản nhận. Nếu bạn không được báo trước, hãy làm ngay trong hôm nay.',
        ],
      };
    }
    case 'email_changed':
      return emailChangedCopy(p, timeEn, timeVi, notYouEn, notYouVi, ownerEn, ownerVi);
  }
}

/**
 * email_changed (BUG-R3-032; CPY review FB-R4-CPY-INT-01..06). Order of each copy: main sentence →
 * "made by the owner" (via=owner) → time line (only when occurredAt is set) → action. The anti-phishing line is the
 * shared footer (v1.0.4, option A of FB-R4-CPY-INT-05), no longer repeated at the end of the body.
 * `via` ('self' | 'owner', from user_email_change.via) – missing or unknown reads as 'self'.
 */
function emailChangedCopy(
  p: Readonly<Record<string, string>>,
  timeEn: string[],
  timeVi: string[],
  notYouEn: string,
  notYouVi: string,
  ownerEn: string,
  ownerVi: string,
): Copy {
  const subjectEn = 'Security notice: notification email changed';
  const subjectVi = 'Thông báo bảo mật: email nhận thông báo đã thay đổi';
  const byOwner = p.via === 'owner';
  const who = p.staffName?.trim() || 'a staff member';
  const whoVi = p.staffName?.trim() || 'một nhân viên';
  const madeByOwnerEn = byOwner ? ['The change was made by the owner.'] : [];
  const madeByOwnerVi = byOwner ? ['Thay đổi do chủ đầu tư thực hiện.'] : [];
  const build = (en: string[], vi: string[]): Copy => ({ subjectEn, subjectVi, en, vi });
  switch (p.audience) {
    case 'self':
      return build(
        [
          'This address will now receive security notices for your OTTIMO Desk account.',
          ...madeByOwnerEn,
          ...timeEn,
          byOwner ? 'If you did not expect this, please contact the owner directly.' : notYouEn,
        ],
        [
          'Từ nay, địa chỉ này sẽ nhận thông báo bảo mật cho tài khoản OTTIMO Desk của bạn.',
          ...madeByOwnerVi,
          ...timeVi,
          byOwner
            ? 'Nếu bạn chưa được báo trước, vui lòng liên hệ trực tiếp chủ đầu tư.'
            : notYouVi,
        ],
      );
    case 'previous':
      return build(
        [
          'This address no longer receives security notices for your OTTIMO Desk account.',
          ...madeByOwnerEn,
          ...timeEn,
          byOwner
            ? 'If you did not expect this, do not reply to this email. Please contact the owner directly.'
            : 'If this was not you, do not reply to this email. Contact the owner or the OTTIMO team right away and change your password.',
        ],
        [
          'Địa chỉ này không còn nhận thông báo bảo mật cho tài khoản OTTIMO Desk của bạn.',
          ...madeByOwnerVi,
          ...timeVi,
          byOwner
            ? 'Nếu bạn chưa được báo trước, vui lòng không trả lời thư này mà liên hệ trực tiếp chủ đầu tư.'
            : 'Nếu không phải bạn, vui lòng không trả lời thư này. Hãy báo ngay chủ đầu tư hoặc đội OTTIMO và đổi mật khẩu.',
        ],
      );
    case 'owner':
      return build(
        [
          byOwner
            ? `An owner changed or removed the notification email of ${who}.`
            : `The notification email of ${who} was changed or removed.`,
          ...timeEn,
          ownerEn,
        ],
        [
          byOwner
            ? `Một chủ đầu tư vừa đổi hoặc gỡ email nhận thông báo bảo mật của ${whoVi}.`
            : `Email nhận thông báo bảo mật của ${whoVi} vừa được đổi hoặc gỡ.`,
          ...timeVi,
          ownerVi,
        ],
      );
    default:
      // The dispatcher always sets an audience; if not, say only what is true for every recipient.
      return build(
        ['The notification email of an OTTIMO Desk account was changed.', ...timeEn, notYouEn],
        [
          'Email nhận thông báo bảo mật của một tài khoản OTTIMO Desk vừa thay đổi.',
          ...timeVi,
          notYouVi,
        ],
      );
  }
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Parameters end up in a header (subject) and in HTML: refuse control characters (header injection).
 * `staffName` survives only for the owner copy (G-BE-4): the person concerned knows their own name, and the
 * `previous` address may no longer belong to them.
 */
function cleanParams(params: Readonly<Record<string, string>>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v !== 'string') continue;
    if (k === 'staffName' && params.audience !== 'owner') continue;
    out[k] = Array.from(v, (ch) => {
      const c = ch.charCodeAt(0);
      return c < 0x20 || c === 0x7f ? ' ' : ch;
    })
      .join('')
      .slice(0, 200);
  }
  return out;
}

const FOOTER_EN = 'This is an automatic message from OTTIMO Desk. Please do not reply.';
const FOOTER_VI = 'Đây là thư tự động từ OTTIMO Desk. Vui lòng không trả lời thư này.';
// Shared anti-phishing footer of all five templates (v1.0.4, CPY FB-R4-CPY-INT-05 option A, chosen text of CPY
// round 2). "security notices" for all five: each one warns about the safety of an account or of the money route.
// "any code" (CPY FB-R4-CPY-INT-104-03): covers both the 2-step verification code and the recovery codes.
export const NO_LINK_EN =
  'OTTIMO security notices never contain links and never ask for your password or any code.';
export const NO_LINK_VI =
  'Thư bảo mật của OTTIMO không bao giờ có đường liên kết và không bao giờ hỏi mật khẩu hay bất kỳ mã nào.';

export function renderStaffEmail(
  templateId: string,
  params: Readonly<Record<string, string>>,
): RenderedEmail {
  if (!isStaffEmailTemplate(templateId)) {
    throw new IntegrationError('INVALID_REQUEST', 'Unknown e-mail template');
  }
  const p = cleanParams(params);
  const c = copyFor(templateId, p);
  const subject = `OTTIMO – ${c.subjectEn} / ${c.subjectVi}`;

  const text = [
    'OTTIMO',
    '',
    c.subjectEn,
    ...c.en,
    '',
    '—',
    '',
    c.subjectVi,
    ...c.vi,
    '',
    NO_LINK_EN,
    NO_LINK_VI,
    FOOTER_EN,
    FOOTER_VI,
    '',
  ].join('\n');

  const para = (s: string, color: string = BRAND.ink, size = 15) =>
    `<p style="margin:0 0 12px 0;font-family:${SANS};font-size:${size}px;line-height:1.5;color:${color};">${escapeHtml(s)}</p>`;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(c.subjectEn)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.ivory};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.ivory};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:${BRAND.white};border:1px solid ${BRAND.cream};">
<tr><td style="padding:28px 32px 16px 32px;border-bottom:1px solid ${BRAND.oak};">
<div style="font-family:${SERIF};font-size:24px;letter-spacing:4px;color:${BRAND.ink};">OTTIMO</div>
<div style="font-family:${SANS};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${BRAND.stone};margin-top:4px;">Boutique Stay · Da Lat</div>
</td></tr>
<tr><td style="padding:24px 32px 8px 32px;">
<h1 style="margin:0 0 16px 0;font-family:${SERIF};font-weight:normal;font-size:22px;line-height:1.25;color:${BRAND.ink};">${escapeHtml(c.subjectEn)}</h1>
${c.en.map((s) => para(s)).join('\n')}
</td></tr>
<tr><td style="padding:8px 32px 16px 32px;" lang="vi">
<div style="background:${BRAND.cream};padding:16px 20px;">
<h2 style="margin:0 0 10px 0;font-family:${SERIF};font-weight:normal;font-size:17px;line-height:1.3;color:${BRAND.earth};">${escapeHtml(c.subjectVi)}</h2>
${c.vi.map((s) => para(s, BRAND.ink, 14)).join('\n')}
</div>
</td></tr>
<tr><td style="padding:8px 32px 28px 32px;border-top:1px solid ${BRAND.cream};">
${para(`${NO_LINK_EN} ${NO_LINK_VI}`, BRAND.stone, 12)}
${para(`${FOOTER_EN} ${FOOTER_VI}`, BRAND.stone, 12)}
</td></tr>
</table>
<div style="font-family:${SERIF};font-style:italic;font-size:12px;color:${BRAND.stone};padding-top:16px;">A refined stay inspired by the calm spirit of Dalat.</div>
</td></tr>
</table>
</body>
</html>
`;
  return { subject, text, html };
}
