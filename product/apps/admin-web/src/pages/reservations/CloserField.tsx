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
import { useToast } from '../../app/toast';
import { isRetryable, useWrite } from '../../app/useWrite';
import { usePropertyId, useSession } from '../../session/SessionProvider';

const FD_PLUS: Role[] = ['owner', 'manager', 'front_desk_lead', 'front_desk'];
const MGR_PLUS: Role[] = ['owner', 'manager'];
/** The statuses whose closer can still change (server `editable`; `checked_out` only with a closer-only body). */
const CLOSER_STATES: ReservationStatus[] = ['hold', 'confirmed', 'in_house', 'checked_out'];
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
  if (!CLOSER_STATES.includes(r.status)) return { mode: 'read' };
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
  /** The drawer shows this booking: the answer of a save, or the booking read again after a refusal. */
  onBooking: (booking: Reservation) => void;
  /** The booking left the statuses that take a closer change (409, or read again after a 412) → the drawer says so. */
  onTransitionChanged: (status: ReservationStatus) => void;
}

/**
 * What the Desk says once the server refused the change and the booking was read again (SEC 162-01, ARC 162-01):
 * - `moved`: the booking changed under us and this role can no longer change the closer → `closer_change_forbidden`.
 *   A check-in or a cancel at another desk bumps the version, so the server answers 412 – before 409 and 403 (order
 *   of SEC 158-02) – and the Desk only learns the new milestone by reading the booking again;
 * - `account`: 403 on the same booking, e.g. the role was just taken away → `error.FORBIDDEN_ACTION`;
 * - `unread`: 403 and the booking could not be read again → `error.FORBIDDEN_ACTION` with "Tải lại" – never "Desk đã
 *   tải lại đơn".
 * The field stays read-only (no select, no button: no second 403, no extra `access.denied`) while the booking keeps
 * the version the refusal was about.
 */
type Refusal = { kind: 'moved' | 'account' | 'unread'; version: number };

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
  onBooking,
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
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const [reading, setReading] = useState(false);
  const refused = refusal && refusal.version === r.version ? refusal : null;
  const write = useWrite();
  const toast = useToast();
  const selectRef = useRef<HTMLSelectElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  // UXD 162-01: after a save, focus goes back to the select – once the write is no longer busy (the select is
  // disabled while it is, and focus() on a disabled control does nothing: focus fell to <body>).
  const [refocus, setRefocus] = useState(false);

  // The stored closer changed (saved here, a reload, another desk): the box follows it and the reason goes.
  useEffect(() => {
    setPick(current);
    setReason('');
    setFields({});
  }, [current]);
  useEffect(() => {
    if (refusal) noticeRef.current?.focus();
  }, [refusal]);
  useEffect(() => {
    if (!refocus || write.busy) return;
    setRefocus(false);
    selectRef.current?.focus();
  }, [refocus, write.busy]);

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
    if (!changed || write.busy || reading || access.mode !== 'edit' || refused || !online) return;
    const text = reason.trim();
    setError(null);
    setRefusal(null);
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
    const sent = r.version;
    try {
      const out = await write.run(() =>
        api.updateReservation({ propertyId, reservationId: r.id }, body, sent),
      );
      notifyChanged();
      setReason('');
      onBooking(out.data);
      // Changing the closer moves the commission: say it is saved, like every other Desk save (UXD 162-01).
      toast(t('common.saved'));
      setRefocus(true);
    } catch (err) {
      if (isRetryable(err)) return; // the retry notice keeps the input and explains
      if (
        isApiError(err) &&
        ((err.status === 403 && err.code === 'FORBIDDEN_ACTION') || err.code === 'VERSION_CONFLICT')
      ) {
        await settle(err.status === 403, err, sent);
        return;
      }
      if (isApiError(err) && err.code === 'INVALID_TRANSITION') {
        // v1.3 (ARC 162-03): a 409 for a commission line already `payable`/`paid` needs its own branch and sentence –
        // `currentStateOf` would read it as a booking status. v1.0.5 has no payout flow, so it does not happen (9.16).
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

  /**
   * After a 403 or a 412: read the booking again (without the drawer's error state), then say what it means for this
   * role now (see `Refusal`). A 412 on a booking this role may still change keeps today's answer: the conflict
   * sentence, "Tải lại", the input kept.
   */
  async function settle(forbiddenAnswer: boolean, err: unknown, sent: number) {
    let fresh: Reservation | null = null;
    setReading(true);
    try {
      fresh = (await api.getReservation({ propertyId, reservationId: r.id })).data;
    } catch {
      fresh = null;
    } finally {
      setReading(false);
    }
    if (!fresh) {
      if (forbiddenAnswer) {
        setPick(current);
        setReason('');
        setRefusal({ kind: 'unread', version: sent });
      } else setError(err);
      return;
    }
    if (!CLOSER_STATES.includes(fresh.status)) {
      onBooking(fresh);
      onTransitionChanged(fresh.status);
      return;
    }
    const moved = closerAccess(roles, fresh).mode !== 'edit';
    if (!moved && !forbiddenAnswer) {
      setError(err);
      return;
    }
    onBooking(fresh);
    setPick(fresh.closerUserId ?? '');
    setReason('');
    setFields({});
    setRefusal({ kind: moved ? 'moved' : 'account', version: fresh.version });
  }

  const needsReload =
    isApiError(error) &&
    (error.code === 'VERSION_CONFLICT' || error.code === 'PRECONDITION_REQUIRED');
  const notices = (
    <>
      {refused ? (
        <div ref={noticeRef} tabIndex={-1}>
          <Alert
            tone="warn"
            role="alert"
            actions={
              refused.kind === 'unread' ? (
                <Button
                  size="sm"
                  busy={reading}
                  disabled={!online}
                  onClick={() => void settle(true, null, r.version)}
                >
                  {t('common.reload')}
                </Button>
              ) : undefined
            }
          >
            {t(
              refused.kind === 'moved' ? 'error.closer_change_forbidden' : 'error.FORBIDDEN_ACTION',
            )}
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

  if (access.mode !== 'edit' || refused || (!list && listFailed)) {
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
            disabled={!list || !online || write.busy || reading}
            onChange={(e) => {
              setPick(e.target.value);
              setFields({});
              setError(null);
              setRefusal(null);
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
            disabled={!online || reading}
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
