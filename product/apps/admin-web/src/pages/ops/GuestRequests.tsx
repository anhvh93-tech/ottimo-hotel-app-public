import type { GuestRequest } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Field, Modal } from '@ottimo/ui';
import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../app/api';
import { timeHHmm } from '../../app/dates';
import { useToast } from '../../app/toast';
import { useOnline } from '../../hooks/useOnline';
import type { ResourceState } from '../../hooks/useResource';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { useSubmit } from '../stay/common';
import { SkeletonRows } from '../dashboard/parts';
import {
  DECLINE_REASONS,
  declineKey,
  DEPT_KEY,
  REQ_STATUS,
  REQ_TYPE_KEY,
  staffRoom,
} from './opsLabels';

const OPEN: GuestRequest['status'][] = ['new', 'acknowledged', 'in_progress'];

/**
 * S30 on H03 – the desk's queue of guest requests (US-110): every department (HK/MT see only theirs in the
 * PWA – AC3), not picked up in time first (BR-811, AC2), then oldest first. "Đã nhận" (acknowledge), "Xong"
 * for requests routed to the desk (housekeeping / maintenance ones close with their task / work order), and
 * "Không thực hiện được" with a reason and an optional message the guest reads (SM-15, US-109 AC2).
 */
export function GuestRequestsCard({
  state,
  onReload,
}: {
  state: ResourceState<GuestRequest[]>;
  onReload: () => void;
}) {
  const { t } = useI18n();
  const rows = (state.data ?? [])
    .filter((r) => OPEN.includes(r.status))
    .sort(
      (a, b) =>
        Number(!!b.isAckOverdue) - Number(!!a.isAckOverdue) ||
        a.createdAt.localeCompare(b.createdAt),
    );
  return (
    <section className="card" aria-labelledby="today-req">
      <div className="card-h">
        <h2 id="today-req">{`${t('today.requests')} (${rows.length})`}</h2>
      </div>
      {!state.data && state.status === 'error' ? (
        <Alert
          tone="bad"
          title={t('req.desk.error')}
          actions={
            <Button size="sm" onClick={onReload}>
              {t('common.retry')}
            </Button>
          }
        >
          {t('common.error_network_body')}
        </Alert>
      ) : !state.data ? (
        <SkeletonRows rows={1} />
      ) : rows.length === 0 ? (
        <p className="li-s">{t('req.desk.empty')}</p>
      ) : (
        <ul className="list">
          {rows.map((r) => (
            <li key={r.id}>
              <RequestRow r={r} onChanged={onReload} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RequestRow({ r, onChanged }: { r: GuestRequest; onChanged: () => void }) {
  const { t, money } = useI18n();
  const propertyId = usePropertyId();
  const { property } = useSession();
  const { online } = useOnline();
  const toast = useToast();
  const act = useSubmit();
  const [declining, setDeclining] = useState(false);
  const st = REQ_STATUS[r.status];
  const type = t(REQ_TYPE_KEY[r.type]);
  // 0.3.7 add. 1: `roomNo` is null while the booking has no room yet.
  const room = staffRoom(r) || t('req.desk.no_room');
  const run = async (action: 'acknowledge' | 'complete') => {
    const out = await act.submit((idem) =>
      api.transitionGuestRequest({ propertyId, requestId: r.id }, action, {}, idem),
    );
    if (out) {
      toast(t('req.desk.updated'));
      onChanged();
    }
  };
  return (
    <div className="li">
      <div>
        {r.roomNo ? (
          <div className="roomno">{r.roomNo}</div>
        ) : (
          <Chip tone="warn" icon="alert">
            {t('req.desk.no_room')}
          </Chip>
        )}
        {r.roomName ? <div className="li-s">{r.roomName}</div> : null}
      </div>
      <div className="grow">
        <div className="li-t">{type}</div>
        {r.note ? <div className="li-s">{t('hk.req_note', { note: r.note })}</div> : null}
        <div className="li-s">
          {t('gw.req.sent_at', { time: timeHHmm(new Date(r.createdAt), property?.timezone) })} ·{' '}
          {t('req.desk.routed', { dept: t(DEPT_KEY[r.routedTo]) })}
        </div>
        <div className="row wrap mt-4">
          <Chip tone={st.tone} icon={st.icon}>
            {t(st.key)}
          </Chip>
          {r.isAckOverdue ? (
            <Chip tone="bad" icon="clock">
              {t('req.desk.overdue')}
            </Chip>
          ) : null}
          {r.feeVnd ? (
            <Chip icon="bill">{t('req.desk.fee', { amount: money(r.feeVnd) })}</Chip>
          ) : null}
        </div>
        {r.hkTaskId ? (
          <Link className="li-s" to="/housekeeping">
            {t('req.desk.open_task')}
          </Link>
        ) : null}
        {r.workOrderId ? (
          <Link className="li-s" to="/maintenance">
            {t('req.desk.open_wo')}
          </Link>
        ) : null}
        {act.view()}
      </div>
      {online ? (
        <div className="row wrap">
          {r.status === 'new' ? (
            <Button size="sm" variant="pri" busy={act.busy} onClick={() => void run('acknowledge')}>
              {t('today.req_ack')}
            </Button>
          ) : r.routedTo === 'front_desk' ? (
            <Button size="sm" variant="pri" busy={act.busy} onClick={() => void run('complete')}>
              {t('req.desk.complete')}
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" onClick={() => setDeclining(true)}>
            {t('guest.req.status.declined')}
          </Button>
        </div>
      ) : null}
      {declining ? (
        <DeclineDialog
          r={r}
          type={type}
          room={room}
          onClose={() => setDeclining(false)}
          onDone={() => {
            setDeclining(false);
            onChanged();
          }}
        />
      ) : null}
    </div>
  );
}

/** Decline: reason code (the guest sees its label) + message, required for "other" (0.3.6 B-15). */
function DeclineDialog({
  r,
  type,
  room,
  onClose,
  onDone,
}: {
  r: GuestRequest;
  type: string;
  room: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const ids = useId();
  const [code, setCode] = useState<(typeof DECLINE_REASONS)[number]>('not_available_now');
  const [reply, setReply] = useState('');
  const act = useSubmit({ bound: ['replyNote', 'declinedReasonCode'] });
  const blocked = code === 'other' && !reply.trim();
  const save = async () => {
    const out = await act.submit((idem) =>
      api.transitionGuestRequest(
        { propertyId, requestId: r.id },
        'decline',
        { declinedReasonCode: code, replyNote: reply.trim() || undefined },
        idem,
      ),
    );
    if (out) {
      toast(t('req.desk.updated'));
      onDone();
    }
  };
  return (
    <Modal
      open
      size="sm"
      title={t('req.desk.decline_title', { type, room })}
      onClose={onClose}
      closeLabel={t('common.close')}
      dirty={!!reply}
      footer={
        <>
          <Button onClick={onClose}>{t('confirm.keep')}</Button>
          <Button
            variant="pri"
            busy={act.busy}
            busyLabel={act.busyLabel}
            disabled={blocked}
            onClick={() => void save()}
          >
            {act.label(t('guest.req.status.declined'))}
          </Button>
        </>
      }
    >
      <fieldset className="fieldset-plain">
        <legend id={`${ids}-why`}>{t('req.desk.decline_reason')}</legend>
        {DECLINE_REASONS.map((c) => (
          <label key={c} className="check">
            <input
              type="radio"
              name={`${ids}-c`}
              checked={code === c}
              onChange={() => setCode(c)}
            />
            {t(declineKey(c))}
          </label>
        ))}
      </fieldset>
      <Field
        label={t('req.desk.reply')}
        help={t('req.desk.reply_help')}
        required={code === 'other'}
        error={act.fields.replyNote}
      >
        {(p) => (
          <textarea
            {...p}
            className="input"
            rows={2}
            maxLength={300}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
        )}
      </Field>
      {act.view()}
    </Modal>
  );
}
