import { isApiError, type Payment, type VietQrResult } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, QrCode } from '@ottimo/ui';
import { monoArgs } from '../app/mono';

/**
 * One VietQR as the server issued it (`createVietQr` – SEC F2): the image is drawn in the bundle from
 * `qrPayload`, the amount and the transfer content come from the server, never typed into the QR by the
 * client. FE-S3-07 / DS 6.16: one block per fact, each copy button copies exactly one value. SEC F3: a
 * receiving account changed in the last 24 h is said next to the code.
 */
export function VietQrCard({ qr, size = 184 }: { qr: VietQrResult; size?: number }) {
  const { t, money } = useI18n();
  const amount = qr.payment.amountVnd;
  return (
    <div className="row wrap">
      <QrCode
        value={qr.qrPayload}
        label={t('pay.qr_label', { amount: money(amount), ref: qr.transferContent })}
        size={size}
      />
      <div className="stack grow">
        <div className="price-big num">{money(amount)}</div>
        <div>
          <span>{monoArgs(t, 'pay.qr_note', { ref: qr.transferContent }, ['ref'])}</span>{' '}
          <Button
            size="sm"
            icon="copy"
            onClick={() => void navigator.clipboard?.writeText(qr.transferContent)}
          >
            {t('pay.copy_ref')}
          </Button>
        </div>
        {qr.receivingAccountMasked ? (
          <div className="li-s">
            {monoArgs(t, 'pay.qr_account', { account: qr.receivingAccountMasked }, ['account'])}
          </div>
        ) : null}
        <div>
          <Button
            size="sm"
            icon="copy"
            onClick={() => void navigator.clipboard?.writeText(String(amount))}
          >
            {t('pay.copy_amount')}
          </Button>
        </div>
        {qr.receivingAccountRecentlyChanged ? (
          <Alert tone="warn">{t('pay.receiving_account_changed')}</Alert>
        ) : null}
      </div>
    </div>
  );
}

/**
 * DOM (f), ARC 0.3.7 bổ sung 4 (16.6): confirming a QR larger than what is due NOW (the cap of its purpose,
 * re-computed – `Payment.amountDueNowVnd`) needs a note; the excess becomes the guest's credit (BR-522).
 * Returns that amount due when the QR exceeds it (known before the click, or from 422 `REASON_REQUIRED`
 * on `note` with `max`), else null.
 */
export function qrOverDue(payment: Payment | undefined, error: unknown): number | null {
  if (
    isApiError(error) &&
    error.fieldErrors.some(
      (f) => f.field.replace(/^body\./, '') === 'note' && f.code === 'REASON_REQUIRED',
    ) &&
    typeof error.problem.max === 'number'
  )
    return error.problem.max;
  const due = payment?.amountDueNowVnd;
  return payment && typeof due === 'number' && payment.amountVnd > due ? due : null;
}
