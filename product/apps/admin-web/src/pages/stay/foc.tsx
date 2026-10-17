import type { ApprovalRequest, FocRequestInput, FolioLine, Role } from '@ottimo/api-client';
import { isApiError } from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Field, Modal, Seg, Switch } from '@ottimo/ui';
import { useId, useState } from 'react';
import { api } from '../../app/api';
import { lineLabel } from '../../app/folio';
import { useToast } from '../../app/toast';
import { usePropertyId, useSession } from '../../session/SessionProvider';
import { MoneyField, amountOf, useSubmit } from './common';

/** BR-432 reasons, in the order of the hi-fi (H13 13.4, H17 17.1). */
export const FOC_REASONS: Array<{ value: FocRequestInput['reasonCode']; key: string }> = [
  { value: 'regular_vip', key: 'foc.r_regular' },
  { value: 'room_ready_no_impact', key: 'foc.r_room_ready' },
  { value: 'service_recovery', key: 'foc.r_recovery' },
  { value: 'long_stay_guest', key: 'foc.r_long' },
  { value: 'other', key: 'foc.r_other' },
];

/** BR-436 (INV-007): what a front desk may waive itself – a hint only, the server decides (re-auth). */
export const SELF_APPLY = { perTimeVnd: 100_000, perMonthVnd: 500_000, categories: ['minibar'] };

/** Categories of the lines that reduce a charge (FOC / special discount). */
export const FOC_CATEGORIES: readonly string[] = ['foc', 'discount'];
const REDUCTION = FOC_CATEGORIES;
const NOT_WAIVABLE = ['foc', 'discount', 'adjustment'];

/** Lines that reduce `line` (FOC / special discount) – live or waiting for a decision. */
function reductionsOf(lines: FolioLine[], line: FolioLine): FolioLine[] {
  const reversed = new Set(lines.map((l) => l.reversalOfId).filter(Boolean));
  return lines.filter(
    (l) =>
      l.relatedLineId === line.id &&
      REDUCTION.includes(l.category) &&
      (l.lineState === 'posted' || l.lineState === 'pending_approval') &&
      !l.reversalOfId &&
      !reversed.has(l.id),
  );
}

/**
 * S4-23 (6) / S4-25: the most a NEW request may ask on a charge line = the line − what the reductions on it
 * apply now − what the pending requests on it ask (the server's `reductionHeadroomVnd`; 422 `max` otherwise).
 */
export function focHeadroom(lines: FolioLine[], line: FolioLine): number {
  const used = reductionsOf(lines, line).reduce((a, l) => a + Math.abs(l.amountVnd), 0);
  return Math.max(0, line.amountVnd - used);
}

/** A live charge line the desk may ask a FOC / special discount on (the server re-checks every rule). */
export function canAskFoc(lines: FolioLine[], line: FolioLine): boolean {
  const reversed = new Set(lines.map((l) => l.reversalOfId).filter(Boolean));
  return (
    line.lineState === 'posted' &&
    line.amountVnd > 0 &&
    !line.reversalOfId &&
    !reversed.has(line.id) &&
    !NOT_WAIVABLE.includes(line.category) &&
    focHeadroom(lines, line) > 0
  );
}

/** BR-434 state of a FOC / discount line as the folio shows it: waiting, applied, or no longer applied. */
export function FocStateChip({ line, lines }: { line: FolioLine; lines: FolioLine[] }) {
  const { t } = useI18n();
  if (!REDUCTION.includes(line.category)) return null;
  const reversed = lines.some((l) => l.reversalOfId === line.id);
  if (line.lineState === 'pending_approval')
    return (
      <Chip tone="warn" icon="hourglass">
        {t('approval.status.pending')}
      </Chip>
    );
  if (line.lineState === 'rejected')
    return (
      <Chip tone="bad" icon="x">
        {t('approval.status.rejected')}
      </Chip>
    );
  if (reversed || line.reversalOfId)
    return (
      <Chip tone="neutral" icon="x">
        {t('foc.state_cancelled')}
      </Chip>
    );
  return (
    <Chip tone="ok" icon="check">
      {t('foc.state_applied')}
    </Chip>
  );
}

export interface SurchargeFoc {
  on: boolean;
  reason: FocRequestInput['reasonCode'] | '';
  note: string;
}
export const noSurchargeFoc = (): SurchargeFoc => ({ on: false, reason: '', note: '' });

/** The `requestFocForSurcharge` of a write (B9 / B15) – only when asked with a reason. */
export function surchargeFocBody(f: SurchargeFoc, amountVnd: number): FocRequestInput | undefined {
  return f.on && f.reason && amountVnd > 0
    ? { kind: 'foc', amountVnd, reasonCode: f.reason, note: f.note.trim() || undefined }
    : undefined;
}

