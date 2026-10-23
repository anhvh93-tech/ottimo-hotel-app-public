import {
  isApiError,
  newIdempotencyKey,
  type Parameter,
  type ParameterReauth,
  type StrongReauth,
} from '@ottimo/api-client';
import { useI18n } from '@ottimo/i18n';
import { Alert, Button, Chip, Field, Modal } from '@ottimo/ui';
import { useState, type ClipboardEvent, type FormEvent } from 'react';
import { api } from '../app/api';
import { useBusinessDay } from '../app/businessDay';
import { problemView } from '../app/problem';
import { addDays } from '../app/reservations';
import { useToast } from '../app/toast';
import { isStrongReauthError, StrongReauthDialog } from '../components/StrongReauthDialog';
import { useResource } from '../hooks/useResource';
import { usePropertyId } from '../session/SessionProvider';

export const RECEIVING_KEY = 'payment_receiving_account';

/** What the API returns for this key (0.3.8): masked only – the full number never comes back. */
export interface ReceivingValue {
  bankBin: string;
  bankName?: string;
  accountNoMasked: string;
  accountName: string;
}

/**
 * Common NAPAS BINs – only to name the bank while typing (the server's table is the reference and its
 * `bankName` is what the screen shows after saving).
 */
const BANKS: Record<string, string> = {
  '970436': 'Vietcombank',
  '970407': 'Techcombank',
  '970418': 'BIDV',
  '970415': 'VietinBank',
  '970405': 'Agribank',
  '970416': 'ACB',
  '970422': 'MB',
  '970432': 'VPBank',
  '970423': 'TPBank',
  '970403': 'Sacombank',
  '970441': 'VIB',
  '970437': 'HDBank',
  '970443': 'SHB',
  '970448': 'OCB',
  '970426': 'MSB',
};

/** NAPAS holder name: capital letters without accents (Vietnamese marks and Đ removed), single spaces. */
export function napasName(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trimStart();
}

/** `setParameter.reauth` shape (0.3.8): the password goes as `secret`, plus the S2 factor. */
export function parameterReauth(r: StrongReauth): ParameterReauth {
  return {
    authMethod: 'password',
    secret: r.password,
    ...(r.totpCode ? { totpCode: r.totpCode } : {}),
    ...(r.recoveryCode ? { recoveryCode: r.recoveryCode } : {}),
  };
}

const valueOf = (p: Parameter) => p.value as ReceivingValue;

/**
 * SEC FB-R3-SEC-Q51-01 (BE-B cf0ce2f): no account number in the reason – a run of ≥ 6 digits (groups split
 * by spaces count as one run) or the number just typed → `422 reason ACCOUNT_NUMBER_NOT_ALLOWED`. Checked
 * here first so the S2 code is not spent on a refused request; ISO dates (2030-03-21) stay allowed.
 */
export function reasonHasAccountNumber(reason: string, accountNo?: string): boolean {
  const joined = reason.replace(/(\d)\s+(?=\d)/g, '$1');
  if (/\d{6,}/.test(joined)) return true;
  return !!accountNo && joined.includes(accountNo);
}

/** Server field error of the reason (`ACCOUNT_NUMBER_NOT_ALLOWED`) – shown under the reason field. */
function reasonServerError(err: unknown): boolean {
  return isApiError(err) && err.fieldErrors.some((f) => f.code === 'ACCOUNT_NUMBER_NOT_ALLOWED');
}

function AccountLine({ v }: { v: ReceivingValue }) {
  const { t } = useI18n();
  return (
    <div className="stack" style={{ gap: 2 }}>
      <b>{v.bankName ?? t('rcv.bank_unknown', { bin: v.bankBin })}</b>
      <span>
        <span className="sr-only">{t('rcv.masked_label')}: </span>
        <span className="mono">{v.accountNoMasked}</span> · {v.accountName}
      </span>
    </div>
  );
}

/**
 * R3-Q51 – "Tài khoản nhận chuyển khoản (VietQR)" on H05, **owner only** (SEC mục C, OpenAPI 0.3.8):
 * masked number + bank name only; a new account is typed twice, never pre-filled, kept only in the dialog's
 * state (gone when it closes or after saving), reviewed (bank · •••• last 4 · holder · date), then saved with
 * S2; it takes effect from the next business day at the earliest; a scheduled row can be cancelled (S2).
 * No "show full number" anywhere (Q51-8). [CHỜ UXD] hi-fi R3 – built from DS card / table / modal.
 */
