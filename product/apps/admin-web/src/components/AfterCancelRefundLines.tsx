import type { ApprovalRequest } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { isAfterCancelRefund } from '../app/afterCancel';

/**
 * 5B-1 (UXD copy-v1.0.5 9.1; SEC S3, DOM 11.4 mục 3): a `payment_after_cancel` refund request on Cần duyệt and Hoàn
 * tiền – why it exists, and the destination the server fixed (back to the account the guest paid from: no cash, no
 * other account, never ask for the guest's account number). Nothing for any other request.
 */
export function AfterCancelRefundLines({
  request,
  destinationOnly,
}: {
  request: Pick<ApprovalRequest, 'type' | 'reasonCode'>;
  /** The pay-out box: the destination block only (the reason is on the list). */
  destinationOnly?: boolean;
}) {
  const { t } = useI18n();
  if (!isAfterCancelRefund(request)) return null;
  return (
    <>
      {destinationOnly ? null : <div className="li-s">{t('refund.after_cancel_note')}</div>}
      <div className="li-s">{t('refund.after_cancel_destination')}</div>
      <div className="li-s">{t('refund.after_cancel_guest_line')}</div>
    </>
  );
}