/**
 * H13 13.4 pattern ("Xin miễn phụ thu (gửi duyệt)"), reused by H15 15.3 and H16 step 2: the surcharge is
 * written AND a FOC request for it goes with the same call (`requestFocForSurcharge`); the request reaches
 * every approver by itself (no approver to pick – BR-432).
 */
export function SurchargeFocFields({
  value,
  onChange,
  error,
}: {
  value: SurchargeFoc;
  onChange: (v: SurchargeFoc) => void;
  /** Field error of the last write (`requestFocForSurcharge.*`). */
  error?: string;
}) {
  const { t } = useI18n();
  const ids = useId();
  const set = (patch: Partial<SurchargeFoc>) => onChange({ ...value, ...patch });
  return (
    <>
      <Switch checked={value.on} onChange={(on) => set({ on })}>
        {t('ci.ask_foc')}
      </Switch>
      {value.on ? (
        <fieldset className="fieldset-plain">
          <legend className="li-s">{t('ci.ask_foc_help')}</legend>
          {FOC_REASONS.map((o) => (
            <label key={o.value} className="check">
              <input
                type="radio"
                name={`${ids}-foc`}
                checked={value.reason === o.value}
                onChange={() => set({ reason: o.value })}
              />
              {t(o.key)}
            </label>
          ))}
          <Field label={t('stay.note')} required={value.reason === 'other'} error={error}>
            {(fp) => (
              <input
                {...fp}
                className="input"
                maxLength={300}
                value={value.note}
                onChange={(e) => set({ note: e.target.value })}
              />
            )}
          </Field>
        </fieldset>
      ) : null}
    </>
  );
}

/** Why a surcharge FOC switched on cannot be sent yet (next to the locked button), or null. */
export function surchargeFocMissing(t: (k: string) => string, f: SurchargeFoc): string | null {
  if (!f.on) return null;
  if (!f.reason) return t('foc.needs_reason');
  if (f.reason === 'other' && f.note.trim().length < 3) return t('field_error.reason_required');
  return null;
}

const ROUTE: Array<{ role: Role; key: string }> = [
  { role: 'front_desk_lead', key: 'role.front_desk_lead' },
  { role: 'manager', key: 'role.manager' },
  { role: 'owner', key: 'role.owner' },
];
/** BR-433: lead ≤ 300.000 a time; above that manager / owner. */
const LEAD_PER_TIME = 300_000;

/**
 * H17 17.1 "Miễn phí · {dòng} · {số}" (US-007 AC1, AC6; BR-431…436, S4-23 (6)): FOC on a folio line (a special
 * discount only on a room night), the amount at most what is left on the line; FD/FDL waive minibar within
 * BR-436 themselves after re-entering their password – beyond the monthly limit it goes for approval.
 */
