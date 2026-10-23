// Staff e-mail templates (topic `staff.email`, SEC 06.15 / 06.33 / Q51-6). Owner: INT.
// OTTIMO brand guideline (00-brief/context/brand/brand-guidelines.md): English leads, Vietnamese supports, short,
// calm, no emoji, no shouting capitals; colours only from the 80/15/5 palette; Lora / Be Vietnam Pro with the
// guideline fallbacks Georgia / Arial (most mail clients do not load web fonts).
// Security rules: no codes, no secrets, no links (a security notice that asks you to click is what phishing looks
// like), no username, no account number. Every parameter is HTML-escaped; unknown templates are refused.
import { IntegrationError } from '../contracts/common.js';

export const STAFF_EMAIL_TEMPLATES = [
  'mfa_recovery_code_used',
  'mfa_reset',
  'mfa_reset_by_operator',
  'receiving_account_changed',
] as const;
export type StaffEmailTemplate = (typeof STAFF_EMAIL_TEMPLATES)[number];

export function isStaffEmailTemplate(v: string): v is StaffEmailTemplate {
  return (STAFF_EMAIL_TEMPLATES as readonly string[]).includes(v);
}

/**
 * Parameters (all optional strings, already formatted by the caller):
 * - `audience`: 'self' (the person concerned) | 'owner' (copy to an owner)
 * - `staffName`: display name of the person concerned (owner copy only)
 * - `occurredAt`: local time, e.g. '23/10/2026 14:05 (GMT+7)'
 * - `effectiveDate`: receiving_account_changed only, e.g. '25/10/2026'
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
  const at = p.occurredAt ? ` (${p.occurredAt})` : '';
  const notYouEn =
    'If this was not you, contact the owner or the OTTIMO team today and change your password.';
  const notYouVi =
    'Nếu không phải bạn, hãy báo chủ cơ sở hoặc đội OTTIMO ngay trong hôm nay và đổi mật khẩu.';
  const ownerEn = 'If this was not expected, check with them today.';
  const ownerVi = 'Nếu việc này không được báo trước, hãy kiểm tra với người đó trong hôm nay.';
  switch (t) {
    case 'mfa_recovery_code_used':
      return {
        subjectEn: 'Security notice: a recovery code was used',
        subjectVi: 'Thông báo bảo mật: đã dùng mã khôi phục',
        en: owner
          ? [`${who} signed in to OTTIMO Desk with a recovery code${at}.`, ownerEn]
          : [`Your account signed in to OTTIMO Desk with a recovery code${at}.`, notYouEn],
        vi: owner
          ? [`${whoVi} vừa đăng nhập OTTIMO Desk bằng mã khôi phục${at}.`, ownerVi]
          : [`Tài khoản của bạn vừa đăng nhập OTTIMO Desk bằng mã khôi phục${at}.`, notYouVi],
      };
    case 'mfa_reset':
    case 'mfa_reset_by_operator': {
      const byTeam = t === 'mfa_reset_by_operator';
      const howEn = byTeam ? ' by the OTTIMO technical team' : '';
      const howVi = byTeam ? ' bởi đội kỹ thuật OTTIMO' : '';
      return {
        subjectEn: 'Security notice: two-step sign-in was reset',
        subjectVi: 'Thông báo bảo mật: đăng nhập 2 bước đã được đặt lại',
        en: owner
          ? [`Two-step sign-in of ${who} was reset${howEn}${at}.`, ownerEn]
          : [
              `Two-step sign-in of your account was reset${howEn}${at}. You will set it up again at your next sign-in.`,
              notYouEn,
            ],
        vi: owner
          ? [`Đăng nhập 2 bước của ${whoVi} đã được đặt lại${howVi}${at}.`, ownerVi]
          : [
              `Đăng nhập 2 bước của tài khoản bạn đã được đặt lại${howVi}${at}. Lần đăng nhập tới bạn sẽ cài lại.`,
              notYouVi,
            ],
      };
    }
    case 'receiving_account_changed': {
      const eff = p.effectiveDate ? ` from ${p.effectiveDate}` : '';
      const effVi = p.effectiveDate ? ` từ ngày ${p.effectiveDate}` : '';
      return {
        subjectEn: 'Notice: the deposit receiving account was changed',
        subjectVi: 'Thông báo: tài khoản nhận cọc đã thay đổi',
        en: [
          `The bank account that receives deposits was changed${eff}${at}.`,
          'Open OTTIMO Desk as usual to review it. If you did not expect this change, review it today.',
        ],
        vi: [
          `Tài khoản ngân hàng nhận cọc đã được thay đổi${effVi}${at}.`,
          'Mở OTTIMO Desk như thường lệ để xem lại. Nếu bạn không chờ thay đổi này, hãy kiểm tra trong hôm nay.',
        ],
      };
    }
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

/** Parameters end up in a header (subject) and in HTML: refuse control characters (header injection). */
function cleanParams(params: Readonly<Record<string, string>>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v !== 'string') continue;
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
const NO_LINK_EN = 'OTTIMO never asks for your password or codes by e-mail.';
const NO_LINK_VI = 'OTTIMO không bao giờ hỏi mật khẩu hay mã qua email.';

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
