// One test e-mail through the worker's real SMTP path (OPS 8b, v1-production.md 19.6) – Google Workspace relay by the
// VPS IP, same nodemailer options (TLS ≥ 1.2, STARTTLS required), same EMAIL_FROM, same `egress` network as the worker.
// Not in the image and not on the server: sent from the OPS machine as the `node -e` program of a one-off worker
// container (bin/mail-test.sh passes it base64-encoded in the ssh command – it holds no address and no secret).
// Run it ONLY through bin/mail-test.sh (v1.0.3, plan-v1.0.3 V3-05) – on the Mac:
//   product/infra/server/bin/mail-test.sh --ssh ottimo-admin@desk.ottimo.vn --stack production --verify-only
//   product/infra/server/bin/mail-test.sh --ssh ottimo-admin@desk.ottimo.vn --stack production --send
// --send asks for the recipient at a hidden prompt and sends it as the ONLY line of the ssh stdin, which reaches this
// program's stdin unchanged (v1.0.4, ARC FB-R4-ARC-OPS-PR30-10): the address is read here from that first line, kept
// in memory only – never an environment variable (so not in `docker inspect` Config.Env nor /proc/<pid>/environ of
// the one-off container), never an argument (ARC v1.0.3 tech plan 2.9). MAIL_TEST_TO in the environment is REFUSED,
// so nobody types `-e MAIL_TEST_TO=<address>` by habit. sudo I/O logging must still stay off (it would record the
// stdin – SEC PR30-04), and a one-off container left by a killed client is still removed (runbook K8, PR30-05).
// MAIL_TEST_VERIFY_ONLY=1: connect + EHLO + STARTTLS only (transport.verify), nothing is sent, stdin is not read.
// Order of the checks (ARC FB-R4-ARC-OPS-P403-03): MAIL_TEST_TO refused → the stdin address (send only) → EMAIL_PROVIDER.
// So `--send` on staging (EMAIL_PROVIDER=mock) proves stdin reaches node without sending anything: an empty line gives
// "address on stdin is missing or invalid", a valid …@example.test line gives "EMAIL_PROVIDER is not smtp".
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
const verifyOnly = (env.MAIL_TEST_VERIFY_ONLY ?? '') === '1';
if (process.env.MAIL_TEST_TO !== undefined) out('failed (MAIL_TEST_TO must not be set - the address is read from stdin)', 2);

// First line of stdin (at most 256 characters are kept; the rest of the stream is not read).
const firstStdinLine = async () => {
  let buf = '';
  for await (const chunk of process.stdin) {
    buf += chunk.toString('utf8');
    const nl = buf.indexOf('\n');
    if (nl >= 0) return buf.slice(0, Math.min(nl, 256)).replace(/\r$/, '');
    if (buf.length > 256) return buf.slice(0, 256);
  }
  return buf.slice(0, 256);
};
// INT v1.0.4 (FB-R4-INT-BE-31-04): isEmailAddress is the shared ASCII-only rule and REFUSES surrounding whitespace
// (a CR/LF must never reach an envelope) – so the line ending of the stdin line (`\n`, `\r\n`) and any blank around
// it are trimmed here, before the check. Inner whitespace stays and is refused by the rule.
const to = verifyOnly ? '' : (await firstStdinLine()).replace(/[\r\n]+$/, '').trim();
if (!verifyOnly && !isEmailAddress(to)) out('failed (address on stdin is missing or invalid)', 2);
if ((env.EMAIL_PROVIDER ?? '').trim() !== 'smtp') out('failed (EMAIL_PROVIDER is not smtp)', 2);

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