export function FocRequestDialog({
  folioId,
  line,
  lines,
  onClose,
  onDone,
}: {
  folioId: string;
  line: FolioLine;
  lines: FolioLine[];
  onClose: () => void;
  onDone: (a: ApprovalRequest) => void;
}) {
  const { t, vnd, money } = useI18n();
  const propertyId = usePropertyId();
  const { roles } = useSession();
  const toast = useToast();
  const ids = useId();
  const max = focHeadroom(lines, line);
  const [kind, setKind] = useState<FocRequestInput['kind']>('foc');
  const [amount, setAmount] = useState(vnd(max));
  const [reason, setReason] = useState<FocRequestInput['reasonCode'] | ''>('');
  const [note, setNote] = useState('');
  const [secret, setSecret] = useState('');
  const [touched, setTouched] = useState(false);
  const act = useSubmit();
  const selfAct = useSubmit();
  const value = amountOf(amount);
  const room = line.category === 'room';
  const fd = roles.includes('front_desk') || roles.includes('front_desk_lead');
  const mayApprove = roles.some((r) => r === 'owner' || r === 'manager');
  const selfApply =
    fd &&
    !mayApprove &&
    kind === 'foc' &&
    SELF_APPLY.categories.includes(line.category) &&
    value > 0 &&
    value <= SELF_APPLY.perTimeVnd;

  const amountError = !(value > 0)
    ? touched
      ? t('field_error.amount_not_positive')
      : undefined
    : value > max
      ? t('foc.over_max', { amount: money(max) })
      : undefined;
  const serverMax = (e: unknown) =>
    isApiError(e) && typeof e.problem.max === 'number'
      ? t('foc.over_max', { amount: money(e.problem.max) })
      : undefined;
  const reasonError = touched && !reason ? t('foc.needs_reason') : undefined;
  const noteError =
    touched && reason === 'other' && note.trim().length < 3
      ? t('field_error.reason_required')
      : (act.fields.note ?? selfAct.fields.note);
  const ready =
    value > 0 && value <= max && !!reason && (reason !== 'other' || note.trim().length >= 3);

  const body = (): FocRequestInput => ({
    kind,
    amountVnd: value,
    reasonCode: reason as FocRequestInput['reasonCode'],
    note: note.trim() || undefined,
  });
  const done = (a: ApprovalRequest, self: boolean) => {
    if (a.status === 'approved') toast(t('foc.applied', { amount: money(a.amountVnd) }));
    else if (self)
      toast(
        t('foc.over_self_limit', {
          amount: money(a.amountVnd),
          limit: money(SELF_APPLY.perMonthVnd),
        }),
      );
    else toast(t('foc.sent', { amount: money(a.amountVnd) }));
    onDone(a);
  };
  const send = async () => {
    setTouched(true);
    if (!ready) return;
    const out = await act.submit((idem) =>
      api.requestFoc({ propertyId, folioId }, line.id, body(), idem),
    );
    if (out) done(out.data, false);
  };
  const apply = async () => {
    setTouched(true);
    if (!ready || secret.length < 6) return;
    const out = await selfAct.submit((idem) =>
      api.requestFoc(
        { propertyId, folioId },
        line.id,
        { ...body(), authMethod: 'password', secret },
        idem,
      ),
    );
    setSecret('');
    if (out) done(out.data, true);
  };
  const routeRoles = ROUTE.filter((x) => x.role !== 'front_desk_lead' || value <= LEAD_PER_TIME)
    .map((x) => t(x.key).toLowerCase())
    .join(', ');

  return (
    <Modal
      open
      size="sm"
      title={t('foc.title', { line: lineLabel(t, line), amount: vnd(line.amountVnd) })}
      onClose={onClose}
      closeLabel={t('common.close')}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="pri"
            busy={act.busy}
            busyLabel={act.busyLabel}
            onClick={() => void send()}
          >
            {act.label(t('foc.send'))}
          </Button>
        </>
      }
    >
      {room ? (
        <div className="field">
          <span className="label-h" id={`${ids}-k`}>
            {t('foc.kind')}
          </span>
          <Seg
            labelledBy={`${ids}-k`}
            options={[
              { value: 'foc', label: t('foc.kind_foc') },
              { value: 'special_discount', label: t('foc.kind_discount') },
            ]}
            value={kind}
            onChange={setKind}
          />
        </div>
      ) : null}
      <MoneyField
        label={t('foc.amount')}
        help={t('foc.max', { amount: money(max) })}
        required
        value={amount}
        onChange={setAmount}
        error={amountError ?? serverMax(act.error) ?? serverMax(selfAct.error)}
      />
      <fieldset className="fieldset-plain" aria-describedby={reasonError ? `${ids}-r` : undefined}>
        <legend className="label-h">
          {t('handover.foc_reason')}{' '}
          <span className="req" aria-hidden="true">
            *
          </span>
        </legend>
        {FOC_REASONS.map((o) => (
          <label key={o.value} className="check">
            <input
              type="radio"
              name={`${ids}-reason`}
              checked={reason === o.value}
              onChange={() => setReason(o.value)}
            />
            {t(o.key)}
          </label>
        ))}
        {reasonError ? (
          <div className="err" id={`${ids}-r`}>
            <span>{reasonError}</span>
          </div>
        ) : null}
      </fieldset>
      <Field label={t('stay.note')} required={reason === 'other'} error={noteError}>
        {(p) => (
          <input
            {...p}
            className="input"
            maxLength={300}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        )}
      </Field>
      <Alert tone="info" icon="users">
        {t('foc.route_note', { roles: routeRoles })}
      </Alert>
      {act.view()}
      {selfApply ? (
        <section className="card inset stack" aria-labelledby={`${ids}-self`}>
          <p id={`${ids}-self`}>
            {t('foc.self_apply_short', {
              amount: money(value),
              limit: money(SELF_APPLY.perTimeVnd),
            })}
          </p>
          <Field label={t('ci.stepup_label')} error={selfAct.fields.secret}>
            {(p) => (
              <input
                {...p}
                type="password"
                autoComplete="current-password"
                className="input"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
              />
            )}
          </Field>
          {selfAct.code === 'REAUTH_FAILED' ? null : selfAct.view()}
          <Button
            variant="pri"
            busy={selfAct.busy}
            busyLabel={selfAct.busyLabel}
            disabled={secret.length < 6}
            onClick={() => void apply()}
          >
            {selfAct.label(t('foc.self_apply_submit'))}
          </Button>
          <p className="li-s">{t('foc.self_apply_note')}</p>
        </section>
      ) : null}
    </Modal>
  );
}
