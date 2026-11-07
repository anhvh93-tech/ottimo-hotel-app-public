import {
  isApiError,
  type ChannelGroup,
  type CloserCandidate,
  type Reservation,
  type ReservationPatch,
  type ReservationStatus,
  type Role,
} from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Field } from '@ottimo/ui';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '../../app/api';
import { notifyChanged } from '../../app/live';
import { fieldErrors } from '../../app/problem';
import { currentStateOf, rsvErrorText } from '../../app/reservations';
import { isRetryable, useWrite } from '../../app/useWrite';
import { usePropertyId, useSession } from '../../session/SessionProvider';

const FD_PLUS: Role[] = ['owner', 'manager', 'front_desk_lead', 'front_desk'];
const MGR_PLUS: Role[] = ['owner', 'manager'];
/** `ReservationPatch.closerChangeReason`: 3–500 characters (V-08). */
const REASON_MIN = 3;
const REASON_MAX = 500;

export type CloserKind = 'agent' | 'staff';

/**
 * A-06 (server `checkCloserForChannel`): a CTV channel booking names the agent who closed it; a Direct booking from
 * "Sale nội bộ" names the staff closer. Other channels need no closer.
 */
export function closerKindOf(
  group: ChannelGroup | undefined,
  directSource: Reservation['directSource'],
): CloserKind | null {
  if (group === 'agent') return 'agent';
  if (group === 'direct' && directSource === 'sales_staff') return 'staff';
  return null;
}

/** The read-only line under the closer's name (UXD copy-v1.0.5 9.16, DOM 154-03). */
type ReadonlyLine = 'rsv.closer.readonly_manager' | 'rsv.closer.readonly_owner';

export type CloserAccess =
  | { mode: 'hidden' }
  | { mode: 'edit'; reason: 'none' | 'optional' | 'required' }
  | { mode: 'read'; line?: ReadonlyLine };

/**
 * Contract 0.3.13 addendum 1h/1i (`updateReservation`, BE-H #154/#157) – who may change the closer at this milestone:
 * - `hold`: FD+, no reason;
 * - after the hold, before check-in (`confirmed`): MGR+, reason optional (DOM 1H-05); FD/FDL read-only;
 * - after check-in (`in_house`, `checked_out`, or a real check-in time): OWN only, reason required; MGR/FDL/FD
 *   read-only.
 * The Desk never offers the change to a role the server answers 403 (`access.denied`, DOM 154-03). SAL/CTV see no
 * closer row: changing it is not their job (UXD 9.16), and they cannot read the candidate list. A cancelled or
 * no-show booking takes no PATCH (409): the name only.
 */
export function closerAccess(
  roles: readonly Role[],
  r: Pick<Reservation, 'status' | 'actualCheckinAt'>,
): CloserAccess {
  if (!roles.some((x) => FD_PLUS.includes(x))) return { mode: 'hidden' };
  if (r.status === 'hold') return { mode: 'edit', reason: 'none' };
  if (!['confirmed', 'in_house', 'checked_out'].includes(r.status)) return { mode: 'read' };
  const checkedIn = r.status !== 'confirmed' || !!r.actualCheckinAt;
  if (checkedIn) {
    return roles.includes('owner')
      ? { mode: 'edit', reason: 'required' }
      : { mode: 'read', line: 'rsv.closer.readonly_owner' };
  }
  return roles.some((x) => MGR_PLUS.includes(x))
    ? { mode: 'edit', reason: 'optional' }
    : { mode: 'read', line: 'rsv.closer.readonly_manager' };
}

interface Props {
  reservation: Reservation;
  channelGroup: ChannelGroup | undefined;
  online: boolean;
  /** Read the booking again (the drawer keeps it); null when the read failed. */
  reload: () => Promise<Reservation | null>;
  onSaved: (updated: Reservation) => void;
  /** 409 INVALID_TRANSITION and the reload worked → the drawer says what changed. */
  onTransitionChanged: (status: ReservationStatus) => void;
}

/**
 * H11 khung đơn, ô "Người chốt" (UXD copy-v1.0.5 9.16; DOM 154-03; SEC 1I-03). A role that may change the closer at
 * this milestone gets the same select as the booking dialog; the reason box shows only once another person is picked,
 * and only outside the hold. Other roles read the name with one line saying whom to ask. The PATCH body only ever
 * carries `closerUserId` (+ `closerChangeReason` when the closer changes) – the only body a `checked_out` booking
 * takes (BE 1H-01).
 */
