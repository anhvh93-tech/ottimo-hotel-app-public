import type { VietQrResult } from '@ottimo/api-client';
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