export function ReceivingAccountSection() {
  const { t, date } = useI18n();
  const propertyId = usePropertyId();
  const toast = useToast();
  const today = useBusinessDay();
  const { state, reload } = useResource(async () => {
    try {
      return (await api.getParameterHistory({ propertyId, key: RECEIVING_KEY })).data;
    } catch (e) {
      // Not configured yet → empty state, not an error.
      if (isApiError(e) && e.status === 404) return null;
      throw e;
    }
  }, [propertyId]);
  const [editing, setEditing] = useState(false);
  const [cancelling, setCancelling] = useState<Parameter | null>(null);

  const data = state.data;
  const scheduled = (data?.history ?? [])
    .filter((h) => h.effectiveFrom > today)
    .sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));

  return (
    <section className="card" aria-labelledby="rcv-h" style={{ marginBottom: 16 }}>
      <div className="row">
        <h3 id="rcv-h" className="grow" style={{ margin: 0 }}>
          {t('rcv.title')}
        </h3>
        <Button size="sm" icon="key" onClick={() => setEditing(true)}>
          {t('rcv.change')}
        </Button>
      </div>
      <p className="muted">{t('rcv.lead')}</p>
      {state.status === 'error' && data === undefined ? (
        <Alert tone="bad">{problemView(t, state.error).text}</Alert>
      ) : state.status === 'loading' && data === undefined ? (
        <p className="muted">{t('common.loading')}</p>
      ) : !data ? (
        <Alert tone="warn">{t('rcv.none')}</Alert>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">{t('rcv.title')}</caption>
            <tbody>
              <tr>
                <td>
                  <Chip
                    tone={data.current ? 'ok' : 'neutral'}
                    icon={data.current ? 'check' : 'clock'}
                  >
                    {t('rcv.in_use')}
                  </Chip>
                </td>
                {data.current ? (
                  <>
                    <td>
                      <AccountLine v={valueOf(data.current)} />
                    </td>
                    <td>{t('rcv.from', { date: date(data.current.effectiveFrom) })}</td>
                  </>
                ) : (
                  // 0.3.8 bổ sung 2 (ARC Q51-01): first account only scheduled – 200 without `current`.
                  <td colSpan={2}>
                    {t('rcv.none_in_use', {
                      date: scheduled[0] ? date(scheduled[0].effectiveFrom) : '–',
                    })}
                  </td>
                )}
                <td />
              </tr>
              {scheduled.map((h) => (
                <tr key={h.effectiveFrom}>
                  <td>
                    <Chip tone="oak" icon="clock">
                      {t('rcv.scheduled')}
                    </Chip>
                  </td>
                  <td>
                    <AccountLine v={valueOf(h)} />
                  </td>
                  <td>{t('rcv.from', { date: date(h.effectiveFrom) })}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`${t('rcv.cancel_scheduled')}: ${date(h.effectiveFrom)}`}
                      onClick={() => setCancelling(h)}
                    >
                      {t('rcv.cancel_scheduled')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="li-s" style={{ marginBottom: 0 }}>
        {t('rcv.verify_hint')}
      </p>

      {editing ? (
        <ReceivingAccountDialog
          today={today}
          onClose={() => setEditing(false)}
          onSaved={(from) => {
            setEditing(false);
            toast(t('rcv.saved', { date: date(from) }));
            reload();
          }}
        />
      ) : null}
      {cancelling ? (
        <CancelScheduledDialog
          row={cancelling}
          onClose={() => setCancelling(null)}
          onDone={() => {
            setCancelling(null);
            toast(t('rcv.cancelled'));
            reload();
          }}
        />
      ) : null}
    </section>
  );
}

function CancelScheduledDialog({
  row,
  onClose,
  onDone,
}: {
  row: Parameter;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t, date } = useI18n();
  const propertyId = usePropertyId();
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | undefined>();
  const [banner, setBanner] = useState<string | null>(null);
  return (
    <StrongReauthDialog
      open
      title={t('rcv.cancel_title')}
      confirmLabel={t('rcv.cancel_scheduled')}
      danger
      onClose={onClose}
      onConfirm={async (reauth) => {
        if (reason.trim().length < 3) {
          setReasonError(t('field_error.reason_required'));
          return;
        }
        if (reasonHasAccountNumber(reason)) {
          setReasonError(t('rcv.reason_no_account'));
          return;
        }
        setReasonError(undefined);
        try {
          await api.cancelScheduledParameter(
            { propertyId, key: RECEIVING_KEY },
            {
              effectiveFrom: row.effectiveFrom,
              reason: reason.trim(),
              reauth: parameterReauth(reauth),
            },
            newIdempotencyKey(),
          );
          onDone();
        } catch (err) {
          if (isStrongReauthError(err)) throw err;
          if (reasonServerError(err)) setReasonError(t('rcv.reason_no_account'));
          else setBanner(problemView(t, err).text);
        }
      }}
    >
      <p style={{ marginTop: 0 }}>{t('rcv.cancel_body')}</p>
      <AccountLine v={valueOf(row)} />
      <p className="li-s">{t('rcv.from', { date: date(row.effectiveFrom) })}</p>
      {banner ? <Alert tone="bad">{banner}</Alert> : null}
      <Field label={t('rcv.reason')} required error={reasonError} help={t('rcv.reason_help')}>
        {(p) => (
          <input
            {...p}
            className="input"
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}
      </Field>
    </StrongReauthDialog>
  );
}

type Draft = {
  bankBin: string;
  accountNo: string;
  repeat: string;
  accountName: string;
  effectiveFrom: string;
  reason: string;
};

/**
 * New account form → review → S2. Every value lives only here (SEC Q51-3): no pre-fill, `autocomplete=off`,
 * no paste into the repeat field, nothing in Web Storage; closing the dialog drops it.
 */
function ReceivingAccountDialog({
  today,
  onClose,
  onSaved,
}: {
  today: string;
  onClose: () => void;
  onSaved: (effectiveFrom: string) => void;
}) {
  const { t, date } = useI18n();
  const propertyId = usePropertyId();
  const earliest = addDays(today, 1);
  const [d, setD] = useState<Draft>({
    bankBin: '',
    accountNo: '',
    repeat: '',
    accountName: '',
    effectiveFrom: earliest,
    reason: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [step, setStep] = useState<'form' | 'review' | 's2'>('form');
  const [banner, setBanner] = useState<string | null>(null);
  const set = (k: keyof Draft, v: string) => setD((x) => ({ ...x, [k]: v }));
  const bank = BANKS[d.bankBin];
  const dirty = Object.entries(d).some(([k, v]) => k !== 'effectiveFrom' && v !== '');

  const check = (): boolean => {
    const e: Partial<Record<keyof Draft, string>> = {};
    if (!/^\d{6}$/.test(d.bankBin)) e.bankBin = t('rcv.bin_invalid');
    if (!/^\d{6,19}$/.test(d.accountNo)) e.accountNo = t('rcv.account_no_invalid');
    else if (d.repeat !== d.accountNo) e.repeat = t('rcv.account_no_mismatch');
    const name = d.accountName.trim();
    if (!/^[A-Z0-9 ]{1,50}$/.test(name)) e.accountName = t('rcv.account_name_invalid');
    if (!d.effectiveFrom || d.effectiveFrom < earliest)
      e.effectiveFrom = t('rcv.effective_min', { date: date(earliest) });
    if (d.reason.trim().length < 3) e.reason = t('field_error.reason_required');
    else if (reasonHasAccountNumber(d.reason, d.accountNo)) e.reason = t('rcv.reason_no_account');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const toReview = (ev: FormEvent) => {
    ev.preventDefault();
    if (check()) setStep('review');
  };

  const save = async (reauth: StrongReauth) => {
    try {
      await api.setParameter(
        { propertyId, key: RECEIVING_KEY },
        {
          value: { bankBin: d.bankBin, accountNo: d.accountNo, accountName: d.accountName.trim() },
          effectiveFrom: d.effectiveFrom,
          reason: d.reason.trim(),
          reauth: parameterReauth(reauth),
        },
      );
      onSaved(d.effectiveFrom);
    } catch (err) {
      if (isStrongReauthError(err)) throw err;
      setStep('form');
      if (isApiError(err) && err.fieldErrors.some((f) => f.code === 'EFFECTIVE_FROM_TOMORROW')) {
        setErrors({ effectiveFrom: t('rcv.effective_min', { date: date(earliest) }) });
      } else if (reasonServerError(err)) {
        setErrors({ reason: t('rcv.reason_no_account') });
      } else {
        setBanner(problemView(t, err).text);
      }
    }
  };

  const noPaste = (e: ClipboardEvent) => e.preventDefault();

  if (step === 's2') {
    return (
      <StrongReauthDialog
        open
        title={t('rcv.save')}
        confirmLabel={t('rcv.save')}
        onClose={() => setStep('review')}
        onConfirm={save}
      >
        {t('rcv.review_body')}
      </StrongReauthDialog>
    );
  }

  return (
    <Modal
      open
      title={step === 'form' ? t('rcv.form_title') : t('rcv.review_title')}
      closeLabel={t('common.close')}
      onClose={onClose}
      dirty={dirty}
      unsavedLabels={{
        title: t('common.unsaved_title'),
        body: t('common.unsaved_body'),
        keep: t('common.unsaved_keep'),
        discard: t('common.unsaved_discard'),
      }}
      footer={
        step === 'form' ? (
          <>
            <Button onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" form="rcv-form" variant="pri">
              {t('rcv.review')}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => setStep('form')}>{t('common.edit_back')}</Button>
            <Button variant="pri" onClick={() => setStep('s2')}>
              {t('rcv.save')}
            </Button>
          </>
        )
      }
    >
      {banner ? <Alert tone="bad">{banner}</Alert> : null}
      {step === 'form' ? (
        <form id="rcv-form" onSubmit={toReview} noValidate autoComplete="off">
          <Field
            label={t('rcv.bank_bin')}
            required
            error={errors.bankBin}
            help={bank ? t('rcv.bank_found', { bank }) : undefined}
          >
            {(p) => (
              <input
                {...p}
                className="input mono"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                value={d.bankBin}
                onChange={(e) => set('bankBin', e.target.value.replace(/\D/g, ''))}
              />
            )}
          </Field>
          <Field label={t('rcv.account_no')} required error={errors.accountNo}>
            {(p) => (
              <input
                {...p}
                className="input mono"
                name="rcv-account"
                inputMode="numeric"
                autoComplete="off"
                spellCheck={false}
                maxLength={19}
                value={d.accountNo}
                onChange={(e) => set('accountNo', e.target.value.replace(/\D/g, ''))}
              />
            )}
          </Field>
          <Field label={t('rcv.account_no_repeat')} required error={errors.repeat}>
            {(p) => (
              <input
                {...p}
                className="input mono"
                name="rcv-account-repeat"
                inputMode="numeric"
                autoComplete="off"
                spellCheck={false}
                maxLength={19}
                value={d.repeat}
                onPaste={noPaste}
                onChange={(e) => set('repeat', e.target.value.replace(/\D/g, ''))}
              />
            )}
          </Field>
          <Field
            label={t('rcv.account_name')}
            required
            error={errors.accountName}
            help={t('rcv.account_name_help')}
          >
            {(p) => (
              <input
                {...p}
                className="input"
                autoComplete="off"
                maxLength={50}
                value={d.accountName}
                onChange={(e) => set('accountName', napasName(e.target.value))}
              />
            )}
          </Field>
          <Field
            label={t('config.effective_from')}
            required
            error={errors.effectiveFrom}
            help={t('rcv.effective_help')}
          >
            {(p) => (
              <input
                {...p}
                type="date"
                className="input"
                min={earliest}
                value={d.effectiveFrom}
                onChange={(e) => set('effectiveFrom', e.target.value)}
              />
            )}
          </Field>
          <Field label={t('rcv.reason')} required error={errors.reason} help={t('rcv.reason_help')}>
            {(p) => (
              <input
                {...p}
                className="input"
                maxLength={500}
                value={d.reason}
                onChange={(e) => set('reason', e.target.value)}
              />
            )}
          </Field>
        </form>
      ) : (
        <div className="stack">
          <p className="muted" style={{ margin: 0 }}>
            {t('rcv.review_body')}
          </p>
          <dl className="kv">
            <dt>{t('rcv.bank_bin')}</dt>
            <dd>{bank ?? t('rcv.bank_unknown', { bin: d.bankBin })}</dd>
            <dt>{t('rcv.masked_label')}</dt>
            <dd className="mono">•••• {d.accountNo.slice(-4)}</dd>
            <dt>{t('rcv.account_name')}</dt>
            <dd>{d.accountName.trim()}</dd>
            <dt>{t('rcv.review_effective')}</dt>
            <dd>{date(d.effectiveFrom)}</dd>
          </dl>
        </div>
      )}
    </Modal>
  );
}