export function CloserField({
  reservation: r,
  channelGroup,
  online,
  reload,
  onSaved,
  onTransitionChanged,
}: Props) {
  const { t, locale } = useI18n();
  const propertyId = usePropertyId();
  const { roles } = useSession();
  const access = closerAccess(roles, r);
  const kind = closerKindOf(channelGroup, r.directSource);
  const current = r.closerUserId ?? '';
  const shown = access.mode !== 'hidden' && (kind !== null || current !== '');

  // Names come from the candidate list (FD+, `kind=all`: active people only – no lock state, D27).
  const [list, setList] = useState<CloserCandidate[] | null>(null);
  const [listFailed, setListFailed] = useState(false);
  const [listRound, setListRound] = useState(0);
  useEffect(() => {
    if (!shown) return;
    let stale = false;
    setListFailed(false);
    api.listCloserCandidates({ propertyId }, 'all').then(
      (x) => !stale && setList(x.data.data),
      () => !stale && setListFailed(true),
    );
    return () => {
      stale = true;
    };
  }, [shown, propertyId, listRound]);

  const [pick, setPick] = useState(current);
  const [reason, setReason] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<unknown>(null);
  const [forbidden, setForbidden] = useState(false);
  const write = useWrite();
  const selectRef = useRef<HTMLSelectElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);

  // The stored closer changed (saved here, a reload, another desk): the box follows it and the reason goes.
  useEffect(() => {
    setPick(current);
    setReason('');
    setFields({});
  }, [current]);
  useEffect(() => {
    if (forbidden) noticeRef.current?.focus();
  }, [forbidden]);

  if (!shown) return null;

  const label = t(kind === 'agent' ? 'bk.closer' : 'bk.closer_sales');
  const nameOf = (id: string) =>
    list?.find((c) => c.userId === id)?.displayName ?? t('mlog.who_unlisted');
  const changed = pick !== '' && pick !== current;
  const reasonRule = access.mode === 'edit' ? access.reason : 'none';
  const askReason = changed && reasonRule !== 'none';

  const forget = () => {
    setPick(current);
    setReason('');
    setFields({});
    setError(null);
  };

  const save = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!changed || write.busy || access.mode !== 'edit' || !online) return;
    const text = reason.trim();
    setError(null);
    setForbidden(false);
    // V-08 locally first: required after check-in; before it, empty is fine but a started reason needs 3 characters.
    if (askReason && (reasonRule === 'required' || text !== '') && text.length < REASON_MIN) {
      setFields({ closerChangeReason: t('field_error.reason_required') });
      return;
    }
    setFields({});
    // Only the closer and, when the closer changes outside the hold, its reason (contract 1i: never a reason
    // without a change – 422 NOT_ALLOWED; `checked_out` takes nothing else – BE 1H-01).
    const body: ReservationPatch = {
      closerUserId: pick,
      ...(askReason && text ? { closerChangeReason: text } : {}),
    };
    try {
      const out = await write.run(() =>
        api.updateReservation({ propertyId, reservationId: r.id }, body, r.version),
      );
      notifyChanged();
      setReason('');
      onSaved(out.data);
      selectRef.current?.focus();
    } catch (err) {
      if (isRetryable(err)) return; // the retry notice keeps the input and explains
      if (isApiError(err) && err.status === 403 && err.code === 'FORBIDDEN_ACTION') {
        // The milestone moved under us (e.g. the guest checked in at another desk): read the booking again first,
        // then say why – the field is then read-only with its `readonly_*` line (copy 9.16).
        const fresh = await reload();
        setPick(fresh?.closerUserId ?? current);
        setReason('');
        setForbidden(true);
        return;
      }
      if (isApiError(err) && err.code === 'INVALID_TRANSITION') {
        const fresh = await reload();
        if (fresh) {
          onTransitionChanged(currentStateOf(err) ?? fresh.status);
          return;
        }
      }
      const f = fieldErrors(t, err, { max: REASON_MAX }, locale);
      const own = {
        ...(f.closerUserId ? { closerUserId: f.closerUserId } : {}),
        ...(f.closerChangeReason ? { closerChangeReason: f.closerChangeReason } : {}),
      };
      setFields(own);
      // Someone just turned off, or not a closer for this channel: the list is read again (copy 9.16).
      if (
        isApiError(err) &&
        err.fieldErrors.some(
          (fe) => fe.field.replace(/^body\./, '') === 'closerUserId' && fe.code === 'NOT_IN_LIST',
        )
      )
        setListRound((n) => n + 1);
      if (!Object.keys(own).length) setError(err);
    }
  };

  const needsReload =
    isApiError(error) &&
    (error.code === 'VERSION_CONFLICT' || error.code === 'PRECONDITION_REQUIRED');
  const notices = (
    <>
      {forbidden ? (
        <div ref={noticeRef} tabIndex={-1}>
          <Alert tone="warn" role="alert">
            {t('error.closer_change_forbidden')}
          </Alert>
        </div>
      ) : null}
      {write.notice ??
        (error ? (
          <Alert
            tone="bad"
            actions={
              needsReload ? (
                <Button
                  size="sm"
                  onClick={() =>
                    void reload().then((fresh) => {
                      if (fresh) setError(null);
                    })
                  }
                >
                  {t('common.reload')}
                </Button>
              ) : undefined
            }
          >
            {rsvErrorText(t, error, { locale, canSeeGuest: true })}
          </Alert>
        ) : null)}
    </>
  );

  if (access.mode !== 'edit' || (!list && listFailed)) {
    const line = access.mode === 'read' ? access.line : undefined;
    const name = !current
      ? '–'
      : list
        ? nameOf(current)
        : listFailed
          ? t('common.error_generic_title')
          : t('common.loading');
    return (
      <div className="mt-12">
        <dl className="dl">
          <dt>{label}</dt>
          <dd>
            {name}
            {line ? <div className="li-s">{t(line)}</div> : null}
            {listFailed && !list ? (
              <div className="mt-8">
                <Button size="sm" onClick={() => setListRound((n) => n + 1)}>
                  {t('common.retry')}
                </Button>
              </div>
            ) : null}
          </dd>
        </dl>
        {notices}
      </div>
    );
  }

  // Same choices as the booking dialog (A-06): the channel's kind; the stored closer stays listed even when it is no
  // longer offered ("Người không còn trong danh sách").
  const options = (list ?? []).filter((c) => !kind || c.kind === kind || c.userId === current);
  const unlisted = current !== '' && !!list && !list.some((c) => c.userId === current);
  return (
    <form className="stack mt-12" onSubmit={(e) => void save(e)} noValidate>
      <Field label={label} error={fields.closerUserId}>
        {(p) => (
          <select
            {...p}
            ref={selectRef}
            className="input"
            value={list ? pick : ''}
            disabled={!list || !online || write.busy}
            onChange={(e) => {
              setPick(e.target.value);
              setFields({});
              setError(null);
              setForbidden(false);
              if (e.target.value === current) setReason('');
            }}
          >
            {!list ? (
              <option value="">{t('common.loading')}</option>
            ) : (
              <>
                {current === '' ? <option value="">–</option> : null}
                {unlisted ? <option value={current}>{t('mlog.who_unlisted')}</option> : null}
                {options.map((c) => (
                  <option key={c.userId} value={c.userId}>
                    {c.displayName}
                  </option>
                ))}
              </>
            )}
          </select>
        )}
      </Field>
      {askReason ? (
        // SEC 1I-03: the help line (who reads the reason, what never to write) is always shown with the box, errors
        // or not – the Field puts it in `aria-describedby`.
        <Field
          label={
            reasonRule === 'required' ? (
              t('rsv.closer.reason')
            ) : (
              <>
                {t('rsv.closer.reason')} <span className="li-s">({t('common.optional')})</span>
              </>
            )
          }
          required={reasonRule === 'required'}
          help={t('rsv.closer.reason_help')}
          error={fields.closerChangeReason}
        >
          {(p) => (
            <input
              {...p}
              className="input"
              maxLength={REASON_MAX}
              placeholder={t('rsv.closer.reason_hint')}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (fields.closerChangeReason) setFields({});
              }}
            />
          )}
        </Field>
      ) : null}
      {changed ? (
        <div className="row wrap">
          <Button
            type="submit"
            variant="pri"
            size="sm"
            busy={write.busy}
            busyLabel={write.busyLabel}
            disabled={!online}
          >
            {write.label(t('common.save'))}
          </Button>
          {/* UXD 162-02: "Bỏ thay đổi", not "Hủy" – the drawer has "Hủy đơn" / "Hủy giữ chỗ" (copy 9.16 v2.7). */}
          <Button variant="ghost" size="sm" disabled={write.busy} onClick={forget}>
            {t('common.unsaved_discard')}
          </Button>
        </div>
      ) : null}
      {notices}
    </form>
  );
}
