import type { Payment, Reservation, VietQrResult } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button } from '@ottimo/ui';
import { useEffect, useRef, useState } from 'react';
import { api } from '../../app/api';
import { VietQrCard } from '../../components/VietQrCard';
import { usePropertyId } from '../../session/SessionProvider';
import { useSubmit } from '../stay/common';

/** Deposit still missing on a hold (BR-305) – what the deposit VietQR asks for. */
export const depositMissing = (r: Pick<Reservation, 'depositRequiredVnd' | 'depositPaidVnd'>) =>
  Math.max(0, (r.depositRequiredVnd ?? 0) - (r.depositPaidVnd ?? 0));

/** H11: the deposit VietQR still waiting on the folio (created at H12), newest first – or null. */
export function pendingDepositQr(payments: Payment[] | undefined, now = Date.now()) {
  const open = (payments ?? []).filter(
    (p) =>
      p.method === 'vietqr' &&
      p.status === 'pending' &&
      p.type === 'deposit' &&
      (!p.expiresAt || Date.parse(p.expiresAt) > now),
  );
  return open.at(-1) ?? null;
}

/**
 * S4-28 (US-084 AC4, US-120; BUG-R2-062): the deposit VietQR of a hold – `createVietQr purpose=deposit`
 * for the missing deposit, content = booking code (server). H12 creates it right after the hold (`auto`);
 * H11 shows the QR already sent to the guest (`pending`) and creates one only on request – a new code
 * expires the one the guest may be paying with. Collaborators never call it (not in `x-roles`).
 */
export function DepositQr({
  reservation: r,
  auto = false,
  pending = null,
  onQr,
}: {
  reservation: Reservation;
  auto?: boolean;
  pending?: Payment | null;
  onQr?: (qr: VietQrResult) => void;
}) {
  const { t, money, dateTime } = useI18n();
  const propertyId = usePropertyId();
  const act = useSubmit();
  const [qr, setQr] = useState<VietQrResult | null>(null);
  const started = useRef(false);
  const amount = depositMissing(r);

  const create = async () => {
    if (!(amount > 0)) return;
    const out = await act.submit((idem) =>
      api.createVietQr(
        { propertyId, folioId: r.folioId },
        { amountVnd: amount, purpose: 'deposit' },
        idem,
      ),
    );
    if (out) {
      setQr(out.data);
      onQr?.(out.data);
    }
  };

  useEffect(() => {
    // Once per hold (refs survive the StrictMode double effect; a resend reuses the Idempotency-Key).
    if (!auto || started.current) return;
    started.current = true;
    void create();
    // create() reads the reservation of this render – the hold does not change here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  if (!(amount > 0)) return null;
  if (qr) return <VietQrCard qr={qr} />;

  const failed = act.error ? (
    act.code === 'PAYMENT_NOT_CONFIGURED' ? (
      act.view()
    ) : (
      <Alert
        tone="warn"
        actions={
          <Button size="sm" onClick={() => void create()}>
            {t('common.retry')}
          </Button>
        }
      >
        {t('dep.qr_failed')}
      </Alert>
    )
  ) : null;

  if (act.busy)
    return (
      <p className="li-s" role="status">
        {t('dep.qr_creating')}
      </p>
    );
  if (pending)
    return (
      <div className="stack">
        <Alert tone="info" role="status">
          {t('dep.qr_pending', {
            amount: money(pending.amountVnd),
            time: pending.expiresAt ? dateTime(pending.expiresAt) : '–',
          })}
        </Alert>
        {failed}
        <div>
          <Button size="sm" icon="scan" onClick={() => void create()}>
            {t('dep.qr_recreate')}
          </Button>
          <p className="help">{t('dep.qr_recreate_help')}</p>
        </div>
      </div>
    );
  if (failed) return failed;
  if (auto) return null;
  return (
    <Button size="sm" icon="scan" onClick={() => void create()}>
      {t('pay.vietqr_create', { amount: money(amount) })}
    </Button>
  );
}
