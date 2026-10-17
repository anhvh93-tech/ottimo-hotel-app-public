import type { GuestLinkIssued, Reservation } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, ConfirmDialog, Modal, QrCode } from '@ottimo/ui';
import { useState } from 'react';
import { api } from '../../app/api';
import { C3_TTL_MS, useC3Clipboard, useC3Reveal } from '../../app/c3';
import { useToast } from '../../app/toast';
import { usePropertyId } from '../../session/SessionProvider';
import { useSubmit } from '../stay/common';

/** How long the issued link stays on screen at most (it is never stored anywhere). */
const LINK_TTL_MS = 5 * 60_000;

/**
 * A22a online check-in link (H11/H15 drawer, FD+, `hold`/`confirmed`) – UXD s3 H:
 * "Tạo link check-in online" issues a link and shows it ONCE (warning above the link, copy, QR,
 * expiry, send note). "Tạo link mới" (after one was made here) and "Thu hồi link" confirm first
 * (`gw.link_reissue_title` / `gw.link_revoke_title`) – a new link stops the old one.
 * SEC (s3-SEC §8, the only place allowed to turn `onTabHidden` off): the token lives only in this
 * component's memory – never in logs, toasts, errors, console, storage or the URL; the QR is drawn
 * by the bundled encoder. Hidden on close, after 5 minutes, on unmount and on sign-out; the copied
 * link is wiped after 60 s / on leaving / sign-out (a wipe missed while the desk is in Zalo is
 * written again when the page is back) – not on a tab switch, the desk pastes it into Zalo.
 */
export function GuestLinkPanel({ reservation: r }: { reservation: Reservation }) {
  const { t, dateTime } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const R = { propertyId, reservationId: r.id };
  const [ask, setAsk] = useState<'reissue' | 'revoke' | null>(null);
  const [issuedHere, setIssuedHere] = useState(false);
  const issued = useC3Reveal<GuestLinkIssued>(LINK_TTL_MS, { onTabHidden: false });
  const clip = useC3Clipboard(C3_TTL_MS, { onTabHidden: false });
  const [copied, setCopied] = useState(false);
  const act = useSubmit();

  const issue = async () => {
    const out = await act.submit((idem) => api.issueGuestLink(R, idem));
    setAsk(null);
    if (out) {
      setCopied(false);
      setIssuedHere(true);
      issued.show(out.data);
    }
  };
  const revoke = async () => {
    const out = await act.submit(() => api.revokeGuestLink(R));
    setAsk(null);
    if (out) {
      issued.hide();
      clip.clear();
      setIssuedHere(false);
      toast(t('rsv.guest_link.revoked_toast', { code: r.code }));
    }
  };
  const close = () => {
    issued.hide();
    setCopied(false);
  };
  const link = issued.value;

  return (
    <div className="stack mt-12">
      <div className="row wrap">
        {issuedHere ? (
          <Button size="sm" onClick={() => setAsk('reissue')}>
            {t('rsv.guest_link.reissue')}
          </Button>
        ) : (
          <Button
            size="sm"
            busy={act.busy && ask === null}
            busyLabel={act.busyLabel}
            onClick={() => void issue()}
          >
            {act.label(t('rsv.guest_link.create'))}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => setAsk('revoke')}>
          {t('rsv.guest_link.revoke')}
        </Button>
      </div>
      {ask === null ? act.view() : null}
      {ask === 'reissue' ? (
        <ConfirmDialog
          danger={false}
          title={t('gw.link_reissue_title', { code: r.code })}
          body={t('rsv.guest_link.once_warning')}
          keepLabel={t('confirm.keep')}
          confirmLabel={t('rsv.guest_link.reissue')}
          busy={act.busy}
          busyLabel={act.busyLabel}
          onKeep={() => setAsk(null)}
          onConfirm={() => void issue()}
        >
          {act.view()}
        </ConfirmDialog>
      ) : null}
      {ask === 'revoke' ? (
        <ConfirmDialog
          danger
          title={t('gw.link_revoke_title', { code: r.code })}
          body={null}
          keepLabel={t('confirm.keep')}
          confirmLabel={t('rsv.guest_link.revoke')}
          busy={act.busy}
          busyLabel={act.busyLabel}
          onKeep={() => setAsk(null)}
          onConfirm={() => void revoke()}
        >
          {act.view()}
        </ConfirmDialog>
      ) : null}
      {link ? (
        <Modal
          open
          size="sm"
          title={t('rsv.guest_link.title', { code: r.code })}
          onClose={close}
          closeLabel={t('common.close')}
          footer={<Button onClick={close}>{t('common.close')}</Button>}
        >
          <Alert tone="warn">{t('rsv.guest_link.once_warning')}</Alert>
          <p className="mono break-all" data-testid="guest-link">
            {link.url}
          </p>
          <div className="row wrap">
            <Button
              variant="pri"
              icon="copy"
              onClick={() => {
                void clip.copy(link.url);
                setCopied(true);
              }}
            >
              {t('rsv.guest_link.copy')}
            </Button>
            <span className="li-s" aria-live="polite">
              {copied ? t('rsv.guest_link.copied') : ''}
            </span>
          </div>
          {/* s3-SEC §8 (4): next to "Sao chép" – 1–1 to the guest, never a group chat. */}
          <p className="li-s">{t('rsv.guest_link.send_private')}</p>
          <p className="li-s">{t('rsv.guest_link.expires', { time: dateTime(link.expiresAt) })}</p>
          <p className="li-s">{t('rsv.guest_link.send_note')}</p>
          <QrCode value={link.url} label={t('rsv.guest_link.title', { code: r.code })} size={180} />
        </Modal>
      ) : null}
    </div>
  );
}
