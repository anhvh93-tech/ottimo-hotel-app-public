import { Icon } from '@ottimo/ui';
import type { GuestSession, GuestStay, OnlineCheckin } from '../app/api';
import { nightsBetween, useT } from '../app/i18n';
import { safeMapUrl, telHref } from '../app/link';
import { WifiBlock } from './WifiBlock';

/** H18 18.1 – "Lưu trú" (level 1). Only GuestSession/GuestStay level-1 keys are read (SEC ĐK-2). */
export function HomePage({
  session,
  stay,
  checkin,
  onCheckin,
  onInfo,
}: {
  session?: GuestSession;
  stay: GuestStay;
  checkin?: OnlineCheckin;
  onCheckin: () => void;
  onInfo: () => void;
}) {
  const { t, shortDate } = useT();
  const name = session?.guestFirstName;
  const nights = nightsBetween(stay.arrivalDate, stay.departureDate);
  const tel = telHref(stay.property.phone);
  const map = safeMapUrl(stay.property.mapUrl);
  const roomNo = stay.roomNo ?? session?.roomNo ?? null;
  const isDone = Boolean(checkin?.completedAt) || checkin?.currentStep === 'done';
  const uploadedN = checkin?.uploadedPeople?.length ?? 0;
  const deferredN = checkin?.deferredPeople?.length ?? 0;

  return (
    <div className="m-body gw-stack">
      <div>
        <h2 className="gw-hello" tabIndex={-1} data-autofocus>
          {name ? t('guest.hello', { name }) : stay.reservationCode}
        </h2>
        <p className="li-s">
          {name ? `${stay.reservationCode} · ` : ''}
          {t('guest.stay.dates', {
            from: shortDate(stay.arrivalDate),
            to: shortDate(stay.departureDate),
            nights,
          })}
        </p>
      </div>

      <div className="card">
        <dl className="dl">
          {roomNo ? (
            <>
              <dt>{t('gw.room')}</dt>
              <dd>{roomNo}</dd>
            </>
          ) : null}
          <dt>{t('gw.checkin')}</dt>
          <dd>{t('guest.stay.checkin_time', { time: stay.checkinTime })}</dd>
          <dt>{t('gw.checkout')}</dt>
          <dd>{t('guest.stay.checkout_time', { time: stay.checkoutTime })}</dd>
        </dl>
        <WifiBlock stay={stay} />
      </div>

      {stay.onlineCheckinAvailable && isDone ? (
        <div className="card">
          <h3 className="gw-card-title">
            <Icon name="check" />
            {t('gw.oci_done_card_title')}
          </h3>
          <p className="li-s m-0 mt-4">
            {checkin?.lateArrival
              ? // "After 22:00" is stored as 22:00 + lateArrival (contract 0.3.3) – UXD MOB-S3-03.
                t('gw.oci_done_card_body_late', {
                  n: uploadedN,
                  m: checkin.requiredPeople,
                  time: checkin.etaTime ?? '22:00',
                })
              : t('gw.oci_done_card_body', {
                  n: uploadedN,
                  m: checkin?.requiredPeople ?? 0,
                  eta: checkin?.etaTime ?? '–',
                })}
          </p>
          {deferredN ? (
            <p className="li-s m-0">{t('gw.oci_done_card_deferred', { k: deferredN })}</p>
          ) : null}
          <button type="button" className="btn block mt-8" onClick={onCheckin}>
            {t('gw.oci_done_card_view')}
          </button>
        </div>
      ) : stay.onlineCheckinAvailable ? (
        <div className="card gw-cta">
          <h3>{t('guest.cta.checkin')}</h3>
          <p className="li-s m-0 mt-4 mb-12">{t('guest.cta.checkin_help')}</p>
          <button type="button" className="btn pri block" onClick={onCheckin}>
            {t('guest.cta.checkin_short')}
          </button>
        </div>
      ) : stay.status === 'confirmed' ? (
        <div className="card">
          <h3>{t('guest.oci.closed_desk')}</h3>
          <p className="li-s">{t('gw.closed_body')}</p>
        </div>
      ) : null}

      <div className="card">
        <h3>{t('gw.door_at_desk_title')}</h3>
        <p className="li-s">{t('gw.door_at_desk')}</p>
        {tel ? (
          <a className="btn block mt-8" href={tel}>
            {t('guest.contact.call')}
          </a>
        ) : null}
      </div>

      <ul className="list card gw-links">
        {map ? (
          <li>
            <a className="rowlink" href={map} target="_blank" rel="noopener noreferrer">
              <Icon name="globe" />
              <span className="grow">{t('gw.directions')}</span>
              <Icon name="chevron" />
            </a>
          </li>
        ) : null}
        <li>
          <button type="button" className="rowlink" onClick={onInfo}>
            <Icon name="info" />
            <span className="grow">{t('gw.house_rules')}</span>
            <Icon name="chevron" />
          </button>
        </li>
      </ul>
    </div>
  );
}
