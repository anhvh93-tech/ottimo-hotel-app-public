/**
 * `node dist/tools/check-chat-webhook.js < url` – the SAME rule the worker applies to the Google Chat webhook
 * (parseBookingChatWebhook – ARC gchat-booking-request-notify 8.7 G2, SEC GCHAT-02 point 2), for
 * infra/server/bin/init-secrets.sh --set-booking-chat before it writes the secret file.
 * Reads the URL from stdin (never an argument: no shell history, no `ps`), prints NOTHING, exits:
 *   0 = valid, 3 = invalid or empty. (Any other code = the tool itself failed – the script falls back to its own check.)
 */
import { parseBookingChatWebhook } from '@ottimo/integrations/common';

const chunks: Buffer[] = [];
process.stdin.on('data', (c: Buffer) => {
  chunks.push(c);
  if (chunks.reduce((n, x) => n + x.length, 0) > 4096) process.exit(3);
});
process.stdin.on('end', () => {
  const r = parseBookingChatWebhook(Buffer.concat(chunks).toString('utf8'));
  process.exit(r.mode === 'on' ? 0 : 3);
});
