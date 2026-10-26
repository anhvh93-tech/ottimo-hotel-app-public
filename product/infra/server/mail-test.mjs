// One test e-mail through the worker's real SMTP path (OPS 8b, v1-production.md 19.6) – Google Workspace relay by the
// VPS IP, same nodemailer options (TLS ≥ 1.2, STARTTLS required), same EMAIL_FROM, same `egress` network as the worker.
// Not in the image and not on the server: piped from the OPS machine into a one-off worker container (stdin):
//   ssh … 'cd /tmp && sudo -u ottimo /opt/ottimo-prod/infra/server/bin/dc run --rm --no-deps -T \
//     -e MAIL_TEST_TO=<address> [-e MAIL_TEST_VERIFY_ONLY=1] --entrypoint node worker --input-type=module -' \
//     < product/infra/server/mail-test.mjs
// MAIL_TEST_VERIFY_ONLY=1: connect + EHLO + STARTTLS only (transport.verify), nothing is sent.
// Prints ONE line: "mail-test: verified" | "mail-test: sent" | "mail-test: failed (<code>)" – never an address,
// never provider text (mapSmtpError). Exit 0 on success, 1 on failure, 2 on bad input.
import { createRequire } from 'node:module';
import { EnvCredentialProvider } from '@ottimo/integrations/common';
import {
  createSmtpTransport,
  isEmailAddress,
  mapSmtpError,
  smtpConfigFromCredentials,
} from '@ottimo/integrations/notification';

const require = createRequire(`${process.cwd()}/`);
const { resolveFileSecrets } = require('./dist/config.js');

const out = (s, code) => {
  console.log(`mail-test: ${s}`);
  process.exit(code);
};

const env = resolveFileSecrets(process.env);
if ((env.EMAIL_PROVIDER ?? '').trim() !== 'smtp') out('failed (EMAIL_PROVIDER is not smtp)', 2);
const verifyOnly = (env.MAIL_TEST_VERIFY_ONLY ?? '') === '1';
const to = (env.MAIL_TEST_TO ?? '').trim();
if (!verifyOnly && !isEmailAddress(to)) out('failed (MAIL_TEST_TO is missing or invalid)', 2);

// Same credential lookup as services/api/src/jobs/email-adapter.ts (relay with defaults needs no EMAIL_SMTP_* var).
const hasSmtpVars = Object.entries(env).some(
  ([k, v]) => k.startsWith('EMAIL_SMTP_') && (v ?? '').trim() !== '',
);
const creds = hasSmtpVars ? await new EnvCredentialProvider(env).get('env:EMAIL_SMTP') : {};
const cfg = smtpConfigFromCredentials(creds, env.EMAIL_FROM ? { from: env.EMAIL_FROM } : {});
const transport = createSmtpTransport(cfg);

const subjectEn = 'Test message: e-mail delivery check';
const subjectVi = 'Thư thử: kiểm tra gửi email';
const lines = [
  'This is a test message from the OTTIMO system. No action is needed.',
  'It confirms that the server can deliver security notices to this mailbox.',
  '',
  'Đây là thư thử từ hệ thống OTTIMO. Không cần làm gì thêm.',
  'Thư xác nhận máy chủ gửi được thông báo bảo mật tới hộp thư này.',
  '',
  'OTTIMO Boutique Stay · Da Lat',
];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const html = `<!doctype html><html><body style="margin:0;padding:32px 16px;background:#F4F0E8;color:#2B2B28;font-family:'Be Vietnam Pro',Arial,sans-serif;font-size:15px;line-height:1.6;">
<div style="max-width:560px;margin:0 auto;background:#EDE6D8;padding:28px;">
<h1 style="margin:0 0 16px 0;font-family:Lora,Georgia,serif;font-weight:normal;font-size:22px;color:#2B2B28;">${esc(subjectEn)}</h1>
${lines.map((l) => (l === '' ? '<br>' : `<p style="margin:0 0 6px 0;">${esc(l)}</p>`)).join('\n')}
</div></body></html>`;

try {
  await transport.verify();
  if (verifyOnly) out('verified', 0);
  await transport.sendMail({
    from: { name: cfg.fromName, address: cfg.from },
    to,
    subject: `OTTIMO – ${subjectEn} / ${subjectVi}`,
    text: lines.join('\n'),
    html,
    messageId: `<mail-test-${Date.now()}@${cfg.from.split('@')[1]}>`,
    headers: { 'Auto-Submitted': 'auto-generated' },
  });
  out('sent', 0);
} catch (err) {
  out(`failed (${mapSmtpError(err).code})`, 1);
} finally {
  transport.close?.();
}
