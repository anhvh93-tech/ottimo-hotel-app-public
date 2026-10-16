import { isApiError, type ApiError, type FieldError } from '@ottimo/api-client';
import { hasKey, type Args } from '@ottimo/i18n';

type T = (key: string, args?: Args) => string;

export interface ProblemView {
  text: string;
  /** Problem.requestId – shown for 5xx / unknown codes so staff can quote it. */
  reference?: string;
}

/** Codes whose message is only meaningful with extra args from the problem body. */
function argsFor(error: ApiError): Args {
  const p = error.problem;
  const args: Args = {};
  if (error.retryAfterSeconds !== undefined) {
    args.minutes = Math.max(1, Math.ceil(error.retryAfterSeconds / 60));
  } else if (p.code === 'RATE_LIMITED') {
    args.minutes = 15;
  }
  if (p.min !== undefined) args.min = String(p.min);
  if (p.max !== undefined) args.max = String(p.max);
  if (Array.isArray(p.allowed)) args.allowed = p.allowed.join(', ');
  if (p.requestId) args.request_id = p.requestId;
  return args;
}

/** Strings with `{request_id}` are only used when the server gave a real id (FB-R2-UXD-FE-04). */
function serverError(t: T, requestId: string | undefined): ProblemView {
  // No reference to quote (non-JSON 5xx from a proxy, client-side failure): the network sentence.
  if (!requestId) return { text: t('common.error_network_body') };
  return { text: t('error.server', { request_id: requestId }), reference: requestId };
}

/**
 * Request-level message (EP00 0.2): `error.<CODE>` from the UXD strings; never the raw `detail`.
 * Unknown codes / 5xx → `error.server` + requestId. Network failure → `common.error_network_body`.
 */
export function problemView(t: T, error: unknown): ProblemView {
  if (!isApiError(error)) return serverError(t, undefined);
  if (error.isNetwork) return { text: t('common.error_network_body') };
  const code = error.code;
  const args = argsFor(error);
  if (code === 'PARAM_OUT_OF_RANGE' && args.allowed === undefined) {
    return { text: t('error.PARAM_OUT_OF_RANGE_MINMAX', args) };
  }
  if (code !== 'INTERNAL_ERROR' && error.status < 500 && hasKey(`error.${code}`)) {
    return { text: t(`error.${code}`, args) };
  }
  return serverError(t, error.requestId ?? error.problem.requestId);
}

const FIELD_FALLBACK: Record<string, string> = {
  REQUIRED: 'common.required',
  PHONE_INVALID: 'booking.error.phone',
  TAX_CODE_INVALID: 'invoice.tax_id_error',
  DATE_IN_PAST: 'booking.error.past_date',
  AMOUNT_NOT_POSITIVE: 'field_error.amount_not_positive',
  VALUE_OUT_OF_RANGE: 'field_error.value_out_of_range',
  PHONE_COUNTRY_CODE_REQUIRED: 'field_error.phone_country',
  PASSWORD_TOO_SHORT: 'field_error.password_short',
  PASSWORD_SAME_AS_USERNAME: 'field_error.password_reused',
  REAUTH_FAILED: 'field_error.current_password_wrong',
};

/** FieldError.code → string key: `field.<CODE>` → `field_error.<code>` → known aliases → `error.<CODE>`. */
export function fieldErrorText(t: T, fe: FieldError, args: Args = {}): string {
  const candidates = [
    `field.${fe.code}`,
    `field_error.${fe.code.toLowerCase()}`,
    FIELD_FALLBACK[fe.code],
    `error.${fe.code}`,
  ].filter((k): k is string => Boolean(k));
  const key = candidates.find((k) => hasKey(k)) ?? 'field_error.not_in_list';
  return t(key, args);
}

/** Map `errors[]` of a 422 to { field: message } (first error per field wins). */
export function fieldErrors(t: T, error: unknown, args: Args = {}): Record<string, string> {
  if (!isApiError(error)) return {};
  const out: Record<string, string> = {};
  const extra = argsFor(error);
  for (const fe of error.fieldErrors) {
    const field = fe.field.replace(/^body\./, '');
    if (!(field in out)) {
      out[field] =
        fe.code === 'PARAM_OUT_OF_RANGE'
          ? problemView(t, error).text
          : fieldErrorText(t, fe, { ...extra, ...args });
    }
  }
  return out;
}
