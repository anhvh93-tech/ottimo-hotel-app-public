import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Checkbox } from '@ottimo/ui';
import { useState } from 'react';

/** 16 Crockford base32 characters shown 4-4-4-4 (OpenAPI 0.3.8); other shapes are shown as sent. */
export function formatRecoveryCode(code: string): string {
  const raw = code.replace(/[\s-]/g, '').toUpperCase();
  return raw.length === 16 ? (raw.match(/.{4}/g) ?? [raw]).join('-') : code;
}

/** Plain text of the codes for the .txt file and the print-out – built on the client (SEC 06.13). */
export function recoveryCodesText(lines: { title: string; note: string }, codes: string[]): string {
  return [
    lines.title,
    lines.note,
    '',
    ...codes.map((c, i) => `${String(i + 1).padStart(2, ' ')}. ${formatRecoveryCode(c)}`),
    '',
  ].join('\n');
}

function downloadText(fileName: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Print only the codes: a throw-away iframe filled with text nodes (no HTML from the server), removed after. */
function printText(text: string) {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.position = 'fixed';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) {
    frame.remove();
    return;
  }
  const pre = doc.createElement('pre');
  // Brand mono face for codes (JetBrains Mono, fallback Courier New – brand guideline 6).
  pre.style.fontFamily = "'JetBrains Mono', 'Courier New', monospace";
  pre.style.fontSize = '12pt';
  pre.style.color = '#2B2B28';
  pre.textContent = text;
  doc.body.appendChild(pre);
  try {
    win.focus();
    win.print();
  } finally {
    setTimeout(() => frame.remove(), 1000);
  }
}

/**
 * The 10 recovery codes, shown ONCE (SEC 06.13, US-143 AC3 a): JetBrains Mono, download .txt / print on the
 * client, a required "stored away from my phone" tick before Finish. The codes live only in the parent's
 * state – leaving the screen drops them; nothing goes to Web Storage.
 * [CHỜ UXD] hi-fi R3 – layout follows hi-fi 01-login 1.4 step 3 (R1).
 */
export function RecoveryCodesPanel({
  codes,
  userLabel,
  onDone,
  doneLabel,
}: {
  codes: string[];
  userLabel: string;
  onDone: () => void;
  doneLabel?: string;
}) {
  const { t } = useI18n();
  const [ack, setAck] = useState(false);
  const text = () =>
    recoveryCodesText(
      {
        title: t('mfa.codes_file_title'),
        note: t('mfa.codes_file_note', {
          user: userLabel,
          time: new Date().toLocaleString('vi-VN', { hour12: false }),
        }),
      },
      codes,
    );
  return (
    <div className="stack">
      <p className="muted">{t('auth.enroll.step3_help')}</p>
      <Alert tone="warn">{t('mfa.codes_once')}</Alert>
      <ol
        className="quote-text mono"
        aria-label={t('mfa.codes_list_label')}
        style={{ columns: 2, margin: 0, paddingLeft: 32 }}
      >
        {codes.map((c) => (
          <li key={c}>{formatRecoveryCode(c)}</li>
        ))}
      </ol>
      <div className="row">
        <Button size="sm" onClick={() => downloadText('ottimo-recovery-codes.txt', text())}>
          {t('auth.enroll.download')}
        </Button>
        <Button size="sm" icon="printer" onClick={() => printText(text())}>
          {t('auth.enroll.print')}
        </Button>
      </div>
      <Checkbox checked={ack} onChange={setAck}>
        {t('mfa.codes_ack_apart')}
      </Checkbox>
      <Button variant="pri" block disabled={!ack} onClick={onDone}>
        {ack ? (doneLabel ?? t('mfa.finish')) : t('mfa.finish_locked')}
      </Button>
    </div>
  );
}
